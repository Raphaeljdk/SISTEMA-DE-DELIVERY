/**
 * Orquestrador de pagamentos — decide qual gateway usar (Stripe ou Mercado Pago).
 *
 * Estratégia:
 *   - PIX         → Mercado Pago (suporte nativo a PIX QR Code)
 *   - Cartão      → Stripe (Payment Intent, suporte a 3DS)
 *   - Carteira    → Mercado Pago (carteira digital)
 *   - Fallback    → se um gateway falhar, tenta o outro
 *
 * Em modo demo (sem env vars configuradas), simula pagamento aprovado
 * para fins de desenvolvimento.
 */
import { db } from "@/lib/db";
import {
  criarPaymentIntent as stripeIntent,
  criarCheckoutSession as stripeCheckout,
  estornarPagamento as stripeRefund,
  isStripeConfigured,
} from "@/lib/stripe";
import {
  criarPagamentoPix as mpPix,
  consultarPagamento as mpGet,
  estornarPagamentoMP as mpRefund,
  isMercadoPagoConfigured,
} from "@/lib/mercadopago";

export type MetodoPagamento = "PIX" | "CARTAO" | "CARTEIRA";
export type Gateway = "stripe" | "mercadopago" | "demo";

export interface ProcessarPagamentoInput {
  pedidoId: string;
  valor: number;
  metodo: MetodoPagamento;
  clienteEmail?: string;
  clienteNome?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface ProcessarPagamentoResult {
  gateway: Gateway;
  transacaoId: string;
  status: "PENDENTE" | "APROVADO" | "RECUSADO" | "ESTORNADO";
  clientSecret?: string; // Stripe Payment Intent
  checkoutUrl?: string; // URL de checkout hospedado
  qrCode?: string; // PIX copia e cola
  qrCodeBase64?: string; // PIX imagem base64
  expiresAt?: string;
}

/**
 * Decide qual gateway usar com base no método de pagamento.
 */
export function decidirGateway(metodo: MetodoPagamento): Gateway {
  if (metodo === "PIX") {
    if (isMercadoPagoConfigured()) return "mercadopago";
    if (isStripeConfigured()) return "stripe"; // Stripe também suporta PIX no Brasil
    return "demo";
  }
  if (metodo === "CARTAO") {
    if (isStripeConfigured()) return "stripe";
    if (isMercadoPagoConfigured()) return "mercadopago";
    return "demo";
  }
  if (metodo === "CARTEIRA") {
    if (isMercadoPagoConfigured()) return "mercadopago";
    return "demo";
  }
  return "demo";
}

/**
 * Processa um pagamento (chamado pelo POST /api/pedidos).
 */
export async function processarPagamento(
  input: ProcessarPagamentoInput
): Promise<ProcessarPagamentoResult> {
  const gateway = decidirGateway(input.metodo);

  // ─── Modo demo (desenvolvimento sem credenciais) ──────────────
  if (gateway === "demo") {
    console.warn("[pagamento] modo demo - nenhum gateway configurado");
    return {
      gateway: "demo",
      transacaoId: `demo_${Date.now()}`,
      status: "APROVADO",
    };
  }

  // ─── Stripe (cartão via Payment Intent) ────────────────────────
  if (gateway === "stripe" && input.metodo === "CARTAO") {
    const intent = await stripeIntent({
      valor: input.valor,
      moeda: "brl",
      pedidoId: input.pedidoId,
      descricao: `Pedido #${input.pedidoId}`,
      clienteEmail: input.clienteEmail,
      metadata: { cliente: input.clienteNome || "" },
    });
    return {
      gateway: "stripe",
      transacaoId: intent.id,
      status: "PENDENTE",
      clientSecret: intent.clientSecret,
    };
  }

  // ─── Stripe Checkout Session (fallback) ────────────────────────
  if (gateway === "stripe") {
    const session = await stripeCheckout({
      valor: input.valor,
      moeda: "brl",
      pedidoId: input.pedidoId,
      descricao: `Pedido #${input.pedidoId}`,
      successUrl: input.successUrl || `${process.env.NEXTAUTH_URL}/pedidos/${input.pedidoId}?status=pago`,
      cancelUrl: input.cancelUrl || `${process.env.NEXTAUTH_URL}/carrinho?status=cancelado`,
      clienteEmail: input.clienteEmail,
    });
    return {
      gateway: "stripe",
      transacaoId: session.sessionId,
      status: "PENDENTE",
      checkoutUrl: session.url,
    };
  }

  // ─── Mercado Pago PIX ──────────────────────────────────────────
  if (gateway === "mercadopago" && input.metodo === "PIX") {
    const pix = await mpPix({
      valor: input.valor,
      descricao: `Pedido #${input.pedidoId}`,
      pedidoId: input.pedidoId,
      cliente: input.clienteEmail
        ? { nome: input.clienteNome || "Cliente", email: input.clienteEmail, cpf: "00000000000" }
        : undefined,
    });
    return {
      gateway: "mercadopago",
      transacaoId: String(pix.paymentId),
      status: "PENDENTE",
      qrCode: pix.qrCode,
      qrCodeBase64: pix.qrCodeBase64,
      expiresAt: pix.expiresAt,
    };
  }

  // ─── Mercado Pago Checkout (carteira, cartão genérico) ─────────
  if (gateway === "mercadopago") {
    const { criarPreferencia } = await import("@/lib/mercadopago");
    const pref = await criarPreferencia({
      valor: input.valor,
      descricao: `Pedido #${input.pedidoId}`,
      pedidoId: input.pedidoId,
      cliente: input.clienteEmail
        ? { nome: input.clienteNome || "Cliente", email: input.clienteEmail }
        : undefined,
      successUrl: input.successUrl || `${process.env.NEXTAUTH_URL}/pedidos/${input.pedidoId}?status=pago`,
      failureUrl: input.cancelUrl || `${process.env.NEXTAUTH_URL}/carrinho?status=cancelado`,
      pendingUrl: `${process.env.NEXTAUTH_URL}/pedidos/${input.pedidoId}?status=pendente`,
    });
    return {
      gateway: "mercadopago",
      transacaoId: pref.id,
      status: "PENDENTE",
      checkoutUrl: process.env.MP_SANDBOX === "true" ? pref.sandboxInitPoint : pref.initPoint,
    };
  }

  // ─── Fallback final ────────────────────────────────────────────
  return {
    gateway: "demo",
    transacaoId: `demo_${Date.now()}`,
    status: "APROVADO",
  };
}

/**
 * Estorna um pagamento (chamado pelo PATCH /api/pedidos/[id] ao cancelar).
 */
export async function estornarPagamento(
  pedidoId: string
): Promise<{ ok: boolean; status: string }> {
  const pagamento = await db.pagamento.findUnique({
    where: { pedidoId },
  });

  if (!pagamento || !pagamento.transacaoId) {
    return { ok: false, status: "sem transacao" };
  }

  // Detecta gateway pela transacaoId
  const isStripe = pagamento.transacaoId.startsWith("pi_") || pagamento.transacaoId.startsWith("cs_");
  const isMP = /^\d+$/.test(pagamento.transacaoId);

  if (isStripe && isStripeConfigured()) {
    const result = await stripeRefund(pagamento.transacaoId);
    await db.pagamento.update({
      where: { pedidoId },
      data: { status: "ESTORNADO" },
    });
    return { ok: true, status: result.status };
  }

  if (isMP && isMercadoPagoConfigured()) {
    const result = await mpRefund(Number(pagamento.transacaoId));
    await db.pagamento.update({
      where: { pedidoId },
      data: { status: "ESTORNADO" },
    });
    return { ok: true, status: result.status };
  }

  // Demo
  await db.pagamento.update({
    where: { pedidoId },
    data: { status: "ESTORNADO" },
  });
  return { ok: true, status: "demo_estornado" };
}
