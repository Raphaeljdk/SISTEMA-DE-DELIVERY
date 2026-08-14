/**
 * GET /api/pedidos — Lista pedidos (com filtros por cliente/restaurante/status)
 * POST /api/pedidos — Cria novo pedido (checkout do carrinho)
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface ItemCarrinhoPayload {
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  observacoes?: string;
}

interface CriarPedidoPayload {
  clienteId: string;
  restauranteId: string;
  itens: ItemCarrinhoPayload[];
  enderecoEntrega: string;
  formaPagamento: "PIX" | "CARTAO" | "CARTEIRA";
  valorTotal: number;
  valorFrete: number;
  valorDesconto: number;
  cupomId?: string;
  observacoes?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get("clienteId");
    const restauranteId = searchParams.get("restauranteId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (clienteId) where.clienteId = clienteId;
    if (restauranteId) where.restauranteId = restauranteId;
    if (status) where.status = status;

    const pedidos = await db.pedido.findMany({
      where,
      include: {
        itens: { include: { produto: true } },
        cliente: {
          include: { usuario: { select: { nome: true, avatarUrl: true, telefone: true } } },
        },
        restaurante: { select: { id: true, nome: true, imagemUrl: true, endereco: true } },
        entregador: {
          include: { usuario: { select: { nome: true, avatarUrl: true, telefone: true } } },
        },
        pagamento: true,
        avaliacao: true,
      },
      orderBy: { dataHora: "desc" },
      take: 100,
    });

    return NextResponse.json({ total: pedidos.length, pedidos });
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CriarPedidoPayload;

    // Validações básicas
    if (!body.clienteId || !body.restauranteId || !body.itens?.length) {
      return NextResponse.json(
        { error: "Dados incompletos para criar pedido" },
        { status: 400 }
      );
    }

    // Verificar disponibilidade dos produtos (include: VerificarDisponibilidade)
    const produtoIds = body.itens.map((i) => i.produtoId);
    const produtos = await db.produto.findMany({
      where: { id: { in: produtoIds } },
    });

    for (const item of body.itens) {
      const prod = produtos.find((p) => p.id === item.produtoId);
      if (!prod) {
        return NextResponse.json(
          { error: `Produto ${item.produtoId} não encontrado` },
          { status: 400 }
        );
      }
      if (!prod.disponivel) {
        return NextResponse.json(
          { error: `Produto "${prod.nome}" indisponível` },
          { status: 400 }
        );
      }
      if (prod.restauranteId !== body.restauranteId) {
        return NextResponse.json(
          { error: `Produto "${prod.nome}" não pertence ao restaurante informado` },
          { status: 400 }
        );
      }
    }

    // Criar pedido + itens + pagamento em transação
    const codigoRastreio = `FD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const pedido = await db.pedido.create({
      data: {
        clienteId: body.clienteId,
        restauranteId: body.restauranteId,
        status: "PAGO", // assume pagamento aprovado para simplificação
        valorTotal: body.valorTotal,
        valorFrete: body.valorFrete,
        valorDesconto: body.valorDesconto,
        formaPagamento: body.formaPagamento,
        enderecoEntrega: body.enderecoEntrega,
        codigoRastreio,
        tempoEstimado: 45,
        observacoes: body.observacoes,
        cupomId: body.cupomId || null,
        itens: {
          create: body.itens.map((item) => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            observacoes: item.observacoes || null,
            subtotal: item.precoUnitario * item.quantidade,
          })),
        },
        pagamento: {
          create: {
            valor: body.valorTotal,
            metodo: body.formaPagamento,
            status: "APROVADO",
            transacaoId: `${body.formaPagamento}-${Date.now()}`,
            parcelas: 1,
          },
        },
      },
      include: {
        itens: { include: { produto: true } },
        restaurante: true,
        pagamento: true,
      },
    });

    // Incrementar uso do cupom se aplicado
    if (body.cupomId) {
      await db.cupom.update({
        where: { id: body.cupomId },
        data: { usosAtuais: { increment: 1 } },
      });
    }

    return NextResponse.json({ pedido }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar pedido" },
      { status: 500 }
    );
  }
}
