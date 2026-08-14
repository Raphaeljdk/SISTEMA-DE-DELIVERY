"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Phone, Loader2, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function CadastroClientePage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/registro-cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao cadastrar");
        return;
      }

      await refresh();
      toast.success("Conta criada com sucesso!");
      router.push("/");
    } catch {
      setErro("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1 bg-paper">
        <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <Link href="/login" className="mb-4 inline-flex items-center text-xs text-muted-foreground hover:text-primary">
              <ArrowLeft className="mr-1 h-3 w-3" />
              Voltar para login
            </Link>

            <div className="mb-6 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <User className="h-6 w-6" />
              </div>
              <h1 className="font-serif text-2xl font-bold">Cadastro de Cliente</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Crie sua conta para fazer pedidos
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-lg">Dados pessoais</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field
                    id="nome"
                    label="Nome completo"
                    icon={User}
                    value={form.nome}
                    onChange={(v) => setForm({ ...form, nome: v })}
                    placeholder="Maria Santos"
                    required
                  />
                  <Field
                    id="email"
                    label="Email"
                    type="email"
                    icon={Mail}
                    value={form.email}
                    onChange={(v) => setForm({ ...form, email: v })}
                    placeholder="seu@email.com"
                    required
                  />
                  <Field
                    id="telefone"
                    label="Telefone"
                    icon={Phone}
                    value={form.telefone}
                    onChange={(v) => setForm({ ...form, telefone: v })}
                    placeholder="(11) 98765-4321"
                    required
                  />
                  <Field
                    id="senha"
                    label="Senha"
                    type="password"
                    icon={Lock}
                    value={form.senha}
                    onChange={(v) => setForm({ ...form, senha: v })}
                    placeholder="Mínimo 6 caracteres"
                    required
                    min={6}
                  />

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
                        Cadastrando...
                      </>
                    ) : (
                      <>
                        Criar conta
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  É dono de restaurante?{" "}
                  <Link href="/cadastro/restaurante" className="font-medium text-primary hover:underline">
                    Cadastre seu estabelecimento
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  min,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          min={min}
          className="pl-10"
        />
      </div>
    </div>
  );
}
