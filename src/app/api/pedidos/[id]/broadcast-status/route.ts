/**
 * POST /api/pedidos/[id]/broadcast-status
 * Notifica o mini-service de WebSocket (porta 3003) sobre mudança de status.
 *
 * Body: { status: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const pedido = await db.pedido.findUnique({
      where: { id },
      select: {
        id: true,
        clienteId: true,
        restauranteId: true,
        entregadorId: true,
      },
    });

    if (!pedido) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const payload = {
      pedidoId: pedido.id,
      status: body.status,
      restauranteId: pedido.restauranteId,
      clienteId: pedido.clienteId,
      entregadorId: pedido.entregadorId,
    };

    try {
      const wsUrl = process.env.WS_SERVICE_URL || "http://localhost:3003";
      const wsResponse = await fetch(`${wsUrl}/broadcast-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const wsData = await wsResponse.json();
      return NextResponse.json({ ok: true, broadcast: wsData.broadcast === true });
    } catch {
      return NextResponse.json({
        ok: true,
        broadcast: false,
        warning: "WebSocket service offline - atualização sem broadcast em tempo real",
      });
    }
  } catch (error) {
    console.error("Erro ao broadcast status:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
