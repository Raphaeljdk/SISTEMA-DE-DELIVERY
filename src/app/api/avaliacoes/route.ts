/**
 * POST /api/avaliacoes
 * Cria avaliação para um pedido (após entrega).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface CriarAvaliacaoPayload {
  clienteId: string;
  pedidoId: string;
  restauranteId: string;
  nota: number; // 1-5
  comentario?: string;
  tipo?: "RESTAURANTE" | "ENTREGADOR" | "PRODUTO";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CriarAvaliacaoPayload;

    if (!body.clienteId || !body.pedidoId || !body.restauranteId || !body.nota) {
      return NextResponse.json(
        { error: "Dados incompletos para avaliação" },
        { status: 400 }
      );
    }

    if (body.nota < 1 || body.nota > 5) {
      return NextResponse.json(
        { error: "Nota deve estar entre 1 e 5" },
        { status: 400 }
      );
    }

    // Verificar se pedido existe e já foi entregue
    const pedido = await db.pedido.findUnique({
      where: { id: body.pedidoId },
    });
    if (!pedido) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }
    if (pedido.status !== "ENTREGUE") {
      return NextResponse.json(
        { error: "Apenas pedidos entregues podem ser avaliados" },
        { status: 400 }
      );
    }

    // Verificar se já existe avaliação
    const existente = await db.avaliacao.findUnique({
      where: { pedidoId: body.pedidoId },
    });
    if (existente) {
      return NextResponse.json(
        { error: "Pedido já avaliado" },
        { status: 400 }
      );
    }

    const avaliacao = await db.avaliacao.create({
      data: {
        clienteId: body.clienteId,
        restauranteId: body.restauranteId,
        pedidoId: body.pedidoId,
        nota: body.nota,
        comentario: body.comentario || null,
        tipo: body.tipo || "RESTAURANTE",
      },
      include: {
        cliente: {
          include: { usuario: { select: { nome: true, avatarUrl: true } } },
        },
      },
    });

    // Recalcular média do restaurante
    const todasAvaliacoes = await db.avaliacao.findMany({
      where: { restauranteId: body.restauranteId },
      select: { nota: true },
    });
    const media =
      todasAvaliacoes.reduce((acc, a) => acc + a.nota, 0) / todasAvaliacoes.length;

    await db.restaurante.update({
      where: { id: body.restauranteId },
      data: { avaliacaoMedia: Math.round(media * 10) / 10 },
    });

    return NextResponse.json({ avaliacao }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar avaliação:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
