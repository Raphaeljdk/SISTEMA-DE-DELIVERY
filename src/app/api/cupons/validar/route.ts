/**
 * POST /api/cupons/validar
 * Valida um cupom e retorna o desconto aplicável (Extend: Aplicar Cupom Desconto).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface ValidarCupomPayload {
  codigo: string;
  restauranteId?: string;
  valorSubtotal: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ValidarCupomPayload;
    const codigo = body.codigo?.trim().toUpperCase();

    if (!codigo) {
      return NextResponse.json(
        { error: "Código do cupom é obrigatório" },
        { status: 400 }
      );
    }

    const cupom = await db.cupom.findUnique({
      where: { codigo },
    });

    if (!cupom) {
      return NextResponse.json(
        { error: "Cupom não encontrado" },
        { status: 404 }
      );
    }

    // Validações
    if (!cupom.ativo) {
      return NextResponse.json({ error: "Cupom inativo" }, { status: 400 });
    }

    if (cupom.validade < new Date()) {
      return NextResponse.json({ error: "Cupom expirado" }, { status: 400 });
    }

    if (cupom.usosAtuais >= cupom.usosMaximos) {
      return NextResponse.json(
        { error: "Cupom esgotado (limite de usos atingido)" },
        { status: 400 }
      );
    }

    if (cupom.restauranteId && cupom.restauranteId !== body.restauranteId) {
      return NextResponse.json(
        { error: "Cupom não é válido para este restaurante" },
        { status: 400 }
      );
    }

    // Calcular desconto
    let valorDesconto = 0;
    if (cupom.tipo === "PERCENTUAL") {
      valorDesconto = (body.valorSubtotal * cupom.descontoPercentual) / 100;
    } else if (cupom.tipo === "FIXO") {
      valorDesconto = Math.min(cupom.descontoFixo, body.valorSubtotal);
    } else if (cupom.tipo === "FRETE_GRATIS") {
      valorDesconto = cupom.descontoFixo; // abate do frete
    }

    return NextResponse.json({
      valido: true,
      cupom: {
        id: cupom.id,
        codigo: cupom.codigo,
        tipo: cupom.tipo,
        descontoPercentual: cupom.descontoPercentual,
        descontoFixo: cupom.descontoFixo,
      },
      valorDesconto,
    });
  } catch (error) {
    console.error("Erro ao validar cupom:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
