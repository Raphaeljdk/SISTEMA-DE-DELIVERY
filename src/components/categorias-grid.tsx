"use client";

import { useRouter } from "next/navigation";
import { Utensils, Pizza, Fish, Soup, Apple, Salad } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CategoriasGridProps {
  categorias: string[];
}

const ICONS: Record<string, React.ElementType> = {
  Hambúrgueres: Utensils,
  Pizzas: Pizza,
  Japonesa: Fish,
  Mexicana: Soup,
  Italiana: Salad,
  Saudável: Apple,
  Brasileira: Utensils,
};

const COLORS: Record<string, string> = {
  Hambúrgueres: "bg-amber-100 text-amber-700",
  Pizzas: "bg-red-100 text-red-700",
  Japonesa: "bg-pink-100 text-pink-700",
  Mexicana: "bg-orange-100 text-orange-700",
  Italiana: "bg-green-100 text-green-700",
  Saudável: "bg-emerald-100 text-emerald-700",
  Brasileira: "bg-yellow-100 text-yellow-700",
};

export function CategoriasGrid({ categorias }: CategoriasGridProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
      {categorias.map((cat) => {
        const Icon = ICONS[cat] || Utensils;
        const colorClass = COLORS[cat] || "bg-primary/10 text-primary";
        return (
          <Card
            key={cat}
            className="card-hover cursor-pointer p-0"
            onClick={() => router.push(`/restaurantes?categoria=${encodeURIComponent(cat)}`)}
          >
            <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-foreground">{cat}</span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
