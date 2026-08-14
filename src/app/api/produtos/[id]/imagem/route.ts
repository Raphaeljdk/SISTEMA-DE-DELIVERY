/**
 * PATCH /api/produtos/[id]/imagem
 * Atualiza a imagem de um produto (apenas dono do restaurante logado).
 *
 * Body: multipart/form-data com campo "file"
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { uploadImagem } from "@/lib/cloudinary";
import { getUsuarioFromRequest } from "@/lib/auth";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const usuario = await getUsuarioFromRequest(req);

    if (!usuario || usuario.tipoUsuario !== "RESTAURANTE") {
      return NextResponse.json(
        { error: "Apenas restaurantes podem fazer upload" },
        { status: 403 }
      );
    }

    const produto = await db.produto.findUnique({
      where: { id },
      select: { restauranteId: true, nome: true },
    });

    if (!produto) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    if (produto.restauranteId !== usuario.restauranteId) {
      return NextResponse.json(
        { error: "Este produto não pertence ao seu restaurante" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo não suportado: ${file.type}. Aceitos: JPEG, PNG, WebP` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Arquivo excede 5 MB (${(file.size / 1024 / 1024).toFixed(2)} MB)` },
        { status: 400 }
      );
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
