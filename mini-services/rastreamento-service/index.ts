/**
 * Mini-service: Rastreamento em tempo real (WebSocket)
 * Porta: 3003
 *
 * Responsável por:
 *  - Receber conexões de clientes, entregadores e painéis de restaurante
 *  - Manter um "room" por pedido (sala: pedido:<pedidoId>)
 *  - Receber updates de localização do entregador e broadcast para o room
 *  - Emitir eventos de mudança de status do pedido
 *
 * Uso (frontend):
 *   const socket = io("/?XTransformPort=3003");
 *   socket.emit("entrar-pedido", { pedidoId });
 *   socket.on("localizacao-entregador", (data) => { ... });
 *
 * Uso (backend Next.js):
 *   POST /api/pedidos/[id]/localizacao  →  http interno para este serviço
 */
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 3003;

const httpServer = createServer((req, res) => {
  // Health check
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "rastreamento", port: PORT, uptime: process.uptime() }));
    return;
  }
  // Endpoint interno para broadcast de status (chamado pelo Next.js API)
  if (req.url?.startsWith("/broadcast-status") && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { pedidoId, status, restauranteId, clienteId, entregadorId } = JSON.parse(body);
        io.to(`pedido:${pedidoId}`).emit("status-pedido", { pedidoId, status, timestamp: Date.now() });
        if (restauranteId) io.to(`restaurante:${restauranteId}`).emit("status-pedido", { pedidoId, status });
        if (clienteId) io.to(`cliente:${clienteId}`).emit("status-pedido", { pedidoId, status });
        if (entregadorId) io.to(`entregador:${entregadorId}`).emit("status-pedido", { pedidoId, status });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, broadcast: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "invalid body" }));
      }
    });
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/socket.io/",
});

// Estado em memória: localização atual dos entregadores
const entregadorLocalizacao = new Map<string, { lat: number; lng: number; heading: number; updatedAt: number }>();

io.on("connection", (socket) => {
  console.log(`[+] Cliente conectado: ${socket.id}`);

  // ─── Entrar em rooms ─────────────────────────────────────────────
  socket.on("entrar-pedido", ({ pedidoId }: { pedidoId: string }) => {
    if (!pedidoId) return;
    socket.join(`pedido:${pedidoId}`);
    console.log(`[room] ${socket.id} entrou em pedido:${pedidoId}`);
  });

  socket.on("entrar-restaurante", ({ restauranteId }: { restauranteId: string }) => {
    if (!restauranteId) return;
    socket.join(`restaurante:${restauranteId}`);
    console.log(`[room] ${socket.id} entrou em restaurante:${restauranteId}`);
  });

  socket.on("entrar-cliente", ({ clienteId }: { clienteId: string }) => {
    if (!clienteId) return;
    socket.join(`cliente:${clienteId}`);
  });

  socket.on("entrar-entregador", ({ entregadorId }: { entregadorId: string }) => {
    if (!entregadorId) return;
    socket.join(`entregador:${entregadorId}`);
  });

  // ─── Atualização de localização do entregador ────────────────────
  socket.on(
    "atualizar-localizacao",
    (data: { entregadorId: string; pedidoId?: string; lat: number; lng: number; heading?: number }) => {
      const { entregadorId, pedidoId, lat, lng, heading = 0 } = data;
      entregadorLocalizacao.set(entregadorId, { lat, lng, heading, updatedAt: Date.now() });

      // Broadcast para todos os rooms do pedido
      if (pedidoId) {
        io.to(`pedido:${pedidoId}`).emit("localizacao-entregador", {
          entregadorId,
          pedidoId,
          lat,
          lng,
          heading,
          timestamp: Date.now(),
        });
      }
    }
  );

  // ─── Ping/pong ───────────────────────────────────────────────────
  socket.on("ping", () => socket.emit("pong", { timestamp: Date.now() }));

  // ─── Disconnect ──────────────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log(`[-] Cliente desconectado: ${socket.id}`);
  });
});

// Limpeza periódica de localização stale (mais de 5 min sem update)
setInterval(() => {
  const agora = Date.now();
  for (const [id, loc] of entregadorLocalizacao.entries()) {
    if (agora - loc.updatedAt > 5 * 60 * 1000) {
      entregadorLocalizacao.delete(id);
    }
  }
}, 60 * 1000);

httpServer.listen(PORT, () => {
  console.log(`🛵 Rastreamento WebSocket service rodando na porta ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Socket.IO: ws://localhost:${PORT}/`);
});
