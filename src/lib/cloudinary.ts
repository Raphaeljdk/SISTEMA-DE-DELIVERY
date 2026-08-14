/**
 * Cliente Cloudinary — singleton configurado via env vars.
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Se as variáveis não estiverem configuradas, o upload cai para fallback local
 * em /public/uploads (modo desenvolvimento).
 */
import { v2 as cloudinary } from "cloudinary";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
import path from "path";

let configured = false;

try {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
    console.log("[cloudinary] configurado:", process.env.CLOUDINARY_CLOUD_NAME);
  } else {
    console.warn("[cloudinary] não configurado — usando fallback local");
  }
} catch (e) {
  console.warn("[cloudinary] erro ao configurar:", e);
}

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  provider: "cloudinary" | "local";
}

/**
 * Faz upload de um buffer para Cloudinary (ou salva localmente em dev).
 *
 * @param buffer Buffer da imagem
 * @param options.fileName Nome original (opcional, usado para extensão)
 * @param options.folder Pasta no Cloudinary (ex: "produtos", "restaurantes")
 * @param options.resourceType "image" | "video" | "raw"
 */
export async function uploadImagem(
  buffer: Buffer,
  options: {
    fileName?: string;
    folder?: string;
    resourceType?: "image" | "video" | "raw";
  } = {}
): Promise<UploadResult> {
  const { fileName = "upload", folder = "food-delivery", resourceType = "image" } = options;

  // ─── Fallback local (dev) ───────────────────────────────────────
  if (!configured) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = fileName.split(".").pop() || "jpg";
    const localName = `${folder}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const localPath = path.join(uploadsDir, localName);
    writeFileSync(localPath, buffer);

    return {
      url: `/uploads/${localName}`,
      publicId: localName,
      provider: "local",
      bytes: buffer.length,
    };
  }

  // ─── Cloudinary ─────────────────────────────────────────────────
  return new Promise<UploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: `${folder}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        overwrite: false,
        transformation: [
          { width: 800, height: 600, crop: "limit" }, // max 800x600
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error) {
          console.error("[cloudinary] erro upload:", error);
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Cloudinary retornou resultado vazio"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          provider: "cloudinary",
        });
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Remove uma imagem do Cloudinary pelo public_id.
 * Se for URL local, tenta deletar o arquivo do disco.
 */
export async function deletarImagem(publicId: string): Promise<boolean> {
  if (!configured) {
    // Fallback local
    try {
      const localPath = path.join(process.cwd(), "public", "uploads", publicId);
      unlinkSync(localPath);
      return true;
    } catch {
      return false;
    }
  }
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (e) {
    console.error("[cloudinary] erro ao deletar:", e);
    return false;
  }
}

/**
 * Gera URL otimizada com transformações on-the-fly (apenas Cloudinary).
 */
export function urlOtimizada(
  publicIdOrUrl: string,
  transformations: { width?: number; height?: number; crop?: string; quality?: string | number } = {}
): string {
  if (!configured || publicIdOrUrl.startsWith("/uploads/")) {
    return publicIdOrUrl; // local fallback
  }
  try {
    return cloudinary.url(publicIdOrUrl, {
      transformation: [
        {
          width: transformations.width || 800,
          height: transformations.height || 600,
          crop: transformations.crop || "limit",
          quality: transformations.quality || "auto",
          fetch_format: "auto",
        },
      ],
    });
  } catch {
    return publicIdOrUrl;
  }
}
