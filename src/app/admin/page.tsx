import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdminDashboard } from "@/components/admin-dashboard";
import { EmptyState } from "@/components/empty-state";
import { LayoutDashboard } from "lucide-react";

export const dynamic = "force-dynamic";

async function getDados() {
  const [
    totalRestaurantes,
    totalClientes,
    totalEntregadores,
    totalPedidos,
    restaurantesAbertos,
    pedidosEmAndamento,
    faturamento,
    todosPedidos,
    todosRestaurantes,
    ultimosPedidos,
  ] = await Promise.all([
    db.restaurante.count(),
    db.cliente.count(),
    db.entregador.count(),
    db.pedido.count(),
    db.restaurante.count({ where: { aberto: true } }),
    db.pedido.count({
      where: { status: { in: ["PAGO", "EM_PREPARACAO", "SAIU_ENTREGA"] } },
    }),
    db.pagamento.aggregate({
      _sum: { valor: true },
      where: { status: "APROVADO" },
    }),
    db.pedido.findMany({
      where: { status: { not: "CANCELADO" } },
      select: { valorTotal: true, dataHora: true, status: true },
    }),
    db.restaurante.findMany({
      include: {
        _count: { select: { pedidos: true, produtos: true } },
      },
      orderBy: { avaliacaoMedia: "desc" },
    }),
    db.pedido.findMany({
      include: {
        cliente: { include: { usuario: { select: { nome: true } } } },
        restaurante: { select: { nome: true, imagemUrl: true } },
      },
      orderBy: { dataHora: "desc" },
      take: 8,
    }),
  ]);

  const gmv = faturamento._sum.valor || 0;
  const ticketMedio = totalPedidos > 0 ? gmv / totalPedidos : 0;

  const pedidosPorStatus = {
    AGUARDANDO_PAGAMENTO: todosPedidos.filter((p) => p.status === "AGUARDANDO_PAGAMENTO").length,
    PAGO: todosPedidos.filter((p) => p.status === "PAGO").length,
    EM_PREPARACAO: todosPedidos.filter((p) => p.status === "EM_PREPARACAO").length,
    SAIU_ENTREGA: todosPedidos.filter((p) => p.status === "SAIU_ENTREGA").length,
    ENTREGUE: todosPedidos.filter((p) => p.status === "ENTREGUE").length,
    CANCELADO: todosPedidos.filter((p) => p.status === "CANCELADO").length,
  };

  const inicioHoje = new Date(new Date().setHours(0, 0, 0, 0));
  const pedidosHoje = todosPedidos.filter((p) => p.dataHora >= inicioHoje).length;
  const faturamentoHoje = todosPedidos
    .filter((p) => p.dataHora >= inicioHoje)
    .reduce((acc, p) => acc + p.valorTotal, 0);

  const hoje = new Date();
  const faturamento7Dias: { dia: string; valor: number; pedidos: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const data = new Date(hoje);
    data.setDate(data.getDate() - i);
    const diaStr = data.toISOString().slice(0, 10);
    const pedidosDia = todosPedidos.filter(
      (p) => p.dataHora.toISOString().slice(0, 10) === diaStr
    );
    faturamento7Dias.push({
      dia: data.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
      valor: pedidosDia.reduce((acc, p) => acc + p.valorTotal, 0),
      pedidos: pedidosDia.length,
    });
  }

  return {
    kpis: {
      totalRestaurantes,
      restaurantesAbertos,
      totalClientes,
      totalEntregadores,
      totalPedidos,
      pedidosHoje,
      pedidosEmAndamento,
      gmv,
      faturamentoHoje,
      ticketMedio,
    },
    pedidosPorStatus,
    faturamento7Dias,
    topRestaurantes: todosRestaurantes
      .map((r) => ({
        id: r.id,
        nome: r.nome,
        imagemUrl: r.imagemUrl,
        categoria: r.categoria,
        avaliacaoMedia: r.avaliacaoMedia,
        aberto: r.aberto,
        totalPedidos: r._count.pedidos,
        totalProdutos: r._count.produtos,
      }))
      .sort((a, b) => b.totalPedidos - a.totalPedidos)
      .slice(0, 6),
    ultimosPedidos,
  };
}

export default async function AdminPage() {
  const dados = await getDados();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 bg-muted/30">
        <section className="border-b border-border/60 bg-paper">
          <div className="container mx-auto px-4 py-8">
            <div className="border-l-4 border-l-primary pl-4">
              <h1 className="font-serif text-3xl font-black tracking-tight md:text-4xl">
                Painel Administrativo
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Métricas globais da plataforma · {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          {dados.kpis.totalPedidos === 0 ? (
            <EmptyState
              icon={LayoutDashboard}
              title="Nenhum dado disponível ainda"
              description="Os dados aparecerão aqui após os primeiros pedidos serem processados."
            />
          ) : (
            <AdminDashboard dados={dados} />
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
