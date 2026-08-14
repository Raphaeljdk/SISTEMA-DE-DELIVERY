"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export interface UsuarioLogado {
  id: string;
  nome: string;
  email: string;
  tipoUsuario: "CLIENTE" | "ENTREGADOR" | "RESTAURANTE" | "ADMIN";
  avatarUrl: string | null;
  restauranteId?: string | null;
  clienteId?: string | null;
}

interface AuthContextValue {
  usuario: UsuarioLogado | null;
  loading: boolean;
  isAuthenticated: boolean;
  isCliente: boolean;
  isRestaurante: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setUsuario(data.usuario || null);
    } catch {
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUsuario(null);
    // Redirect para home
    window.location.href = "/";
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value: AuthContextValue = {
    usuario,
    loading,
    isAuthenticated: !!usuario,
    isCliente: usuario?.tipoUsuario === "CLIENTE",
    isRestaurante: usuario?.tipoUsuario === "RESTAURANTE",
    refresh,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return ctx;
}
