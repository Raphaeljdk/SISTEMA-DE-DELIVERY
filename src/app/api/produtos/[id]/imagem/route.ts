/**
 * PATCH /api/produtos/[id]/imagem
 * Atualiza a imagem de um produto (upload + atualiza Produto.imagemUrl).
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

    const produto = await db.produto.findUnique({ where: { id } });
    if (!produto) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
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
      folder: `produtos/${produto.restauranteId}`,
    });

    const produtoAtualizado = await db.produto.update({
      where: { id },
      data: { imagemUrl: upload.url },
    });

    return NextResponse.json({
      ok: true,
      produto: produtoAtualizado,
      upload,
    });
  } catch (error) {
    console.error("Erro ao atualizar imagem do produto:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
