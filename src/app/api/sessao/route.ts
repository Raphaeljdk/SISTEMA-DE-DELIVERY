/**
 * GET /api/sessao
 * Retorna o cliente demo da sessão (Maria Santos).
 * Em produção, isto viria do NextAuth session.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const cliente = await db.cliente.findFirst({
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, avatarUrl: true, telefone: true },
        },
        enderecos: true,
        cartoes: true,
      },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Nenhum cliente encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ cliente });
  } catch (error) {
    console.error("Erro ao buscar sessão:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
