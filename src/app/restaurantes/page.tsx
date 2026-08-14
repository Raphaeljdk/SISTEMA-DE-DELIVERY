import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RestauranteCard } from "@/components/restaurante-card";
import { FiltroRestaurantes } from "@/components/filtro-restaurantes";
import { EmptyState } from "@/components/empty-state";
import { Utensils } from "lucide-react";

export const dynamic = "force-dynamic";

interface SearchParams {
  categoria?: string;
  busca?: string;
  aberto?: string;
}

export default async function RestaurantesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categoria = params.categoria || "Todas";
  const busca = params.busca || "";
  const aberto = params.aberto === "true";

  const where: Record<string, unknown> = {};
  if (categoria !== "Todas") where.categoria = categoria;
  if (aberto) where.aberto = true;
  if (busca) {
    where.OR = [
      { nome: { contains: busca } },
      { descricao: { contains: busca } },
      { categoria: { contains: busca } },
    ];
  }

  const [restaurantes, categorias] = await Promise.all([
    db.restaurante.findMany({
      where,
      include: {
        produtos: {
          where: { disponivel: true },
          select: { id: true, nome: true, preco: true, imagemUrl: true },
        },
      },
      orderBy: { avaliacaoMedia: "desc" },
    }),
    db.restaurante.findMany({
      select: { categoria: true },
      distinct: ["categoria"],
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border/60 bg-paper">
          <div className="container mx-auto px-4 py-10">
            <div className="border-l-4 border-l-primary pl-4">
              <h1 className="font-serif text-3xl font-black tracking-tight md:text-4xl">
                Restaurantes
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {restaurantes.length} restaurante(s) encontrado(s)
                {categoria !== "Todas" && ` em "${categoria}"`}
                {busca && ` para "${busca}"`}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-background">
          <div className="container mx-auto px-4 py-8">
            <FiltroRestaurantes
              categorias={categorias.map((c) => c.categoria)}
              categoriaAtual={categoria}
              buscaAtual={busca}
              abertoAtual={aberto}
            />

            {restaurantes.length === 0 ? (
              <EmptyState
                icon={Utensils}
                title="Nenhum restaurante encontrado"
                description="Tente ajustar os filtros ou voltar mais tarde."
              />
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {restaurantes.map((r) => (
                  <RestauranteCard key={r.id} restaurante={r} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
