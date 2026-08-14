"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FiltroRestaurantesProps {
  categorias: string[];
  categoriaAtual: string;
  buscaAtual: string;
  abertoAtual: boolean;
}

export function FiltroRestaurantes({
  categorias,
  categoriaAtual,
  buscaAtual,
  abertoAtual,
}: FiltroRestaurantesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "" || value === "Todas") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/restaurantes?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar restaurante ou prato..."
            defaultValue={buscaAtual}
            onChange={(e) => updateFilter("busca", e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={abertoAtual ? "default" : "outline"}
          onClick={() => updateFilter("aberto", abertoAtual ? null : "true")}
        >
          {abertoAtual ? "Abertos" : "Todos"}
        </Button>
        {(buscaAtual || categoriaAtual !== "Todas" || abertoAtual) && (
          <Button
            variant="ghost"
            onClick={() => router.push("/restaurantes")}
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      {/* Categorias chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateFilter("categoria", null)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            categoriaAtual === "Todas"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:border-primary hover:text-primary"
          )}
        >
          Todas
        </button>
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => updateFilter("categoria", cat)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              categoriaAtual === cat
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background hover:border-primary hover:text-primary"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
