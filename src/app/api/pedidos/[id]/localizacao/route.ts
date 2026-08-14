/**
 * POST /api/pedidos/[id]/localizacao
 * Atualiza localização do entregador (chamado pelo app mobile do entregador).
 * Repassa o dado para o mini-service WebSocket broadcastar em tempo real.
 *
 * Body: { entregadorId, lat, lng, heading? }
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pedidoId } = await params;
    const body = await req.json();

    if (!body.entregadorId || typeof body.lat !== "number" || typeof body.lng !== "number") {
      return NextResponse.json(
        { error: "Campos obrigatórios: entregadorId, lat, lng" },
        { status: 400 }
      );
    }

    // Repassa para o mini-service WebSocket
    try {
      const wsUrl = process.env.WS_SERVICE_URL || "http://localhost:3003";
      await fetch(`${wsUrl}/broadcast-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "localizacao",
          pedidoId,
          entregadorId: body.entregadorId,
          lat: body.lat,
          lng: body.lng,
          heading: body.heading || 0,
        }),
      });
    } catch {
      // WS offline — apenas persiste no banco se necessário
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao atualizar localização:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
