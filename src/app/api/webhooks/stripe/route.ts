/**
 * POST /api/webhooks/stripe
 * Webhook do Stripe — recebe eventos de pagamento.
 *
 * Configurar no dashboard Stripe:
 *   URL: https://seudominio.com/api/webhooks/stripe
 *   Eventos: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
 *
 * O corpo é validado via STRIPE_WEBHOOK_SECRET (assinatura HMAC no header
 * stripe-signature).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verificarWebhookSignature } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event;
  try {
    event = verificarWebhookSignature(body, sig);
  } catch (err) {
    console.error("[stripe-webhook] assinatura inválida:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[stripe-webhook] evento recebido: ${event.type}`);

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const pedidoId = intent.metadata?.pedidoId;
        if (pedidoId) {
          await db.pagamento.updateMany({
            where: { pedidoId, transacaoId: intent.id },
            data: { status: "APROVADO" },
          });
          await db.pedido.updateMany({
            where: { id: pedidoId },
            data: { status: "PAGO" },
          });
          console.log(`[stripe-webhook] pedido ${pedidoId} pago com sucesso`);
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const pedidoId = intent.metadata?.pedidoId;
        if (pedidoId) {
          await db.pagamento.updateMany({
            where: { pedidoId, transacaoId: intent.id },
            data: { status: "RECUSADO" },
          });
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        const intentId = charge.payment_intent as string;
        await db.pagamento.updateMany({
          where: { transacaoId: intentId },
          data: { status: "ESTORNADO" },
        });
        break;
      }
      default:
        console.log(`[stripe-webhook] evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe-webhook] erro ao processar:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
