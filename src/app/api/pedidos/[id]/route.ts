/**
 * GET /api/pedidos/[id] — Detalhes de um pedido específico
 * PATCH /api/pedidos/[id] — Atualiza status do pedido (extend: Reportar Problema, Cancelar)
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const STATUS_FLOW: Record<string, string[]> = {
  AGUARDANDO_PAGAMENTO: ["PAGO", "CANCELADO"],
  PAGO: ["EM_PREPARACAO", "CANCELADO"],
  EM_PREPARACAO: ["SAIU_ENTREGA", "CANCELADO"],
  SAIU_ENTREGA: ["ENTREGUE"],
  ENTREGUE: [],
  CANCELADO: [],
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pedido = await db.pedido.findUnique({
      where: { id },
      include: {
        itens: { include: { produto: true } },
        cliente: {
          include: { usuario: { select: { nome: true, avatarUrl: true, telefone: true } } },
        },
        restaurante: true,
        entregador: {
          include: { usuario: { select: { nome: true, avatarUrl: true, telefone: true } } },
        },
        pagamento: true,
        avaliacao: true,
        cupom: true,
      },
    });

    if (!pedido) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ pedido });
  } catch (error) {
    console.error("Erro ao buscar pedido:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const novoStatus = body.status as string;

    const pedido = await db.pedido.findUnique({ where: { id } });
    if (!pedido) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    // Validar transição de status
    const statusPermitidos = STATUS_FLOW[pedido.status] || [];
    if (!statusPermitidos.includes(novoStatus)) {
      return NextResponse.json(
        { error: `Transição inválida: ${pedido.status} → ${novoStatus}` },
        { status: 400 }
      );
    }

    // Se for cancelamento e tiver pagamento aprovado, estornar
    if (novoStatus === "CANCELADO" && pedido.pagamento) {
      await db.pagamento.updateMany({
        where: { pedidoId: id },
        data: { status: "ESTORNADO" },
      });
    }

    const pedidoAtualizado = await db.pedido.update({
      where: { id },
      data: { status: novoStatus },
      include: {
        itens: { include: { produto: true } },
        restaurante: true,
        pagamento: true,
      },
    });

    return NextResponse.json({ pedido: pedidoAtualizado });
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
