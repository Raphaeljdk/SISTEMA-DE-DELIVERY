/**
 * POST /api/produtos
 * Cria novo produto no cardápio do restaurante (apenas RESTAURANTE logado).
 *
 * Body: {
 *   nome, descricao, preco, categoria, tempoPreparo,
 *   imagemUrl?, disponivel?
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUsuarioFromRequest, AuthError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const usuario = await getUsuarioFromRequest(req);
    if (!usuario) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (usuario.tipoUsuario !== "RESTAURANTE" || !usuario.restauranteId) {
      return NextResponse.json(
        { error: "Apenas restaurantes podem cadastrar produtos" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { nome, descricao, preco, categoria, tempoPreparo, imagemUrl, disponivel } = body;

    if (!nome || !preco || !categoria) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome, preco, categoria" },
        { status: 400 }
      );
    }

    if (preco <= 0) {
      return NextResponse.json({ error: "Preço deve ser positivo" }, { status: 400 });
    }

    const produto = await db.produto.create({
      data: {
        restauranteId: usuario.restauranteId,
        nome,
        descricao: descricao || null,
        preco: parseFloat(preco),
        categoria,
        tempoPreparo: parseInt(tempoPreparo) || 15,
        imagemUrl: imagemUrl || null,
        disponivel: disponivel !== false,
      },
    });

    return NextResponse.json({ produto }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * GET /api/produtos?restauranteId=xxx
 * Lista produtos de um restaurante.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restauranteId = searchParams.get("restauranteId");

    if (!restauranteId) {
      return NextResponse.json(
        { error: "restauranteId é obrigatório" },
        { status: 400 }
      );
    }

    const produtos = await db.produto.findMany({
      where: { restauranteId },
      orderBy: { categoria: "asc" },
    });

    return NextResponse.json({ produtos });
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
