/**
 * POST /api/webhooks/mercadopago
 * Webhook do Mercado Pago — recebe notificações de pagamento.
 *
 * Configurar no dashboard MP:
 *   URL: https://seudominio.com/api/webhooks/mercadopago
 *   Eventos: payment, merchant_order
 *
 * O MP envia query params: ?topic=payment&id=123456789
 * Em seguida fazemos GET no payment_id para saber o status.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consultarPagamento } from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const topic = url.searchParams.get("topic");
    const id = url.searchParams.get("id");

    console.log(`[mp-webhook] topic=${topic} id=${id}`);

    if (topic !== "payment" || !id) {
      // MP também envia body JSON com notification
      const body = await req.json().catch(() => null);
      if (body?.type === "payment" && body?.data?.id) {
        return processarPagamentoMP(String(body.data.id));
      }
      return NextResponse.json({ ok: true, ignored: true });
    }

    return processarPagamentoMP(id);
  } catch (error) {
    console.error("[mp-webhook] erro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

async function processarPagamentoMP(paymentId: string) {
  try {
    const pagamento = await consultarPagamento(Number(paymentId));
    console.log(`[mp-webhook] payment ${paymentId} status=${pagamento.status}`);

    // Busca pedido pelo external_reference (que setamos como pedidoId)
    const pedido = await db.pedido.findFirst({
      where: { pagamento: { transacaoId: paymentId } },
    });

    if (!pedido) {
      console.warn(`[mp-webhook] pedido não encontrado para payment ${paymentId}`);
      return NextResponse.json({ ok: true, warning: "pedido não encontrado" });
    }

    const statusMap: Record<string, string> = {
      approved: "APROVADO",
      pending: "PENDENTE",
      rejected: "RECUSADO",
      cancelled: "RECUSADO",
      refunded: "ESTORNADO",
      in_process: "PENDENTE",
    };

    const dbStatus = statusMap[pagamento.status] || "PENDENTE";
    await db.pagamento.updateMany({
      where: { transacaoId: paymentId },
      data: { status: dbStatus },
    });

    // Se aprovado, avança status do pedido
    if (pagamento.status === "approved") {
      await db.pedido.update({
        where: { id: pedido.id },
        data: { status: "PAGO" },
      });
    }

    return NextResponse.json({ ok: true, status: dbStatus });
  } catch (error) {
    console.error("[mp-webhook] erro ao consultar pagamento:", error);
    return NextResponse.json({ error: "Erro ao consultar" }, { status: 500 });
  }
}

// MP também pode fazer GET para validar webhook
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const topic = url.searchParams.get("topic");
  const id = url.searchParams.get("id");
  if (topic && id) {
    return processarPagamentoMP(id);
  }
  return NextResponse.json({ ok: true, service: "mercadopago-webhook" });
}
