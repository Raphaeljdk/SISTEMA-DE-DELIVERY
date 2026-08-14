/**
 * GET /api/restaurantes
 * Lista restaurantes com filtros (categoria, busca, aberto).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoria = searchParams.get("categoria");
    const busca = searchParams.get("busca");
    const aberto = searchParams.get("aberto");
    const limite = parseInt(searchParams.get("limite") || "50");

    const where: Record<string, unknown> = {};
    if (categoria && categoria !== "Todas") {
      where.categoria = categoria;
    }
    if (aberto === "true") {
      where.aberto = true;
    }
    if (busca) {
      where.OR = [
        { nome: { contains: busca } },
        { descricao: { contains: busca } },
        { categoria: { contains: busca } },
      ];
    }

    const restaurantes = await db.restaurante.findMany({
      where,
      include: {
        produtos: {
          where: { disponivel: true },
          select: { id: true, nome: true, preco: true, imagemUrl: true },
        },
      },
      orderBy: { avaliacaoMedia: "desc" },
      take: limite,
    });

    return NextResponse.json({
      total: restaurantes.length,
      restaurantes,
    });
  } catch (error) {
    console.error("Erro ao listar restaurantes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
