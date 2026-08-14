import Link from "next/link";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RestauranteCard } from "@/components/restaurante-card";
import { HeroSearch } from "@/components/hero-search";
import { CategoriasGrid } from "@/components/categorias-grid";
import { StatsBar } from "@/components/stats-bar";
import {
  Utensils,
  Clock,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function getDadosIniciais() {
  const [restaurantes, categorias, totalRestaurantes, totalPedidos] = await Promise.all([
    db.restaurante.findMany({
      where: { aberto: true },
      include: {
        produtos: {
          where: { disponivel: true },
          select: { id: true },
        },
      },
      orderBy: { avaliacaoMedia: "desc" },
      take: 6,
    }),
    db.restaurante.findMany({
      select: { categoria: true },
      distinct: ["categoria"],
    }),
    db.restaurante.count(),
    db.pedido.count(),
  ]);

  return {
    restaurantesDestaque: restaurantes.map((r) => ({
      ...r,
      produtos: r.produtos,
    })),
    categorias: categorias.map((c) => c.categoria),
    totalRestaurantes,
    totalPedidos,
  };
}

export default async function HomePage() {
  const dados = await getDadosIniciais();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* ─── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border/60 bg-paper">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              {/* Kicker */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                <span className="uppercase tracking-[0.2em]">
                  {dados.totalRestaurantes}+ restaurantes parceiros
                </span>
              </div>

              {/* Hero title */}
              <h1 className="font-serif text-4xl font-black leading-tight tracking-tight text-foreground md:text-6xl">
                Comida boa,
                <br />
                <span className="italic text-primary">entrega rápida</span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground md:text-lg">
                Peça seus pratos favoritos dos melhores restaurantes da cidade.
                Pagamento via PIX, cartão ou carteira digital. Rastreamento em
                tempo real.
              </p>

              {/* Search bar */}
              <div className="mt-8">
                <HeroSearch categorias={dados.categorias} />
              </div>
            </div>
          </div>

          {/* Decorative geometric accent (echoes PDF cover) */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-full w-1 bg-primary opacity-80"
            aria-hidden
          />
        </section>

        {/* ─── STATS BAR ────────────────────────────────────────────────── */}
        <StatsBar
          totalRestaurantes={dados.totalRestaurantes}
          totalPedidos={dados.totalPedidos}
        />

        {/* ─── CATEGORIAS ───────────────────────────────────────────────── */}
        <section className="border-b border-border/60 bg-background">
          <div className="container mx-auto px-4 py-12">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold md:text-3xl">
                  Categorias
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Navegue por tipo de culinária
                </p>
              </div>
            </div>
            <CategoriasGrid categorias={dados.categorias} />
          </div>
        </section>

        {/* ─── RESTAURANTES DESTAQUE ────────────────────────────────────── */}
        <section className="bg-background">
          <div className="container mx-auto px-4 py-12">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="font-serif text-2xl font-bold md:text-3xl">
                  Restaurantes em destaque
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Os mais bem avaliados, abertos agora
                </p>
              </div>
              <Link href="/restaurantes">
                <Button variant="outline" size="sm">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {dados.restaurantesDestaque.map((r) => (
                <RestauranteCard key={r.id} restaurante={r} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── DIFERENCIAIS ─────────────────────────────────────────────── */}
        <section className="border-y border-border/60 bg-secondary/5">
          <div className="container mx-auto px-4 py-14">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="font-serif text-2xl font-bold md:text-3xl">
                Por que escolher nossa plataforma
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Modelagem UML aplicada a um sistema real de food delivery
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-base font-bold">
                    Rastreamento em tempo real
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Acompanhe o entregador no mapa a cada 5 segundos via
                    WebSocket. Saiba exatamente quando chegará.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-base font-bold">
                    Pagamento seguro
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    PIX, cartão de crédito e carteira digital com criptografia
                    AES-256. Conformidade total com LGPD.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Utensils className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-base font-bold">
                    {dados.totalRestaurantes}+ restaurantes
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    De hambúrgueres artesanais a sushi premium, todos os tipos
                    de culinária em um só app.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-base font-bold">
                    Multiplataforma
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    App mobile (iOS/Android), web responsivo e painéis
                    dedicados para restaurantes e administradores.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ─── CTA: PAINÉIS ─────────────────────────────────────────────── */}
        <section className="bg-background">
          <div className="container mx-auto px-4 py-14">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card className="overflow-hidden bg-secondary text-secondary-foreground">
                <CardContent className="p-8 md:p-10">
                  <div className="mb-3 text-xs uppercase tracking-[0.2em] text-primary">
                    Para estabelecimentos
                  </div>
                  <h3 className="font-serif text-2xl font-bold md:text-3xl">
                    Painel do Restaurante
                  </h3>
                  <p className="mt-3 text-sm text-secondary-foreground/80">
                    Gerencie pedidos em tempo real, atualize o cardápio, crie
                    promoções e acompanhe métricas de venda em um dashboard
                    completo.
                  </p>
                  <Link href="/restaurante-painel">
                    <Button className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
                      Acessar painel
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-8 md:p-10">
                  <div className="mb-3 text-xs uppercase tracking-[0.2em] text-primary">
                    Para administradores
                  </div>
                  <h3 className="font-serif text-2xl font-bold md:text-3xl">
                    Painel Administrativo
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Métricas globais (GMV, ticket médio), gestão de usuários e
                    restaurantes, auditoria de transações e relatórios
                    exportáveis.
                  </p>
                  <Link href="/admin">
                    <Button variant="outline" className="mt-6">
                      Acessar dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
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
