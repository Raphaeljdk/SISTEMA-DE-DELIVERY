"use client";

import { useEffect, useState } from "react";
import { Phone, MessageSquare, Bike, MapPin, Clock } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RastreamentoCardProps {
  pedido: {
    id: string;
    codigoRastreio: string | null;
    tempoEstimado: number;
    enderecoEntrega: string;
    status: string;
  };
  entregador: {
    id: string;
    veiculo: string;
    usuario: {
      nome: string;
      avatarUrl: string | null;
      telefone: string;
    };
  } | null;
}

export function RastreamentoCard({ pedido, entregador }: RastreamentoCardProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutosRestantes = Math.max(0, pedido.tempoEstimado - Math.floor(elapsed / 60));

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between font-serif text-lg">
          <span>Rastreamento</span>
          <span className="flex items-center gap-2 text-sm font-normal text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Ao vivo
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mapa placeholder */}
        <div className="relative mb-4 h-48 overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5">
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(rgba(89,82,63,0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(89,82,63,0.15) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          />
          {/* Rota SVG */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 200">
            <path
              d="M 50 150 Q 100 50, 200 100 T 350 50"
              fill="none"
              stroke="#8f7423"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.6"
            />
            {/* Pino restaurante */}
            <circle cx="50" cy="150" r="6" fill="#59523f" />
            <text x="50" y="170" textAnchor="middle" className="fill-foreground text-[10px]">
              Restaurante
            </text>
            {/* Pino entregador (animado) */}
            <g>
              <circle cx="200" cy="100" r="8" fill="#8f7423" />
              <Bike x="194" y="94" width="12" height="12" className="fill-white" />
            </g>
            {/* Pino destino */}
            <circle cx="350" cy="50" r="6" fill="#9d5852" />
            <text x="350" y="40" textAnchor="middle" className="fill-foreground text-[10px]">
              Você
            </text>
          </svg>
        </div>

        {/* ETA */}
        <div className="mb-4 flex items-center justify-between rounded-lg bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Tempo estimado</p>
              <p className="font-serif text-lg font-bold text-primary">
                {minutosRestantes} min
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Código</p>
            <p className="font-mono text-xs font-medium">
              {pedido.codigoRastreio}
            </p>
          </div>
        </div>

        {/* Entregador */}
        {entregador && (
          <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted">
              {entregador.usuario.avatarUrl && (
                <Image
                  src={entregador.usuario.avatarUrl}
                  alt={entregador.usuario.nome}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {entregador.usuario.nome}
              </p>
              <p className="text-xs text-muted-foreground">
                {entregador.veiculo}
              </p>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="outline" className="h-8 w-8">
                <Phone className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <MessageSquare className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <p>{pedido.enderecoEntrega}</p>
        </div>
      </CardContent>
    </Card>
  );
}
