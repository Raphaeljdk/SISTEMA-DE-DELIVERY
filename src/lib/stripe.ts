/**
 * Cliente Stripe — singleton configurado via env vars.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY        - sk_test_... ou sk_live_...
 *   STRIPE_PUBLISHABLE_KEY   - pk_test_... ou pk_live_...
 *   STRIPE_WEBHOOK_SECRET    - whsec_... (configurado no dashboard Stripe)
 *
 * Recursos:
 *   - Criar Payment Intent (cartao de credito)
 *   - Criar Checkout Session (pagina hospedada Stripe)
 *   - Confirmar pagamento via webhook
 *   - Estornar (refund)
 */
import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (client) return client;
  if (!process.env.STRIPE_SECRET_KEY) return null;
  client = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil" as Stripe.LatestApiVersion,
    typescript: true,
  });
  return client;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export interface CriarPaymentIntentInput {
  valor: number; // valor em centavos (R$ 10,00 = 1000)
  moeda: string; // "brl"
  pedidoId: string;
  descricao?: string;
  clienteEmail?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  id: string;
  clientSecret: string;
  status: string;
  provider: "stripe";
}

/**
 * Cria um Payment Intent para pagamento direto no app (cartao).
 */
export async function criarPaymentIntent(
  input: CriarPaymentIntentInput
): Promise<PaymentIntentResult> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe não configurado");

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(input.valor * 100), // Stripe usa centavos
    currency: input.moeda,
    description: input.descricao || `Pedido #${input.pedidoId}`,
    receipt_email: input.clienteEmail,
    metadata: {
      pedidoId: input.pedidoId,
      ...input.metadata,
    },
    automatic_payment_methods: { enabled: true },
  });

  return {
    id: intent.id,
    clientSecret: intent.client_secret as string,
    status: intent.status,
    provider: "stripe",
  };
}

/**
 * Cria uma Checkout Session (pagina hospedada pelo Stripe).
 */
export async function criarCheckoutSession(input: {
  valor: number;
  moeda: string;
  pedidoId: string;
  descricao: string;
  successUrl: string;
  cancelUrl: string;
  clienteEmail?: string;
}): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe não configurado");

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: input.moeda,
          product_data: { name: input.descricao },
          unit_amount: Math.round(input.valor * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    customer_email: input.clienteEmail,
    metadata: { pedidoId: input.pedidoId },
  });

  return {
    url: session.url as string,
    sessionId: session.id,
  };
}

/**
 * Estorna um pagamento (total ou parcial).
 */
export async function estornarPagamento(
  paymentIntentId: string,
  valorParcial?: number
): Promise<{ id: string; status: string; valor: number }> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe não configurado");

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: valorParcial ? Math.round(valorParcial * 100) : undefined,
  });

  return {
    id: refund.id,
    status: refund.status as string,
    valor: refund.amount / 100,
  };
}

/**
 * Verifica assinatura do webhook (segurança).
 */
export function verificarWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe não configurado");
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET não configurado");
  }
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
