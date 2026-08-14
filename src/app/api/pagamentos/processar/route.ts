/**
 * POST /api/pagamentos/processar
 * Processa um pagamento usando o gateway apropriado (Stripe ou Mercado Pago).
 *
 * Body: {
 *   pedidoId: string,
 *   valor: number,
 *   metodo: "PIX" | "CARTAO" | "CARTEIRA",
 *   clienteEmail?: string,
 *   clienteNome?: string
 * }
 *
 * Response: ver tipo ProcessarPagamentoResult
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processarPagamento, type MetodoPagamento } from "@/lib/pagamentos";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pedidoId, valor, metodo, clienteEmail, clienteNome } = body as {
      pedidoId: string;
      valor: number;
      metodo: MetodoPagamento;
      clienteEmail?: string;
      clienteNome?: string;
    };

    // Validações
    if (!pedidoId || !valor || !metodo) {
      return NextResponse.json(
        { error: "Campos obrigatórios: pedidoId, valor, metodo" },
        { status: 400 }
      );
    }

    if (!["PIX", "CARTAO", "CARTEIRA"].includes(metodo)) {
      return NextResponse.json(
        { error: `Método inválido: ${metodo}. Aceitos: PIX, CARTAO, CARTEIRA` },
        { status: 400 }
      );
    }

    if (valor <= 0) {
      return NextResponse.json({ error: "Valor deve ser positivo" }, { status: 400 });
    }

    // Verifica pedido existe
    const pedido = await db.pedido.findUnique({
      where: { id: pedidoId },
      include: { pagamento: true },
    });
    if (!pedido) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }
    if (pedido.pagamento && pedido.pagamento.status === "APROVADO") {
      return NextResponse.json({ error: "Pedido já pago" }, { status: 400 });
    }

    // Processa pagamento
    const result = await processarPagamento({
      pedidoId,
      valor,
      metodo,
      clienteEmail,
      clienteNome,
    });

    // Cria ou atualiza registro de Pagamento
    if (pedido.pagamento) {
      await db.pagamento.update({
        where: { pedidoId },
        data: {
          transacaoId: result.transacaoId,
          status: result.status,
          metodo,
        },
      });
    } else {
      await db.pagamento.create({
        data: {
          pedidoId,
          valor,
          metodo,
          transacaoId: result.transacaoId,
          status: result.status,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      pagamento: result,
    });
  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    const msg = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
