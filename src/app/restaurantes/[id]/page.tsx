import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StarRating } from "@/components/star-rating";
import { ProdutoCard } from "@/components/produto-card";
import { AvaliacoesList } from "@/components/avaliacoes-list";
import { Clock, Bike, MapPin, Utensils, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RestauranteDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const data = await db.restaurante.findUnique({
    where: { id },
    include: {
      produtos: { orderBy: { categoria: "asc" } },
      avaliacoes: {
        include: {
          cliente: {
            include: { usuario: { select: { nome: true, avatarUrl: true } } },
          },
        },
        orderBy: { dataHora: "desc" },
        take: 10,
      },
      cupons: {
        where: {
          ativo: true,
          validade: { gte: new Date() },
        },
      },
    },
  });

  if (!data) notFound();

  // Agrupar produtos por categoria
  const produtosPorCategoria: Record<string, typeof data.produtos> = {};
  for (const p of data.produtos) {
    if (!produtosPorCategoria[p.categoria]) {
      produtosPorCategoria[p.categoria] = [];
    }
    produtosPorCategoria[p.categoria].push(p);
  }

  // Calcular média real
  const mediaAvaliacoes =
    data.avaliacoes.length > 0
      ? data.avaliacoes.reduce((acc, a) => acc + a.nota, 0) / data.avaliacoes.length
      : data.avaliacaoMedia;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero do restaurante */}
        <section className="relative h-64 w-full overflow-hidden border-b border-border/60 md:h-80">
          {data.imagemUrl ? (
            <Image
              src={data.imagemUrl}
              alt={data.nome}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/30 to-secondary/30">
              <Utensils className="h-16 w-16 text-primary" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="container absolute inset-x-0 bottom-0 mx-auto px-4 pb-6 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-background/90 text-foreground hover:bg-background">
                {data.categoria}
              </Badge>
              {data.aberto ? (
                <Badge className="bg-green-500 text-white hover:bg-green-600">
                  Aberto agora
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-500 text-white hover:bg-red-600">
                  Fechado
                </Badge>
              )}
              {data.cupons.length > 0 && (
                <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Tag className="mr-1 h-3 w-3" />
                  {data.cupons.length} cupom(s) disponível(is)
                </Badge>
              )}
            </div>

            <h1 className="mt-3 font-serif text-3xl font-black tracking-tight md:text-5xl">
              {data.nome}
            </h1>

            {data.descricao && (
              <p className="mt-2 max-w-2xl text-sm text-white/90 md:text-base">
                {data.descricao}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <StarRating rating={mediaAvaliacoes} size={16} />
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {data.tempoEntrega} min
              </span>
              <span className="flex items-center gap-1.5">
                <Bike className="h-4 w-4" />
                Entrega: {formatCurrency(data.taxaEntrega)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {data.endereco}
              </span>
            </div>
          </div>
        </section>

        {/* Cupom banner */}
        {data.cupons.length > 0 && (
          <section className="border-b border-border/60 bg-primary/5">
            <div className="container mx-auto px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-primary">Cupons disponíveis:</span>
                {data.cupons.map((c) => (
                  <code
                    key={c.id}
                    className="rounded bg-primary px-2 py-0.5 font-mono text-xs text-primary-foreground"
                  >
                    {c.codigo}
                    {c.tipo === "PERCENTUAL"
                      ? ` (${c.descontoPercentual}% off)`
                      : c.tipo === "FIXO"
                      ? ` (R$ ${c.descontoFixo} off)`
                      : " (Frete grátis)"}
                  </code>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Cardápio */}
        <section className="bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="border-l-4 border-l-primary pl-4">
              <h2 className="font-serif text-2xl font-bold">Cardápio</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.produtos.length} itens disponíveis
              </p>
            </div>

            <div className="mt-6 space-y-10">
              {Object.entries(produtosPorCategoria).map(([categoria, produtos]) => (
                <div key={categoria}>
                  <h3 className="mb-4 font-serif text-lg font-semibold text-foreground">
                    {categoria}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {produtos.map((p) => (
                      <ProdutoCard
                        key={p.id}
                        produto={p}
                        restaurante={{
                          id: data.id,
                          nome: data.nome,
                          taxaEntrega: data.taxaEntrega,
                        }}
                        disabled={!data.aberto}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Avaliações */}
        {data.avaliacoes.length > 0 && (
          <section className="border-t border-border/60 bg-secondary/5">
            <div className="container mx-auto px-4 py-10">
              <div className="border-l-4 border-l-primary pl-4">
                <h2 className="font-serif text-2xl font-bold">
                  Avaliações dos clientes
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data.avaliacoes.length} avaliação(ões) · média{" "}
                  {mediaAvaliacoes.toFixed(1)} estrelas
                </p>
              </div>
              <AvaliacoesList avaliacoes={data.avaliacoes} />
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
