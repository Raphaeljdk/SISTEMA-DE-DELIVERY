/**
 * PATCH /api/produtos/[id]
 * Atualiza produto (apenas dono do restaurante).
 *
 * DELETE /api/produtos/[id]
 * Remove produto (apenas dono do restaurante).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUsuarioFromRequest } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const usuario = await getUsuarioFromRequest(req);

    if (!usuario || usuario.tipoUsuario !== "RESTAURANTE") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Verifica se produto pertence ao restaurante do usuário
    const produto = await db.produto.findUnique({
      where: { id },
      select: { restauranteId: true },
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

    const body = await req.json();
    const dadosAtualizar: Record<string, unknown> = {};

    if (body.nome !== undefined) dadosAtualizar.nome = body.nome;
    if (body.descricao !== undefined) dadosAtualizar.descricao = body.descricao;
    if (body.preco !== undefined) dadosAtualizar.preco = parseFloat(body.preco);
    if (body.categoria !== undefined) dadosAtualizar.categoria = body.categoria;
    if (body.tempoPreparo !== undefined) dadosAtualizar.tempoPreparo = parseInt(body.tempoPreparo);
    if (body.imagemUrl !== undefined) dadosAtualizar.imagemUrl = body.imagemUrl;
    if (body.disponivel !== undefined) dadosAtualizar.disponivel = body.disponivel;

    const atualizado = await db.produto.update({
      where: { id },
      data: dadosAtualizar,
    });

    return NextResponse.json({ produto: atualizado });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const usuario = await getUsuarioFromRequest(req);

    if (!usuario || usuario.tipoUsuario !== "RESTAURANTE") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const produto = await db.produto.findUnique({
      where: { id },
      select: { restauranteId: true },
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

    await db.produto.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
