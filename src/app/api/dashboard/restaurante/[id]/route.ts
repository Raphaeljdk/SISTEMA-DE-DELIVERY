/**
 * GET /api/dashboard/restaurante/[id]
 * Métricas do painel do restaurante: pedidos do dia, faturamento, etc.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const restaurante = await db.restaurante.findUnique({
      where: { id },
      select: { id: true, nome: true, imagemUrl: true, aberto: true, avaliacaoMedia: true },
    });

    if (!restaurante) {
      return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 });
    }

    const inicioHoje = new Date(new Date().setHours(0, 0, 0, 0));

    const [
      pedidosHoje,
      pedidosPendentes,
      pedidosEmPreparo,
      pedidosSaiuEntrega,
      faturamentoHoje,
      todosPedidos,
      produtos,
    ] = await Promise.all([
      db.pedido.count({
        where: {
          restauranteId: id,
          dataHora: { gte: inicioHoje },
          status: { not: "CANCELADO" },
        },
      }),
      db.pedido.count({
        where: { restauranteId: id, status: "PAGO" },
      }),
      db.pedido.count({
        where: { restauranteId: id, status: "EM_PREPARACAO" },
      }),
      db.pedido.count({
        where: { restauranteId: id, status: "SAIU_ENTREGA" },
      }),
      db.pedido.aggregate({
        _sum: { valorTotal: true },
        where: {
          restauranteId: id,
          dataHora: { gte: inicioHoje },
          status: { not: "CANCELADO" },
        },
      }),
      db.pedido.findMany({
        where: { restauranteId: id },
        include: {
          itens: { include: { produto: { select: { nome: true, imagemUrl: true } } } },
          cliente: { include: { usuario: { select: { nome: true, telefone: true } } } },
          entregador: { include: { usuario: { select: { nome: true } } } },
          pagamento: { select: { status: true, metodo: true } },
        },
        orderBy: { dataHora: "desc" },
        take: 30,
      }),
      db.produto.findMany({
        where: { restauranteId: id },
        select: { id: true, nome: true, preco: true, disponivel: true, imagemUrl: true },
      }),
    ]);

    // Pedidos por status (últimos 30)
    const statusDist: Record<string, number> = {};
    for (const p of todosPedidos) {
      statusDist[p.status] = (statusDist[p.status] || 0) + 1;
    }

    return NextResponse.json({
      restaurante,
      kpis: {
        pedidosHoje,
        pedidosPendentes,
        pedidosEmPreparo,
        pedidosSaiuEntrega,
        faturamentoHoje: faturamentoHoje._sum.valorTotal || 0,
        ticketMedioHoje:
          pedidosHoje > 0 ? (faturamentoHoje._sum.valorTotal || 0) / pedidosHoje : 0,
      },
      pedidosRecentes: todosPedidos.slice(0, 10),
      statusDistribuicao: statusDist,
      produtos,
    });
  } catch (error) {
    console.error("Erro ao buscar dashboard do restaurante:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
