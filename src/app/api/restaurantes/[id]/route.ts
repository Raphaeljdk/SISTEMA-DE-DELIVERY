/**
 * PATCH /api/restaurantes/[id]
 * Atualiza dados do restaurante (aberto, taxa, etc).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const restaurante = await db.restaurante.findUnique({ where: { id } });
    if (!restaurante) {
      return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 });
    }

    const dadosAtualizar: Record<string, unknown> = {};
    if (typeof body.aberto === "boolean") dadosAtualizar.aberto = body.aberto;
    if (typeof body.tempoEntrega === "number") dadosAtualizar.tempoEntrega = body.tempoEntrega;
    if (typeof body.taxaEntrega === "number") dadosAtualizar.taxaEntrega = body.taxaEntrega;

    const atualizado = await db.restaurante.update({
      where: { id },
      data: dadosAtualizar,
    });

    return NextResponse.json({ restaurante: atualizado });
  } catch (error) {
    console.error("Erro ao atualizar restaurante:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
