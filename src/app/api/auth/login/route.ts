/**
 * POST /api/auth/login
 * Autentica usuário (cliente OU dono de restaurante) e cria sessão.
 *
 * Body: { email, senha }
 * Response: { usuario: UsuarioLogado } + Set-Cookie
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verificarSenha, criarSessao, setSessionCookie, AuthError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();

    if (!email || !senha) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const usuario = await db.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        restaurante: { select: { id: true, nome: true } },
        cliente: { select: { id: true } },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
    }

    if (!usuario.ativo) {
      return NextResponse.json(
        { error: "Conta desativada. Entre em contato com o suporte." },
        { status: 403 }
      );
    }

    const senhaOk = await verificarSenha(senha, usuario.senhaHash);
    if (!senhaOk) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
    }

    // Cria sessão
    const token = await criarSessao(usuario.id, req);

    const response = NextResponse.json({
      ok: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipoUsuario: usuario.tipoUsuario,
        avatarUrl: usuario.avatarUrl,
        restaurante: usuario.restaurante,
        cliente: usuario.cliente,
      },
    });

    response.headers.set("Set-Cookie", setSessionCookie(token));
    return response;
  } catch (error) {
    console.error("Erro no login:", error);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
