"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Store,
  Users,
  Bike,
  ShoppingBag,
  TrendingUp,
  Clock,
  Activity,
  Star,
  ArrowUpRight,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { formatCurrency, formatDate, STATUS_PEDIDO_LABELS, STATUS_PEDIDO_COLORS } from "@/lib/format";

interface AdminDashboardProps {
  dados: {
    kpis: {
      totalRestaurantes: number;
      restaurantesAbertos: number;
      totalClientes: number;
      totalEntregadores: number;
      totalPedidos: number;
      pedidosHoje: number;
      pedidosEmAndamento: number;
      gmv: number;
      faturamentoHoje: number;
      ticketMedio: number;
    };
    pedidosPorStatus: Record<string, number>;
    faturamento7Dias: { dia: string; valor: number; pedidos: number }[];
    topRestaurantes: Array<{
      id: string;
      nome: string;
      imagemUrl: string | null;
      categoria: string;
      avaliacaoMedia: number;
      aberto: boolean;
      totalPedidos: number;
      totalProdutos: number;
    }>;
    ultimosPedidos: Array<{
      id: string;
      status: string;
      valorTotal: number;
      dataHora: Date;
      cliente: { usuario: { nome: string } };
      restaurante: { nome: string; imagemUrl: string | null };
    }>;
  };
}

export function AdminDashboard({ dados }: AdminDashboardProps) {
  const { kpis, pedidosPorStatus, faturamento7Dias, topRestaurantes, ultimosPedidos } = dados;

  const kpiCards = [
    {
      label: "Restaurantes",
      value: kpis.totalRestaurantes.toString(),
      sub: `${kpis.restaurantesAbertos} abertos agora`,
      icon: Store,
      color: "text-amber-700",
      bg: "bg-amber-100",
    },
    {
      label: "Clientes ativos",
      value: kpis.totalClientes.toString(),
      sub: "Cadastrados",
      icon: Users,
      color: "text-blue-700",
      bg: "bg-blue-100",
    },
    {
      label: "Entregadores",
      value: kpis.totalEntregadores.toString(),
      sub: "Parceiros",
      icon: Bike,
      color: "text-purple-700",
      bg: "bg-purple-100",
    },
    {
      label: "Pedidos hoje",
      value: kpis.pedidosHoje.toString(),
      sub: `${kpis.pedidosEmAndamento} em andamento`,
      icon: ShoppingBag,
      color: "text-green-700",
      bg: "bg-green-100",
    },
    {
      label: "GMV Total",
      value: formatCurrency(kpis.gmv),
      sub: "Volume bruto",
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Faturamento hoje",
      value: formatCurrency(kpis.faturamentoHoje),
      sub: "Receita do dia",
      icon: TrendingUp,
      color: "text-emerald-700",
      bg: "bg-emerald-100",
    },
    {
      label: "Ticket médio",
      value: formatCurrency(kpis.ticketMedio),
      sub: "Por pedido",
      icon: Activity,
      color: "text-orange-700",
      bg: "bg-orange-100",
    },
    {
      label: "Total pedidos",
      value: kpis.totalPedidos.toString(),
      sub: "Histórico",
      icon: ShoppingBag,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
  ];

  const maxFat = Math.max(...faturamento7Dias.map((f) => f.valor), 1);

  return (
    <div className="space-y-6">
      {/* KPIs grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="truncate text-xs uppercase tracking-wider text-muted-foreground">
                    {kpi.label}
                  </p>
                  <p className="mt-1 font-serif text-xl font-bold leading-tight md:text-2xl">
                    {kpi.value}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {kpi.sub}
                  </p>
                </div>
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Faturamento 7 dias */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-serif text-lg">
              <span>Faturamento — últimos 7 dias</span>
              <Badge variant="outline" className="font-mono text-xs">
                {formatCurrency(faturamento7Dias.reduce((acc, f) => acc + f.valor, 0))}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end justify-between gap-2">
              {faturamento7Dias.map((f, idx) => {
                const height = (f.valor / maxFat) * 100;
                return (
                  <div
                    key={idx}
                    className="group flex flex-1 flex-col items-center gap-2"
                  >
                    <div className="relative flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-primary to-accent transition-all duration-300 hover:from-secondary hover:to-primary"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      >
                        <div className="invisible absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background group-hover:visible">
                          {formatCurrency(f.valor)}
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium">{f.dia}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {f.pedidos} ped.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Status distribuição */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Status dos pedidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(pedidosPorStatus).map(([status, count]) => {
              const total = Object.values(pedidosPorStatus).reduce((a, b) => a + b, 0) || 1;
              const pct = (count / total) * 100;
              return (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {STATUS_PEDIDO_LABELS[status]}
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top restaurantes */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">
              Top restaurantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topRestaurantes.map((r, idx) => (
              <Link
                key={r.id}
                href={`/restaurantes/${r.id}`}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
              >
                <span className="font-serif text-base font-bold text-muted-foreground">
                  #{idx + 1}
                </span>
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  {r.imagemUrl ? (
                    <Image
                      src={r.imagemUrl}
                      alt={r.nome}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.nome}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <StarRating rating={r.avaliacaoMedia} size={10} />
                    <span>·</span>
                    <span>{r.totalPedidos} pedidos</span>
                  </div>
                </div>
                {r.aberto ? (
                  <Badge className="bg-green-100 text-green-800">Aberto</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Fechado
                  </Badge>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Últimos pedidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between font-serif text-lg">
              <span>Últimos pedidos</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/restaurantes">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ultimosPedidos.map((p) => (
              <Link
                key={p.id}
                href={`/pedidos/${p.id}`}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
              >
                <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  {p.restaurante.imagemUrl && (
                    <Image
                      src={p.restaurante.imagemUrl}
                      alt={p.restaurante.nome}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {p.restaurante.nome}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.cliente.usuario.nome} · {formatDate(p.dataHora)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(p.valorTotal)}
                  </p>
                  <Badge
                    variant="outline"
                    className={`mt-0.5 ${STATUS_PEDIDO_COLORS[p.status]} text-[10px]`}
                  >
                    {STATUS_PEDIDO_LABELS[p.status]}
                  </Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
