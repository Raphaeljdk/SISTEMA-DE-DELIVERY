/**
 * Cliente Mercado Pago — para pagamentos via PIX e cartão no Brasil.
 *
 * Required env vars:
 *   MERCADOPAGO_ACCESS_TOKEN   - access token da API (APP_USR-...)
 *   MERCADOPAGO_PUBLIC_KEY     - public key (APP_USR-...)
 *   MERCADOPAGO_WEBHOOK_SECRET - (opcional) secret para validar webhooks
 *
 * Recursos:
 *   - Criar preferência de pagamento (PIX, cartão, boleto)
 *   - Gerar QR Code PIX (copia e cola)
 *   - Estornar pagamento
 *   - Verificar status por payment_id
 */
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

let client: MercadoPagoConfig | null = null;

export function getMercadoPago(): MercadoPagoConfig | null {
  if (client) return client;
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) return null;
  client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    options: { timeout: 10000 },
  });
  return client;
}

export function isMercadoPagoConfigured(): boolean {
  return !!process.env.MERCADOPAGO_ACCESS_TOKEN;
}

export interface CriarPreferenciaInput {
  valor: number;
  descricao: string;
  pedidoId: string;
  cliente?: { nome: string; email: string };
  successUrl?: string;
  failureUrl?: string;
  pendingUrl?: string;
  webhookUrl?: string;
}

export interface PreferenciaResult {
  id: string;
  initPoint: string; // URL de checkout
  sandboxInitPoint: string;
}

/**
 * Cria uma preferência de pagamento (checkout hospedado pelo MP).
 */
export async function criarPreferencia(
  input: CriarPreferenciaInput
): Promise<PreferenciaResult> {
  const mp = getMercadoPago();
  if (!mp) throw new Error("Mercado Pago não configurado");

  const preference = new Preference(mp);
  const result = await preference.create({
    body: {
      items: [
        {
          id: input.pedidoId,
          title: input.descricao,
          quantity: 1,
          unit_price: input.valor,
          currency_id: "BRL",
        },
      ],
      payer: input.cliente
        ? {
            name: input.cliente.nome,
            email: input.cliente.email,
          }
        : undefined,
      external_reference: input.pedidoId,
      payment_methods: {
        // Aceita todos: pix, cartao, boleto
        default_payment_method_id: undefined,
        installments: 12,
      },
      back_urls: {
        success: input.successUrl,
        failure: input.failureUrl,
        pending: input.pendingUrl,
      },
      auto_return: "approved",
      notification_url: input.webhookUrl,
      metadata: { pedidoId: input.pedidoId },
    },
  });

  return {
    id: result.id,
    initPoint: result.init_point as string,
    sandboxInitPoint: result.sandbox_init_point as string,
  };
}

export interface PixResult {
  paymentId: number;
  qrCode: string; // copia e cola
  qrCodeBase64: string; // imagem base64
  expiresAt: string;
  status: string;
}

/**
 * Cria um pagamento PIX direto (sem checkout hospedado).
 */
export async function criarPagamentoPix(input: {
  valor: number;
  descricao: string;
  pedidoId: string;
  cliente?: { nome: string; email: string; cpf: string };
}): Promise<PixResult> {
  const mp = getMercadoPago();
  if (!mp) throw new Error("Mercado Pago não configurado");

  const payment = new Payment(mp);
  const result = await payment.create({
    body: {
      transaction_amount: input.valor,
      description: input.descricao,
      payment_method_id: "pix",
      payer: input.cliente
        ? {
            email: input.cliente.email,
            first_name: input.cliente.nome,
            identification: { type: "CPF", number: input.cliente.cpf },
          }
        : undefined,
      external_reference: input.pedidoId,
      metadata: { pedidoId: input.pedidoId },
    },
  });

  return {
    paymentId: result.id as number,
    qrCode: (result.point_of_interaction?.transaction_data?.qr_code as string) || "",
    qrCodeBase64:
      (result.point_of_interaction?.transaction_data?.qr_code_base64 as string) || "",
    expiresAt:
      (result.date_of_expiration as unknown as string) || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    status: result.status as string,
  };
}

/**
 * Consulta status de um pagamento pelo ID.
 */
export async function consultarPagamento(paymentId: number): Promise<{
  id: number;
  status: "pending" | "approved" | "rejected" | "cancelled" | "refunded";
  statusDetail: string;
  valor: number;
  metodo: string;
}> {
  const mp = getMercadoPago();
  if (!mp) throw new Error("Mercado Pago não configurado");

  const payment = new Payment(mp);
  const result = await payment.get({ id: paymentId });

  return {
    id: result.id as number,
    status: result.status as "pending" | "approved" | "rejected" | "cancelled" | "refunded",
    statusDetail: (result.status_detail as string) || "",
    valor: result.transaction_amount as number,
    metodo: (result.payment_method_id as string) || "",
  };
}

/**
 * Estorna um pagamento (refunded).
 */
export async function estornarPagamentoMP(paymentId: number, valor?: number) {
  const mp = getMercadoPago();
  if (!mp) throw new Error("Mercado Pago não configurado");

  const payment = new Payment(mp);
  const result = await payment.refund({
    payment_id: paymentId,
    body: valor ? { amount: valor } : undefined,
  });

  return {
    id: result.id as number,
    status: result.status as string,
    valor: result.amount as number,
  };
}
