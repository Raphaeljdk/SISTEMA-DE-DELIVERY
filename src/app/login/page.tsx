"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Utensils, Store, Mail, Lock, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [tab, setTab] = useState<"cliente" | "restaurante">("cliente");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao fazer login");
        return;
      }

      // Verifica se o tipo de usuário bate com a aba selecionada
      if (tab === "restaurante" && data.usuario.tipoUsuario !== "RESTAURANTE") {
        setErro("Esta conta não é de restaurante. Use a aba Cliente.");
        return;
      }
      if (tab === "cliente" && data.usuario.tipoUsuario === "RESTAURANTE") {
        setErro("Esta conta é de restaurante. Use a aba Restaurante.");
        return;
      }

      await refresh();
      toast.success(`Bem-vindo, ${data.usuario.nome}!`);

      // Redireciona conforme o tipo
      if (data.usuario.tipoUsuario === "RESTAURANTE" && data.usuario.restaurante?.id) {
        router.push(`/restaurante-painel?id=${data.usuario.restaurante.id}`);
      } else {
        router.push("/");
      }
    } catch {
      setErro("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const credenciaisDemo = [
    { tipo: "Cliente", email: "maria@gmail.com", senha: "cliente123" },
    { tipo: "Restaurante", email: "burguer@house.com", senha: "restaurante123" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 bg-paper">
        <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Utensils className="h-6 w-6" />
              </div>
              <h1 className="font-serif text-2xl font-bold">Entrar</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Acesse sua conta para continuar
              </p>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as "cliente" | "restaurante")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cliente" className="gap-2">
                  <Utensils className="h-4 w-4" />
                  Cliente
                </TabsTrigger>
                <TabsTrigger value="restaurante" className="gap-2">
                  <Store className="h-4 w-4" />
                  Restaurante
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cliente">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">
                      Login do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormLogin
                      email={email}
                      senha={senha}
                      loading={loading}
                      erro={erro}
                      onEmail={setEmail}
                      onSenha={setSenha}
                      onSubmit={handleSubmit}
                    />
                    <p className="mt-4 text-center text-xs text-muted-foreground">
                      Não tem conta?{" "}
                      <Link href="/cadastro/cliente" className="font-medium text-primary hover:underline">
                        Cadastre-se como cliente
                      </Link>
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="restaurante">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif text-lg">
                      Login do Restaurante
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormLogin
                      email={email}
                      senha={senha}
                      loading={loading}
                      erro={erro}
                      onEmail={setEmail}
                      onSenha={setSenha}
                      onSubmit={handleSubmit}
                    />
                    <p className="mt-4 text-center text-xs text-muted-foreground">
                      Quer ser parceiro?{" "}
                      <Link href="/cadastro/restaurante" className="font-medium text-primary hover:underline">
                        Cadastre seu restaurante
                      </Link>
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Demo credentials */}
            <div className="mt-6 rounded-lg border border-border/60 bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                💡 Credenciais demo:
              </p>
              <div className="space-y-1.5">
                {credenciaisDemo.map((c) => (
                  <button
                    key={c.email}
                    onClick={() => {
                      setEmail(c.email);
                      setSenha(c.senha);
                      setTab(c.tipo === "Restaurante" ? "restaurante" : "cliente");
                    }}
                    className="flex w-full items-center justify-between rounded border border-border bg-background px-2.5 py-1.5 text-left text-xs transition-colors hover:border-primary"
                  >
                    <span className="font-medium">{c.tipo}</span>
                    <code className="text-muted-foreground">{c.email}</code>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function FormLogin({
  email,
  senha,
  loading,
  erro,
  onEmail,
  onSenha,
  onSubmit,
}: {
  email: string;
  senha: string;
  loading: boolean;
  erro: string | null;
  onEmail: (v: string) => void;
  onSenha: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            required
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="senha">Senha</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="senha"
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => onSenha(e.target.value)}
            required
            className="pl-10"
          />
        </div>
      </div>

      {erro && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            Entrar
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
