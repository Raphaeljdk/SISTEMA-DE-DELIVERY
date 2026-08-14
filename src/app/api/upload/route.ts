/**
 * POST /api/upload
 * Upload genérico de imagem (produto, restaurante, avatar, etc).
 *
 * Body: multipart/form-data com campo "file" e opcional "folder"
 * Response: { url, publicId, provider }
 *
 * Requer autenticação (em produção: NextAuth session).
 * Limite: 5 MB por arquivo.
 */
import { NextRequest, NextResponse } from "next/server";
import { uploadImagem } from "@/lib/cloudinary";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "food-delivery";

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não encontrado no formulário (campo 'file')" },
        { status: 400 }
      );
    }

    // Validações
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo não suportado: ${file.type}. Aceitos: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)} MB. Máximo: 5 MB` },
        { status: 400 }
      );
    }

    // Converte File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadImagem(buffer, {
      fileName: file.name,
      folder,
      resourceType: "image",
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { error: "Erro interno ao fazer upload" },
      { status: 500 }
    );
  }
}
