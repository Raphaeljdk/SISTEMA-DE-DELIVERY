/**
 * PATCH /api/restaurantes/[id]/imagem
 * Atualiza a imagem de capa de um restaurante.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadImagem } from "@/lib/cloudinary";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const restaurante = await db.restaurante.findUnique({ where: { id } });
    if (!restaurante) {
      return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo não suportado: ${file.type}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Arquivo excede 5 MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await uploadImagem(buffer, {
      fileName: file.name,
      folder: `restaurantes/${restaurante.id}`,
    });

    const restauranteAtualizado = await db.restaurante.update({
      where: { id },
      data: { imagemUrl: upload.url },
    });

    return NextResponse.json({
      ok: true,
      restaurante: restauranteAtualizado,
      upload,
    });
  } catch (error) {
    console.error("Erro ao atualizar imagem do restaurante:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
