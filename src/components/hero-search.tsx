"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeroSearchProps {
  categorias: string[];
}

export function HeroSearch({ categorias }: HeroSearchProps) {
  const router = useRouter();
  const [busca, setBusca] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (busca.trim()) params.set("busca", busca.trim());
    router.push(`/restaurantes${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Busque por restaurante ou prato..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-12 pl-10 text-base"
          />
        </div>
        <Button type="submit" size="lg" className="h-12">
          <MapPin className="mr-2 h-4 w-4" />
          Buscar
        </Button>
      </form>

      {/* Categorias rápidas */}
      {categorias.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Popular:</span>
          {categorias.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() => router.push(`/restaurantes?categoria=${encodeURIComponent(cat)}`)}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
