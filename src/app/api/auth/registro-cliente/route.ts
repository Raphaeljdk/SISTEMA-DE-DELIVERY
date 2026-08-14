/**
 * POST /api/auth/registro-cliente
 * Cadastra novo cliente (usuário comum).
 *
 * Body: { nome, email, senha, telefone }
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashSenha, criarSessao, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { nome, email, senha, telefone } = await req.json();

    // Validações
    if (!nome || !email || !senha || !telefone) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios: nome, email, senha, telefone" },
        { status: 400 }
      );
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: "Senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Verifica se email já existe
    const existente = await db.usuario.findUnique({
      where: { email: emailLower },
    });
    if (existente) {
      return NextResponse.json(
        { error: "Email já cadastrado. Faça login." },
        { status: 409 }
      );
    }

    // Cria usuário + cliente em transação
    const senhaHash = await hashSenha(senha);
    const usuario = await db.usuario.create({
      data: {
        nome,
        email: emailLower,
        senhaHash,
        telefone,
        tipoUsuario: "CLIENTE",
        cliente: { create: {} },
      },
      include: { cliente: true },
    });

    // Cria sessão automaticamente
    const token = await criarSessao(usuario.id, req);

    const response = NextResponse.json({
      ok: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipoUsuario: usuario.tipoUsuario,
        clienteId: usuario.cliente?.id,
      },
    });

    response.headers.set("Set-Cookie", setSessionCookie(token));
    return response;
  } catch (error) {
    console.error("Erro ao registrar cliente:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
