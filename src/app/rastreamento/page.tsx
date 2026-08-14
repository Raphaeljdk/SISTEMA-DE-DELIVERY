import { db } from "@/lib/db";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ArrowRight,
  Package,
  Clock,
  MapPin,
} from "lucide-react";
import { formatCurrency, formatDate, STATUS_PEDIDO_LABELS, STATUS_PEDIDO_COLORS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RastreamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const params = await searchParams;
  const codigo = params.codigo?.trim();

  let pedido: Awaited<ReturnType<typeof db.pedido.findFirst>> = null;

  if (codigo) {
    pedido = await db.pedido.findFirst({
      where: {
        OR: [
          { codigoRastreio: codigo },
          { id: codigo },
        ],
      },
      include: {
        itens: { include: { produto: true } },
        restaurante: true,
        cliente: {
          include: { usuario: { select: { nome: true } } },
        },
        entregador: {
          include: { usuario: { select: { nome: true, avatarUrl: true, telefone: true } } },
        },
        pagamento: true,
      },
    });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border/60 bg-paper">
          <div className="container mx-auto px-4 py-10">
            <div className="border-l-4 border-l-primary pl-4">
              <h1 className="font-serif text-3xl font-black tracking-tight md:text-4xl">
                Rastreamento de Pedido
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Acompanhe o status do seu pedido em tempo real
              </p>
            </div>

            <form className="mt-6 flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  name="codigo"
                  defaultValue={codigo || ""}
                  placeholder="Digite o código de rastreio (ex: FD-20260814-1001)"
                  className="h-12 w-full rounded-md border border-border bg-background pl-10 pr-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button type="submit" size="lg">
                Rastrear
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </section>

        <section className="bg-background">
          <div className="container mx-auto px-4 py-8">
            {!codigo ? (
              <EmptyState
                icon={Search}
                title="Digite o código de rastreio"
                description="Use o código que você recebeu por email ou notificação após o pedido. Exemplo: FD-20260814-1001"
              />
            ) : !pedido ? (
              <EmptyState
                icon={Package}
                title="Pedido não encontrado"
                description={`Nenhum pedido encontrado com o código "${codigo}". Verifique e tente novamente.`}
              />
            ) : (
              <div className="mx-auto max-w-2xl space-y-6">
                {/* Status card */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Pedido
                        </p>
                        <h2 className="font-serif text-xl font-bold">
                          #{pedido.codigoRastreio || pedido.id.slice(-8)}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDate(pedido.dataHora)}
                        </p>
                      </div>
                      <Badge
                        className={`${STATUS_PEDIDO_COLORS[pedido.status]} border`}
                      >
                        {STATUS_PEDIDO_LABELS[pedido.status]}
                      </Badge>
                    </div>

                    {/* Timeline horizontal */}
                    <div className="mt-6 flex items-center justify-between">
                      {[
                        { key: "PAGO", label: "Confirmado", icon: "✓" },
                        { key: "EM_PREPARACAO", label: "Preparando", icon: "🍳" },
                        { key: "SAIU_ENTREGA", label: "A caminho", icon: "🛵" },
                        { key: "ENTREGUE", label: "Entregue", icon: "📦" },
                      ].map((step, idx, arr) => {
                        const stepIndex = arr.findIndex((s) => s.key === pedido.status);
                        const isActive = idx <= stepIndex;
                        const isCurrent = idx === stepIndex;
                        return (
                          <div key={step.key} className="flex flex-1 items-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm ${
                                  isActive
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-muted-foreground"
                                } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                              >
                                {isActive ? step.icon : idx + 1}
                              </div>
                              <span
                                className={`text-[10px] text-center ${
                                  isActive ? "font-medium text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                            {idx < arr.length - 1 && (
                              <div
                                className={`mx-2 h-0.5 flex-1 ${
                                  idx < stepIndex ? "bg-primary" : "bg-border"
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {pedido.status !== "ENTREGUE" && pedido.status !== "CANCELADO" && (
                      <div className="mt-6 rounded-lg bg-primary/5 p-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium text-primary">
                            Tempo estimado de entrega: {pedido.tempoEstimado} minutos
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Restaurante + Endereço */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Card>
                    <CardContent className="p-4">
                      <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                        Restaurante
                      </p>
                      <p className="font-medium">{pedido.restaurante.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {pedido.restaurante.categoria}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                        Entrega para
                      </p>
                      <p className="flex items-start gap-1.5 text-sm">
                        <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
                        {pedido.enderecoEntrega}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Itens */}
                <Card>
                  <CardContent className="p-4">
                    <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                      Itens do pedido
                    </p>
                    <div className="space-y-2">
                      {pedido.itens.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div>
                            <span className="font-medium">
                              {item.quantidade}x
                            </span>{" "}
                            {item.produto.nome}
                            {item.observacoes && (
                              <p className="text-xs italic text-muted-foreground">
                                {item.observacoes}
                              </p>
                            )}
                          </div>
                          <span className="font-medium">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 border-t border-border/60 pt-3 text-right">
                      <span className="font-serif text-lg font-bold text-primary">
                        {formatCurrency(pedido.valorTotal)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* CTA para ver detalhes */}
                <div className="text-center">
                  <Button asChild>
                    <Link href={`/pedidos/${pedido.id}`}>
                      Ver detalhes completos
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
