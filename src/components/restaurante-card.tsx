import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, Bike } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/star-rating";
import { formatCurrency } from "@/lib/format";

interface RestauranteCardProps {
  restaurante: {
    id: string;
    nome: string;
    descricao?: string | null;
    avaliacaoMedia: number;
    tempoEntrega: number;
    taxaEntrega: number;
    aberto: boolean;
    imagemUrl?: string | null;
    categoria: string;
    produtos?: unknown[];
  };
}

export function RestauranteCard({ restaurante }: RestauranteCardProps) {
  return (
    <Link href={`/restaurantes/${restaurante.id}`} className="block">
      <Card className="card-hover overflow-hidden p-0">
        {/* Imagem */}
        <div className="relative h-40 w-full overflow-hidden bg-muted">
          {restaurante.imagemUrl ? (
            <Image
              src={restaurante.imagemUrl}
              alt={restaurante.nome}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <span className="font-serif text-2xl font-bold text-primary">
                {restaurante.nome.charAt(0)}
              </span>
            </div>
          )}
          {/* Status badge */}
          <div className="absolute right-2 top-2">
            {restaurante.aberto ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                Aberto
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200">
                Fechado
              </Badge>
            )}
          </div>
          {/* Categoria badge */}
          <div className="absolute left-2 top-2">
            <Badge className="bg-background/90 text-foreground hover:bg-background">
              {restaurante.categoria}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="font-serif text-base font-bold leading-tight">
            {restaurante.nome}
          </h3>
          {restaurante.descricao && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {restaurante.descricao}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <StarRating rating={restaurante.avaliacaoMedia} />
            <span className="text-xs text-muted-foreground">
              {restaurante.produtos?.length || 0} itens
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{restaurante.tempoEntrega} min</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Bike className="h-3 w-3" />
            <span>{formatCurrency(restaurante.taxaEntrega)}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
