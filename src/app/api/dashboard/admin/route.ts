/**
 * GET /api/dashboard/admin
 * Métricas para o painel administrativo (GMV, pedidos, restaurantes, etc).
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [
      totalRestaurantes,
      totalClientes,
      totalEntregadores,
      totalPedidos,
      pedidosHoje,
      pedidosEmAndamento,
      restaurantesAbertos,
      faturamento,
      todosPedidos,
      todosRestaurantes,
    ] = await Promise.all([
      db.restaurante.count(),
      db.cliente.count(),
      db.entregador.count(),
      db.pedido.count(),
      db.pedido.count({
        where: {
          dataHora: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      db.pedido.count({
        where: {
          status: { in: ["PAGO", "EM_PREPARACAO", "SAIU_ENTREGA"] },
        },
      }),
      db.restaurante.count({ where: { aberto: true } }),
      db.pagamento.aggregate({
        _sum: { valor: true },
        where: { status: "APROVADO" },
      }),
      db.pedido.findMany({
        where: { status: { not: "CANCELADO" } },
        select: { valorTotal: true, dataHora: true, status: true },
      }),
      db.restaurante.findMany({
        select: {
          id: true,
          nome: true,
          imagemUrl: true,
          categoria: true,
          avaliacaoMedia: true,
          aberto: true,
          _count: { select: { pedidos: true } },
        },
      }),
    ]);

    const gmv = faturamento._sum.valor || 0;
    const ticketMedio = totalPedidos > 0 ? gmv / totalPedidos : 0;

    // Top restaurantes por número de pedidos
    const topRestaurantes = todosRestaurantes
      .map((r) => ({
        id: r.id,
        nome: r.nome,
        imagemUrl: r.imagemUrl,
        categoria: r.categoria,
        avaliacaoMedia: r.avaliacaoMedia,
        aberto: r.aberto,
        totalPedidos: r._count.pedidos,
      }))
      .sort((a, b) => b.totalPedidos - a.totalPedidos)
      .slice(0, 5);

    // Pedidos por status
    const pedidosPorStatus = {
      AGUARDANDO_PAGAMENTO: todosPedidos.filter((p) => p.status === "AGUARDANDO_PAGAMENTO").length,
      PAGO: todosPedidos.filter((p) => p.status === "PAGO").length,
      EM_PREPARACAO: todosPedidos.filter((p) => p.status === "EM_PREPARACAO").length,
      SAIU_ENTREGA: todosPedidos.filter((p) => p.status === "SAIU_ENTREGA").length,
      ENTREGUE: todosPedidos.filter((p) => p.status === "ENTREGUE").length,
      CANCELADO: todosPedidos.filter((p) => p.status === "CANCELADO").length,
    };

    // Faturamento últimos 7 dias (mock se não houver dados suficientes)
    const hoje = new Date();
    const faturamento7Dias: { dia: string; valor: number; pedidos: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      const dia = data.toISOString().slice(0, 10);
      const pedidosDia = todosPedidos.filter((p) => p.dataHora.toISOString().slice(0, 10) === dia);
      const valor = pedidosDia.reduce((acc, p) => acc + p.valorTotal, 0);
      faturamento7Dias.push({
        dia: data.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
        valor,
        pedidos: pedidosDia.length,
      });
    }

    return NextResponse.json({
      kpis: {
        totalRestaurantes,
        restaurantesAbertos,
        totalClientes,
        totalEntregadores,
        totalPedidos,
        pedidosHoje,
        pedidosEmAndamento,
        gmv,
        ticketMedio,
      },
      pedidosPorStatus,
      faturamento7Dias,
      topRestaurantes,
    });
  } catch (error) {
    console.error("Erro ao buscar métricas admin:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
