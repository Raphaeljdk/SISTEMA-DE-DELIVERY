"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Store, Mail, Lock, Phone, MapPin, FileText, Hash, Loader2, ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const CATEGORIAS = [
  "Hambúrgueres",
  "Pizzas",
  "Japonesa",
  "Mexicana",
  "Italiana",
  "Brasileira",
  "Saudável",
  "Chinesa",
  "Árabe",
  "Doces",
  "Vegana",
];

export default function CadastroRestaurantePage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [usuario, setUsuario] = useState({
    nome: "",
    email: "",
    senha: "",
    telefone: "",
  });

  const [restaurante, setRestaurante] = useState({
    nome: "",
    cnpj: "",
    descricao: "",
    endereco: "",
    categoria: "Hambúrgueres",
    taxaEntrega: 7.90,
    tempoEntrega: 30,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/registro-restaurante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...usuario, restaurante }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || "Erro ao cadastrar");
        return;
      }

      await refresh();
      toast.success("Restaurante cadastrado! Configure seu cardápio.");
      if (data.usuario.restauranteId) {
        router.push(`/restaurante-painel?id=${data.usuario.restauranteId}`);
      } else {
        router.push("/");
      }
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
        <div className="container mx-auto px-4 py-10">
          <div className="mx-auto max-w-2xl">
            <Link href="/login" className="mb-4 inline-flex items-center text-xs text-muted-foreground hover:text-primary">
              <ArrowLeft className="mr-1 h-3 w-3" />
              Voltar para login
            </Link>

            <div className="mb-8 text-center">
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Store className="h-6 w-6" />
              </div>
              <h1 className="font-serif text-2xl font-bold md:text-3xl">
                Cadastro de Restaurante
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Seja parceiro e comece a receber pedidos hoje mesmo
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados do responsável */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Dados do responsável</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field
                      id="nome"
                      label="Nome do responsável"
                      icon={Store}
                      value={usuario.nome}
                      onChange={(v) => setUsuario({ ...usuario, nome: v })}
                      placeholder="João Silva"
                      required
                    />
                    <Field
                      id="telefone"
                      label="Telefone"
                      icon={Phone}
                      value={usuario.telefone}
                      onChange={(v) => setUsuario({ ...usuario, telefone: v })}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                  <Field
                    id="email"
                    label="Email (login)"
                    type="email"
                    icon={Mail}
                    value={usuario.email}
                    onChange={(v) => setUsuario({ ...usuario, email: v })}
                    placeholder="seu@email.com"
                    required
                  />
                  <Field
                    id="senha"
                    label="Senha"
                    type="password"
                    icon={Lock}
                    value={usuario.senha}
                    onChange={(v) => setUsuario({ ...usuario, senha: v })}
                    placeholder="Mínimo 6 caracteres"
                    required
                    min={6}
                  />
                </CardContent>
              </Card>

              {/* Dados do restaurante */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Dados do restaurante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Field
                    id="rest-nome"
                    label="Nome do restaurante"
                    icon={Store}
                    value={restaurante.nome}
                    onChange={(v) => setRestaurante({ ...restaurante, nome: v })}
                    placeholder="Burguer House"
                    required
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field
                      id="cnpj"
                      label="CNPJ"
                      icon={Hash}
                      value={restaurante.cnpj}
                      onChange={(v) => setRestaurante({ ...restaurante, cnpj: v })}
                      placeholder="12.345.678/0001-90"
                      required
                    />
                    <div className="space-y-1.5">
                      <Label htmlFor="categoria">Categoria</Label>
                      <select
                        id="categoria"
                        value={restaurante.categoria}
                        onChange={(e) => setRestaurante({ ...restaurante, categoria: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        {CATEGORIAS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Field
                    id="endereco"
                    label="Endereço completo"
                    icon={MapPin}
                    value={restaurante.endereco}
                    onChange={(v) => setRestaurante({ ...restaurante, endereco: v })}
                    placeholder="Rua, número, bairro, cidade"
                    required
                  />

                  <div className="space-y-1.5">
                    <Label htmlFor="descricao">Descrição (opcional)</Label>
                    <div className="relative">
                      <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="descricao"
                        value={restaurante.descricao}
                        onChange={(e) => setRestaurante({ ...restaurante, descricao: e.target.value })}
                        placeholder="Conte um pouco sobre seu restaurante..."
                        rows={3}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="taxa">Taxa de entrega (R$)</Label>
                      <Input
                        id="taxa"
                        type="number"
                        step="0.01"
                        value={restaurante.taxaEntrega}
                        onChange={(e) => setRestaurante({ ...restaurante, taxaEntrega: parseFloat(e.target.value) })}
                        min={0}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tempo">Tempo médio (min)</Label>
                      <Input
                        id="tempo"
                        type="number"
                        value={restaurante.tempoEntrega}
                        onChange={(e) => setRestaurante({ ...restaurante, tempoEntrega: parseInt(e.target.value) })}
                        min={5}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {erro && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{erro}</span>
                </div>
              )}

              <Button type="submit" disabled={loading} size="lg" className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando restaurante...
                  </>
                ) : (
                  <>
                    Cadastrar restaurante
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Ao se cadastrar, você concorda com nossos termos de uso e política de privacidade.
              </p>
            </form>
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
