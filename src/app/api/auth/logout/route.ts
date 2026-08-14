/**
 * POST /api/auth/logout
 * Encerra sessão atual (deleta do banco + limpa cookie).
 */
import { NextRequest, NextResponse } from "next/server";
import { deletarSessao, clearSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("food_delivery_token")?.value;
    if (token) {
      await deletarSessao(token);
    }
    const response = NextResponse.json({ ok: true });
    response.headers.set("Set-Cookie", clearSessionCookie());
    return response;
  } catch (error) {
    console.error("Erro no logout:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
