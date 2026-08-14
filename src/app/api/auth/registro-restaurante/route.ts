/**
 * POST /api/auth/registro-restaurante
 * Cadastra novo dono de restaurante (com dados do estabelecimento).
 *
 * Body: {
 *   nome: string,            // nome do responsável
 *   email: string,
 *   senha: string,
 *   telefone: string,
 *   restaurante: {
 *     nome: string,
 *     cnpj: string,
 *     descricao: string,
 *     endereco: string,
 *     categoria: string,
 *     taxaEntrega: number,
 *     tempoEntrega: number,
 *   }
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashSenha, criarSessao, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, email, senha, telefone, restaurante: restData } = body;

    // Validações usuário
    if (!nome || !email || !senha || !telefone) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome, email, senha, telefone" },
        { status: 400 }
      );
    }
    if (senha.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    // Validações restaurante
    if (!restData?.nome || !restData?.cnpj || !restData?.endereco || !restData?.categoria) {
      return NextResponse.json(
        { error: "Dados do restaurante incompletos: nome, cnpj, endereco, categoria" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Verifica email duplicado
    const emailExistente = await db.usuario.findUnique({
      where: { email: emailLower },
    });
    if (emailExistente) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 }
      );
    }

    // Verifica CNPJ duplicado
    const cnpjExistente = await db.restaurante.findUnique({
      where: { cnpj: restData.cnpj },
    });
    if (cnpjExistente) {
      return NextResponse.json(
        { error: "CNPJ já cadastrado" },
        { status: 409 }
      );
    }

    // Cria usuário + restaurante em transação
    const senhaHash = await hashSenha(senha);
    const usuario = await db.usuario.create({
      data: {
        nome,
        email: emailLower,
        senhaHash,
        telefone,
        tipoUsuario: "RESTAURANTE",
        restaurante: {
          create: {
            nome: restData.nome,
            cnpj: restData.cnpj,
            descricao: restData.descricao || null,
            endereco: restData.endereco,
            telefone,
            taxaEntrega: restData.taxaEntrega || 7.90,
            tempoEntrega: restData.tempoEntrega || 30,
            comissao: 0.12,
            aberto: false, // começa fechado até configurar cardápio
            categoria: restData.categoria,
            avaliacaoMedia: 5.0,
          },
        },
      },
      include: { restaurante: true },
    });

    // Cria sessão
    const token = await criarSessao(usuario.id, req);

    const response = NextResponse.json({
      ok: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipoUsuario: usuario.tipoUsuario,
        restauranteId: usuario.restaurante?.id,
      },
    });

    response.headers.set("Set-Cookie", setSessionCookie(token));
    return response;
  } catch (error) {
    console.error("Erro ao registrar restaurante:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
