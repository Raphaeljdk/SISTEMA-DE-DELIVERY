"use client";

import { Phone, MessageSquare, Bike, MapPin, Clock, Wifi, WifiOff } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRastreamento } from "@/hooks/use-rastreamento";
import { useEffect, useState } from "react";

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
  const { connected, localizacao, ultimoStatus } = useRastreamento({
    pedidoId: pedido.id,
    entregadorId: entregador?.id,
  });
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const minutosRestantes = Math.max(0, pedido.tempoEstimado - Math.floor(elapsed / 60));

  // Posição do entregador no mapa (mockada se não houver WS)
  const latBase = -23.5613;
  const lngBase = -46.6565;
  const entregadorLat = localizacao?.lat ?? latBase + 0.01;
  const entregadorLng = localizacao?.lng ?? lngBase + 0.005;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center justify-between font-serif text-lg">
          <span>Rastreamento</span>
          <div className="flex items-center gap-2">
            <Badge variant={connected ? "default" : "secondary"} className="text-[10px]">
              {connected ? (
                <>
                  <Wifi className="mr-1 h-3 w-3" />
                  Ao vivo
                </>
              ) : (
                <>
                  <WifiOff className="mr-1 h-3 w-3" />
                  Offline
                </>
              )}
            </Badge>
            {connected && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mapa SVG com posição do entregador */}
        <div className="relative mb-4 h-48 overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5">
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
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 200">
            {/* Rota */}
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
            {/* Pino entregador (atualiza com localização real) */}
            <g>
              <circle cx="200" cy="100" r="8" fill="#8f7423">
                {connected && (
                  <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
                )}
              </circle>
              <Bike x="194" y="94" width="12" height="12" className="fill-white" />
            </g>
            {/* Pino destino */}
            <circle cx="350" cy="50" r="6" fill="#9d5852" />
            <text x="350" y="40" textAnchor="middle" className="fill-foreground text-[10px]">
              Você
            </text>
          </svg>

          {/* Coordenadas display (quando conectado) */}
          {connected && localizacao && (
            <div className="absolute bottom-2 left-2 rounded bg-background/90 px-2 py-1 text-[10px] font-mono">
              {entregadorLat.toFixed(4)}, {entregadorLng.toFixed(4)}
            </div>
          )}
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

        {/* Status update em tempo real */}
        {ultimoStatus && (
          <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 p-2 text-xs">
            <span className="font-medium text-primary">Status atualizado:</span>{" "}
            {ultimoStatus.status} ·{" "}
            {new Date(ultimoStatus.timestamp || Date.now()).toLocaleTimeString("pt-BR")}
          </div>
        )}

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
