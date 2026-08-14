"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  TrendingUp,
  ChefHat,
  CheckCircle2,
  AlertCircle,
  Phone,
  Bike,
  Package,
  Power,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarRating } from "@/components/star-rating";
import { GerenciarCardapio } from "@/components/gerenciar-cardapio";
import { toast } from "sonner";
import {
  formatCurrency,
  formatDate,
  formatTime,
  STATUS_PEDIDO_LABELS,
  STATUS_PEDIDO_COLORS,
} from "@/lib/format";

interface RestaurantePainelProps {
  dados: {
    restaurante: {
      id: string;
      nome: string;
      imagemUrl: string | null;
      aberto: boolean;
      avaliacaoMedia: number;
      categoria: string;
      endereco: string;
      taxaEntrega: number;
      tempoEntrega: number;
    };
    kpis: {
      pedidosHoje: number;
      pedidosPendentes: number;
      pedidosEmPreparo: number;
      pedidosSaiuEntrega: number;
      faturamentoHoje: number;
      ticketMedioHoje: number;
    };
    pedidosRecentes: Array<{
      id: string;
      status: string;
      valorTotal: number;
      valorFrete: number;
      dataHora: Date;
      enderecoEntrega: string;
      observacoes: string | null;
      itens: Array<{
        id: string;
        quantidade: number;
        observacoes: string | null;
        produto: { nome: string; imagemUrl: string | null };
      }>;
      cliente: { usuario: { nome: string; telefone: string } };
      entregador: { usuario: { nome: string } } | null;
      pagamento: { status: string; metodo: string };
    }>;
    produtos: Array<{
      id: string;
      nome: string;
      preco: number;
      disponivel: boolean;
      imagemUrl: string | null;
      categoria: string;
    }>;
  };
}

export function RestaurantePainel({ dados }: RestaurantePainelProps) {
  const { restaurante, kpis, pedidosRecentes, produtos } = dados;
  const [aberto, setAberto] = useState(restaurante.aberto);

  const handleToggleAberto = async () => {
    const novoEstado = !aberto;
    setAberto(novoEstado);
    try {
      await fetch(`/api/restaurantes/${restaurante.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aberto: novoEstado }),
      });
      toast.success(
        novoEstado
          ? "Restaurante aberto para pedidos"
          : "Restaurante fechado para pedidos"
      );
    } catch {
      setAberto(!novoEstado);
      toast.error("Erro ao alterar status");
    }
  };

  const pedidosPendentes = pedidosRecentes.filter(
    (p) => p.status === "PAGO" || p.status === "EM_PREPARACAO"
  );
  const pedidosEmEntrega = pedidosRecentes.filter(
    (p) => p.status === "SAIU_ENTREGA"
  );
  const pedidosConcluidos = pedidosRecentes.filter(
    (p) => p.status === "ENTREGUE" || p.status === "CANCELADO"
  );

  const kpiCards = [
    {
      label: "Pedidos hoje",
      value: kpis.pedidosHoje.toString(),
      sub: `${kpis.pedidosPendentes} pendentes`,
      icon: ShoppingBag,
      color: "text-blue-700",
      bg: "bg-blue-100",
    },
    {
      label: "Faturamento hoje",
      value: formatCurrency(kpis.faturamentoHoje),
      sub: "Receita do dia",
      icon: TrendingUp,
      color: "text-green-700",
      bg: "bg-green-100",
    },
    {
      label: "Em preparo",
      value: kpis.pedidosEmPreparo.toString(),
      sub: "Na cozinha",
      icon: ChefHat,
      color: "text-orange-700",
      bg: "bg-orange-100",
    },
    {
      label: "Saiu p/ entrega",
      value: kpis.pedidosSaiuEntrega.toString(),
      sub: "Em rota",
      icon: Bike,
      color: "text-purple-700",
      bg: "bg-purple-100",
    },
    {
      label: "Ticket médio",
      value: formatCurrency(kpis.ticketMedioHoje),
      sub: "Por pedido hoje",
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Avaliação",
      value: restaurante.avaliacaoMedia.toFixed(1),
      sub: "Média do restaurante",
      icon: ChefHat,
      color: "text-amber-700",
      bg: "bg-amber-100",
    },
  ];

  const PedidoCard = ({ pedido }: { pedido: RestaurantePainelProps["dados"]["pedidosRecentes"][0] }) => (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">#{pedido.id.slice(-6).toUpperCase()}</h4>
              <Badge
                variant="outline"
                className={`${STATUS_PEDIDO_COLORS[pedido.status]} text-[10px]`}
              >
                {STATUS_PEDIDO_LABELS[pedido.status]}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatTime(pedido.dataHora)} · {formatDate(pedido.dataHora)}
            </p>
            <p className="mt-1 text-sm font-medium">
              {pedido.cliente.usuario.nome}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              {pedido.cliente.usuario.telefone}
            </p>
          </div>
          <div className="text-right">
            <p className="font-serif text-lg font-bold text-primary">
              {formatCurrency(pedido.valorTotal)}
            </p>
            <p className="text-xs text-muted-foreground">
              {pedido.pagamento.metodo} · {pedido.pagamento.status}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 rounded-lg bg-muted/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Itens
          </p>
          {pedido.itens.map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-sm">
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">
                {item.quantidade}x
              </span>
              <div className="flex-1">
                <p className="leading-tight">{item.produto.nome}</p>
                {item.observacoes && (
                  <p className="text-xs italic text-muted-foreground">
                    {item.observacoes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          📍 {pedido.enderecoEntrega}
        </div>

        {pedido.entregador && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Bike className="h-3 w-3" />
            Entregador: <span className="font-medium text-foreground">{pedido.entregador.usuario.nome}</span>
          </div>
        )}

        {/* Action buttons based on status */}
        <div className="mt-3 flex gap-2">
          {pedido.status === "PAGO" && (
            <Button size="sm" className="flex-1">
              <ChefHat className="mr-1 h-3 w-3" />
              Iniciar preparo
            </Button>
          )}
          {pedido.status === "EM_PREPARACAO" && (
            <Button size="sm" className="flex-1">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Marcar como pronto
            </Button>
          )}
          {pedido.status === "SAIU_ENTREGA" && (
            <Button size="sm" variant="outline" className="flex-1">
              <Package className="mr-1 h-3 w-3" />
              Acompanhar entrega
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Header do restaurante */}
      <section className="border-b border-border/60 bg-paper">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                {restaurante.imagemUrl ? (
                  <Image
                    src={restaurante.imagemUrl}
                    alt={restaurante.nome}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-primary/10 text-primary">
                    <ChefHat className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="border-l-4 border-l-primary pl-4">
                <h1 className="font-serif text-2xl font-black md:text-3xl">
                  {restaurante.nome}
                </h1>
                <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                  <StarRating rating={restaurante.avaliacaoMedia} size={12} />
                  <span>·</span>
                  <span>{restaurante.categoria}</span>
                  <span>·</span>
                  <span>{restaurante.tempoEntrega} min</span>
                </div>
              </div>
            </div>

            <Button
              variant={aberto ? "default" : "outline"}
              onClick={handleToggleAberto}
            >
              <Power className="mr-2 h-4 w-4" />
              {aberto ? "Aberto" : "Fechado"}
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {kpiCards.map((kpi) => (
            <Card key={kpi.label} className="card-hover">
              <CardContent className="p-4">
                <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <p className="font-serif text-xl font-bold leading-tight">
                  {kpi.value}
                </p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/80">
                  {kpi.sub}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs: Pedidos / Cardápio */}
        <Tabs defaultValue="pendentes" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-4">
            <TabsTrigger value="pendentes">
              Pendentes ({pedidosPendentes.length})
            </TabsTrigger>
            <TabsTrigger value="entrega">
              Em entrega ({pedidosEmEntrega.length})
            </TabsTrigger>
            <TabsTrigger value="historico">
              Histórico ({pedidosConcluidos.length})
            </TabsTrigger>
            <TabsTrigger value="cardapio">
              Cardápio ({produtos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes" className="mt-4">
            {pedidosPendentes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhum pedido pendente. Tudo em dia!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {pedidosPendentes.map((p) => (
                  <PedidoCard key={p.id} pedido={p} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="entrega" className="mt-4">
            {pedidosEmEntrega.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center">
                <Bike className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhuma entrega em rota no momento.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {pedidosEmEntrega.map((p) => (
                  <PedidoCard key={p.id} pedido={p} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="historico" className="mt-4">
            {pedidosConcluidos.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhum pedido concluído ainda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {pedidosConcluidos.map((p) => (
                  <PedidoCard key={p.id} pedido={p} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cardapio" className="mt-4">
            <GerenciarCardapio restauranteId={restaurante.id} />
          </TabsContent>
        </Tabs>
      </section>
    </>
  );
}
