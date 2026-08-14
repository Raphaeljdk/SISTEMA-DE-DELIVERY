import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RastreamentoCard } from "@/components/rastreamento-card";
import { StarRating } from "@/components/star-rating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  MapPin,
  Phone,
  Bike,
  Receipt,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, STATUS_PEDIDO_LABELS, STATUS_PEDIDO_COLORS } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PedidoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    },
  });

  if (!pedido) notFound();

  // Timeline de status
  const statusSteps = [
    { key: "PAGO", label: "Pedido confirmado", icon: "✓" },
    { key: "EM_PREPARACAO", label: "Em preparação", icon: "🍳" },
    { key: "SAIU_ENTREGA", label: "Saiu para entrega", icon: "🛵" },
    { key: "ENTREGUE", label: "Entregue", icon: "📦" },
  ];
  const currentStepIndex = statusSteps.findIndex((s) => s.key === pedido.status);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-border/60 bg-paper">
          <div className="container mx-auto px-4 py-6">
            <Link href="/restaurantes">
              <Button variant="ghost" size="sm" className="mb-3">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="border-l-4 border-l-primary pl-4">
                <h1 className="font-serif text-2xl font-black md:text-3xl">
                  Pedido #{pedido.codigoRastreio || pedido.id.slice(-8)}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Realizado em {formatDate(pedido.dataHora)}
                </p>
              </div>
              <Badge
                className={`${STATUS_PEDIDO_COLORS[pedido.status]} border`}
              >
                {STATUS_PEDIDO_LABELS[pedido.status]}
              </Badge>
            </div>
          </div>
        </section>

        <section className="bg-background">
          <div className="container mx-auto grid grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-3">
            {/* Coluna principal */}
            <div className="space-y-6 lg:col-span-2">
              {/* Rastreamento timeline */}
              {pedido.status !== "CANCELADO" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">
                      Status do pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      {/* Linha conectora */}
                      <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />

                      <div className="space-y-6">
                        {statusSteps.map((step, idx) => {
                          const isDone = idx <= currentStepIndex;
                          const isCurrent = idx === currentStepIndex;
                          return (
                            <div key={step.key} className="relative flex items-start gap-4">
                              <div
                                className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                                  isDone
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-muted-foreground"
                                } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                              >
                                {isDone ? (
                                  <span className="text-sm">{step.icon}</span>
                                ) : (
                                  <span className="text-sm">{idx + 1}</span>
                                )}
                              </div>
                              <div className="flex-1 pt-1">
                                <p
                                  className={`font-medium ${
                                    isDone ? "text-foreground" : "text-muted-foreground"
                                  }`}
                                >
                                  {step.label}
                                </p>
                                {isCurrent && (
                                  <p className="mt-0.5 text-xs text-primary">
                                    Em andamento agora
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Rastreamento mapa (se em entrega) */}
              {(pedido.status === "SAIU_ENTREGA" || pedido.status === "EM_PREPARACAO") && (
                <RastreamentoCard
                  pedido={pedido}
                  entregador={pedido.entregador}
                />
              )}

              {/* Itens do pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">
                    Itens do pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pedido.itens.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
                    >
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                        {item.produto.imagemUrl ? (
                          <Image
                            src={item.produto.imagemUrl}
                            alt={item.produto.nome}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-primary/10 text-primary">
                            <span className="font-serif text-sm font-bold">
                              {item.produto.nome.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">
                            {item.quantidade}x
                          </span>
                          <h4 className="font-medium leading-tight text-foreground">
                            {item.produto.nome}
                          </h4>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatCurrency(item.precoUnitario)} cada
                        </p>
                        {item.observacoes && (
                          <p className="mt-1 text-xs italic text-muted-foreground">
                            &ldquo;{item.observacoes}&rdquo;
                          </p>
                        )}
                      </div>
                      <span className="font-medium">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Restaurante info */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">
                    Restaurante
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/restaurantes/${pedido.restaurante.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                  >
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                      {pedido.restaurante.imagemUrl && (
                        <Image
                          src={pedido.restaurante.imagemUrl}
                          alt={pedido.restaurante.nome}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {pedido.restaurante.nome}
                      </h4>
                      <StarRating rating={pedido.restaurante.avaliacaoMedia} size={12} />
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {pedido.restaurante.endereco}
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Coluna lateral */}
            <div className="space-y-6 lg:col-span-1">
              {/* Resumo financeiro */}
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <Receipt className="h-4 w-4 text-primary" />
                    Resumo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(pedido.valorTotal + pedido.valorDesconto - pedido.valorFrete)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span>{formatCurrency(pedido.valorFrete)}</span>
                  </div>
                  {pedido.valorDesconto > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Desconto</span>
                      <span>-{formatCurrency(pedido.valorDesconto)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-serif text-base font-bold">Total</span>
                    <span className="font-serif text-xl font-bold text-primary">
                      {formatCurrency(pedido.valorTotal)}
                    </span>
                  </div>

                  <Separator />

                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                      Pagamento
                    </p>
                    <p className="font-medium">
                      {pedido.formaPagamento === "PIX" && "PIX"}
                      {pedido.formaPagamento === "CARTAO" && "Cartão de crédito"}
                      {pedido.formaPagamento === "CARTEIRA" && "Carteira digital"}
                    </p>
                    {pedido.pagamento && (
                      <p className="text-xs text-muted-foreground">
                        Status: {pedido.pagamento.status}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                      Entrega para
                    </p>
                    <p className="text-sm">{pedido.enderecoEntrega}</p>
                  </div>

                  {pedido.entregador && (
                    <>
                      <Separator />
                      <div>
                        <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                          Entregador
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-muted">
                            {pedido.entregador.usuario.avatarUrl && (
                              <Image
                                src={pedido.entregador.usuario.avatarUrl}
                                alt={pedido.entregador.usuario.nome}
                                fill
                                sizes="32px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {pedido.entregador.usuario.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pedido.entregador.veiculo}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
