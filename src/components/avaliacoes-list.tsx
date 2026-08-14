import Image from "next/image";
import { formatDistanceToNow } from "@/lib/format-utils";
import { StarRating } from "@/components/star-rating";

interface AvaliacoesListProps {
  avaliacoes: Array<{
    id: string;
    nota: number;
    comentario: string | null;
    dataHora: Date;
    cliente: {
      usuario: { nome: string; avatarUrl: string | null };
    };
  }>;
}

export function AvaliacoesList({ avaliacoes }: AvaliacoesListProps) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      {avaliacoes.map((a) => (
        <div
          key={a.id}
          className="rounded-lg border border-border/60 bg-background p-4"
        >
          <div className="flex items-start gap-3">
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted">
              {a.cliente.usuario.avatarUrl ? (
                <Image
                  src={a.cliente.usuario.avatarUrl}
                  alt={a.cliente.usuario.nome}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-primary/10 text-primary">
                  <span className="text-sm font-medium">
                    {a.cliente.usuario.nome.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  {a.cliente.usuario.nome}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(a.dataHora)}
                </span>
              </div>
              <StarRating rating={a.nota} size={12} showValue={false} className="mt-0.5" />
              {a.comentario && (
                <p className="mt-2 text-sm text-foreground/80">
                  &ldquo;{a.comentario}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
