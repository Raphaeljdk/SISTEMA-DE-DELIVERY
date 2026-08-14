/**
 * Módulo de autenticação — substitui NextAuth para simplificar.
 *
 * Recursos:
 *  - hashSenha(senha) → string (bcrypt)
 *  - verificarSenha(senha, hash) → boolean
 *  - gerarToken() → string aleatório (32 bytes hex)
 *  - criarSessao(usuarioId, req) → Sessao (persiste no banco)
 *  - getUsuarioFromRequest(req) → Usuario | null (lê cookie)
 *  - requireAuth(req, role?) → Usuario (lança erro se não autenticado)
 *  - deletarSessao(token) → void (logout)
 *
 * Cookie:
 *  - Nome: food_delivery_token
 *  - httpOnly: true (não acessível via JS)
 *  - secure: true em produção
 *  - sameSite: 'lax'
 *  - maxAge: 7 dias
 */
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { randomBytes } from "crypto";

const COOKIE_NAME = "food_delivery_token";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export type TipoUsuario = "CLIENTE" | "ENTREGADOR" | "RESTAURANTE" | "ADMIN";

export interface UsuarioLogado {
  id: string;
  nome: string;
  email: string;
  tipoUsuario: TipoUsuario;
  avatarUrl: string | null;
  restauranteId?: string | null; // se for RESTAURANTE
  clienteId?: string | null; // se for CLIENTE
}

// ──────────────────────────────────────────────────────────────────────────
// SENHA
// ──────────────────────────────────────────────────────────────────────────

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

// ──────────────────────────────────────────────────────────────────────────
// TOKEN
// ──────────────────────────────────────────────────────────────────────────

export function gerarToken(): string {
  return randomBytes(32).toString("hex");
}

// ──────────────────────────────────────────────────────────────────────────
// SESSÃO
// ──────────────────────────────────────────────────────────────────────────

export async function criarSessao(
  usuarioId: string,
  req?: NextRequest
): Promise<string> {
  const token = gerarToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const ip = req?.headers.get("x-forwarded-for") || req?.headers.get("x-real-ip") || null;
  const userAgent = req?.headers.get("user-agent") || null;

  await db.sessao.create({
    data: {
      usuarioId,
      token,
      expiresAt,
      ip,
      userAgent,
    },
  });

  return token;
}

export async function getUsuarioFromToken(
  token: string
): Promise<UsuarioLogado | null> {
  if (!token) return null;

  const sessao = await db.sessao.findUnique({
    where: { token },
    include: {
      usuario: {
        include: {
          restaurante: { select: { id: true } },
          cliente: { select: { id: true } },
        },
      },
    },
  });

  if (!sessao) return null;
  if (sessao.expiresAt < new Date()) {
    // Sessão expirada — limpa
    await db.sessao.delete({ where: { id: sessao.id } }).catch(() => {});
    return null;
  }
  if (!sessao.usuario.ativo) return null;

  return {
    id: sessao.usuario.id,
    nome: sessao.usuario.nome,
    email: sessao.usuario.email,
    tipoUsuario: sessao.usuario.tipoUsuario as TipoUsuario,
    avatarUrl: sessao.usuario.avatarUrl,
    restauranteId: sessao.usuario.restaurante?.id || null,
    clienteId: sessao.usuario.cliente?.id || null,
  };
}

export async function getUsuarioFromRequest(
  req: NextRequest
): Promise<UsuarioLogado | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return getUsuarioFromToken(token);
}

export async function requireAuth(
  req: NextRequest,
  role?: TipoUsuario | TipoUsuario[]
): Promise<UsuarioLogado> {
  const usuario = await getUsuarioFromRequest(req);
  if (!usuario) {
    throw new AuthError("Não autenticado", 401);
  }
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(usuario.tipoUsuario)) {
      throw new AuthError(`Acesso negado. Requer: ${roles.join(" ou ")}`, 403);
    }
  }
  return usuario;
}

export async function deletarSessao(token: string): Promise<void> {
  await db.sessao.deleteMany({ where: { token } }).catch(() => {});
}

// Limpa sessões expiradas (chamar periodicamente)
export async function limparSessoesExpiradas(): Promise<number> {
  const result = await db.sessao.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}

// ──────────────────────────────────────────────────────────────────────────
// COOKIE HELPERS
// ──────────────────────────────────────────────────────────────────────────

export function setSessionCookie(token: string): string {
  const isProd = process.env.NODE_ENV === "production";
  const parts = [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    `SameSite=Lax`,
    `Max-Age=${SESSION_DURATION_MS / 1000}`,
  ];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export const COOKIE_NAME_SESSION = COOKIE_NAME;

// ──────────────────────────────────────────────────────────────────────────
// ERRORS
// ──────────────────────────────────────────────────────────────────────────

export class AuthError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AuthError";
  }
}

// ──────────────────────────────────────────────────────────────────────────
// CLIENT HOOK (useAuth)
// ──────────────────────────────────────────────────────────────────────────

export async function getUsuarioFromCookies(): Promise<UsuarioLogado | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return getUsuarioFromToken(token);
}
