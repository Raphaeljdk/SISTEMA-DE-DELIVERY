"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface LocalizacaoEntregador {
  entregadorId: string;
  pedidoId?: string;
  lat: number;
  lng: number;
  heading: number;
  timestamp: number;
}

export interface StatusPedidoEvent {
  pedidoId: string;
  status: string;
  timestamp?: number;
}

interface UseRastreamentoOptions {
  pedidoId?: string;
  restauranteId?: string;
  clienteId?: string;
  entregadorId?: string;
}

/**
 * Hook para conexão WebSocket com o mini-service de rastreamento.
 * Porta 3003 é exposta via query param XTransformPort (gateway Caddy).
 */
export function useRastreamento(options: UseRastreamentoOptions = {}) {
  const { pedidoId, restauranteId, clienteId, entregadorId } = options;
  const [connected, setConnected] = useState(false);
  const [localizacao, setLocalizacao] = useState<LocalizacaoEntregador | null>(null);
  const [ultimoStatus, setUltimoStatus] = useState<StatusPedidoEvent | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Em produção: usa NEXT_PUBLIC_WS_URL (Render URL, ex: wss://rastreamento-ws.onrender.com)
    // Em desenvolvimento: usa o gateway local via XTransformPort=3003
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      "/?XTransformPort=3003";

    // Conecta passando a porta via XTransformPort (regra do gateway Caddy).
    // O path "/socket.io/" é o padrão do Socket.IO Server.
    const socket = io(wsUrl, {
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      console.log("[ws] conectado:", socket.id);

      // Entra nos rooms relevantes
      if (pedidoId) socket.emit("entrar-pedido", { pedidoId });
      if (restauranteId) socket.emit("entrar-restaurante", { restauranteId });
      if (clienteId) socket.emit("entrar-cliente", { clienteId });
      if (entregadorId) socket.emit("entrar-entregador", { entregadorId });
    });

    socket.on("disconnect", () => {
      setConnected(false);
      console.log("[ws] desconectado");
    });

    socket.on("localizacao-entregador", (data: LocalizacaoEntregador) => {
      setLocalizacao(data);
    });

    socket.on("status-pedido", (data: StatusPedidoEvent) => {
      setUltimoStatus(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [pedidoId, restauranteId, clienteId, entregadorId]);

  /**
   * Envia atualização de localização (usado pelo app do entregador).
   */
  const enviarLocalizacao = (data: Omit<LocalizacaoEntregador, "timestamp">) => {
    socketRef.current?.emit("atualizar-localizacao", data);
  };

  return {
    connected,
    localizacao,
    ultimoStatus,
    enviarLocalizacao,
  };
}
