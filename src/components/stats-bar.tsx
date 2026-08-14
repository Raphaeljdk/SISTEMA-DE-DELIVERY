import { Utensils, ShoppingBag, Star, Clock } from "lucide-react";

interface StatsBarProps {
  totalRestaurantes: number;
  totalPedidos: number;
}

export function StatsBar({ totalRestaurantes, totalPedidos }: StatsBarProps) {
  const stats = [
    {
      label: "Restaurantes",
      value: `${totalRestaurantes}+`,
      icon: Utensils,
    },
    {
      label: "Pedidos processados",
      value: `${totalPedidos}+`,
      icon: ShoppingBag,
    },
    {
      label: "Avaliação média",
      value: "4.8",
      icon: Star,
    },
    {
      label: "Tempo médio",
      value: "35min",
      icon: Clock,
    },
  ];

  return (
    <section className="border-b border-border/60 bg-secondary/5">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-lg border border-border/60 bg-background p-4"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-serif text-xl font-bold leading-none">
                  {stat.value}
                </div>
                <div className="mt-1 truncate text-xs text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
