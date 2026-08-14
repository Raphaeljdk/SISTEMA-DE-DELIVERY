import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RestaurantePainel } from "@/components/restaurante-painel";
import { EmptyState } from "@/components/empty-state";
import { ChefHat } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function getDados(restauranteId: string) {
  const restaurante = await db.restaurante.findUnique({
    where: { id: restauranteId },
    select: {
      id: true,
      nome: true,
      imagemUrl: true,
      aberto: true,
      avaliacaoMedia: true,
      categoria: true,
      endereco: true,
      taxaEntrega: true,
      tempoEntrega: true,
    },
  });

  if (!restaurante) return null;

  const inicioHoje = new Date(new Date().setHours(0, 0, 0, 0));

  const [
    pedidosHoje,
    pedidosPendentes,
    pedidosEmPreparo,
    pedidosSaiuEntrega,
    faturamentoHoje,
    pedidosRecentes,
    produtos,
    todosPedidos,
  ] = await Promise.all([
    db.pedido.count({
      where: {
        restauranteId: restaurante.id,
        dataHora: { gte: inicioHoje },
        status: { not: "CANCELADO" },
      },
    }),
    db.pedido.count({
      where: { restauranteId: restaurante.id, status: "PAGO" },
    }),
    db.pedido.count({
      where: { restauranteId: restaurante.id, status: "EM_PREPARACAO" },
    }),
    db.pedido.count({
      where: { restauranteId: restaurante.id, status: "SAIU_ENTREGA" },
    }),
    db.pedido.aggregate({
      _sum: { valorTotal: true },
      where: {
        restauranteId: restaurante.id,
        dataHora: { gte: inicioHoje },
        status: { not: "CANCELADO" },
      },
    }),
    db.pedido.findMany({
      where: { restauranteId: restaurante.id },
      include: {
        itens: { include: { produto: { select: { nome: true, imagemUrl: true } } } },
        cliente: { include: { usuario: { select: { nome: true, telefone: true } } } },
        entregador: { include: { usuario: { select: { nome: true } } } },
        pagamento: { select: { status: true, metodo: true } },
      },
      orderBy: { dataHora: "desc" },
      take: 15,
    }),
    db.produto.findMany({
      where: { restauranteId: restaurante.id },
      orderBy: { categoria: "asc" },
    }),
    db.pedido.findMany({
      where: { restauranteId: restaurante.id, status: { not: "CANCELADO" } },
      select: { valorTotal: true, dataHora: true },
    }),
  ]);

  return {
    restaurante,
    kpis: {
      pedidosHoje,
      pedidosPendentes,
      pedidosEmPreparo,
      pedidosSaiuEntrega,
      faturamentoHoje: faturamentoHoje._sum.valorTotal || 0,
      ticketMedioHoje:
        pedidosHoje > 0
          ? (faturamentoHoje._sum.valorTotal || 0) / pedidosHoje
          : 0,
    },
    pedidosRecentes,
    produtos,
    historicoFaturamento: todosPedidos,
  };
}

export default async function RestaurantePainelPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;

  // Se nenhum restaurante selecionado, lista os disponíveis para selecionar
  if (!params.id) {
    const restaurantes = await db.restaurante.findMany({
      select: {
        id: true,
        nome: true,
        imagemUrl: true,
        aberto: true,
        categoria: true,
        avaliacaoMedia: true,
      },
      orderBy: { nome: "asc" },
    });

    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 bg-muted/30">
          <section className="border-b border-border/60 bg-paper">
            <div className="container mx-auto px-4 py-8">
              <div className="border-l-4 border-l-primary pl-4">
                <h1 className="font-serif text-3xl font-black tracking-tight md:text-4xl">
                  Painel do Restaurante
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Selecione um restaurante para acessar o painel
                </p>
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restaurantes.map((r) => (
                <Link
                  key={r.id}
                  href={`/restaurante-painel?id=${r.id}`}
                  className="block rounded-lg border border-border/60 bg-background p-4 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-serif text-2xl font-bold text-primary">
                      {r.nome.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{r.nome}</h3>
                      <p className="text-xs text-muted-foreground">{r.categoria}</p>
                    </div>
                    {r.aberto ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        Aberto
                      </span>
                    ) : (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">
                        Fechado
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const dados = await getDados(params.id);

  if (!dados) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 bg-muted/30">
          <section className="container mx-auto px-4 py-16">
            <EmptyState
              icon={ChefHat}
              title="Restaurante não encontrado"
              description="O restaurante selecionado não existe ou foi removido."
            />
            <div className="mt-6 text-center">
              <Link href="/restaurante-painel">
                <Button>Voltar para seleção</Button>
              </Link>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <RestaurantePainel dados={dados} />
      </main>
      <SiteFooter />
    </div>
  );
}
