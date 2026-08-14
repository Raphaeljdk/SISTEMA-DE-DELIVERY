/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado (lê cookie).
 * Usado pelo hook useAuth no client para hidratar estado.
 */
import { NextRequest, NextResponse } from "next/server";
import { getUsuarioFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const usuario = await getUsuarioFromRequest(req);
    if (!usuario) {
      return NextResponse.json({ usuario: null }, { status: 200 });
    }

    // Busca dados completos (inclui restauranteId)
    const usuarioCompleto = await Promise.resolve(usuario);

    return NextResponse.json({ usuario: usuarioCompleto });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json({ usuario: null }, { status: 200 });
  }
}
