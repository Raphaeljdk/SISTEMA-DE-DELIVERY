"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Tag,
  Check,
  Loader2,
  ArrowLeft,
  CreditCard,
  Wallet,
  QrCode,
  MapPin,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { useCarrinho } from "@/lib/carrinho-store";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SessaoCliente {
  id: string;
  usuario: { nome: string; email: string; avatarUrl: string | null };
  enderecos: Array<{
    id: string;
    apelido: string;
    rua: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
  }>;
}

export default function CarrinhoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cupomInput, setCupomInput] = useState("");
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [cliente, setCliente] = useState<SessaoCliente | null>(null);
  const [loadingCliente, setLoadingCliente] = useState(true);

  useEffect(() => {
    fetch("/api/sessao")
      .then((r) => r.json())
      .then((data) => {
        if (data.cliente) {
          setCliente(data.cliente);
          // Pré-seleciona primeiro endereço
          if (data.cliente.enderecos[0]) {
            const end = data.cliente.enderecos[0];
            setEndereco(`${end.rua}, ${end.numero}${end.complemento ? ` - ${end.complemento}` : ""}, ${end.bairro}, ${end.cidade}`);
          }
        }
      })
      .catch(() => toast.error("Erro ao carregar dados do cliente"))
      .finally(() => setLoadingCliente(false));
  }, []);

  const {
    itens,
    restauranteIdAtual,
    cupomCodigo,
    cupomDesconto,
    cupomTipo,
    enderecoEntrega,
    formaPagamento,
    removeItem,
    updateQuantidade,
    clear,
    setCupom,
    setEndereco,
    setFormaPagamento,
    calcularSubtotal,
    calcularDesconto,
    calcularTotal,
  } = useCarrinho();

  // Buscar taxa de entrega do restaurante dinamicamente
  const [taxaEntrega, setTaxaEntrega] = useState(7.90);
  useEffect(() => {
    if (restauranteIdAtual) {
      fetch(`/api/restaurantes/${restauranteIdAtual}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.restaurante?.taxaEntrega) {
            setTaxaEntrega(data.restaurante.taxaEntrega);
          }
        })
        .catch(() => {});
    }
  }, [restauranteIdAtual]);

  const subtotal = calcularSubtotal();
  const desconto = calcularDesconto(subtotal, taxaEntrega);
  const total = calcularTotal(taxaEntrega);

  const handleValidarCupom = async () => {
    if (!cupomInput.trim()) {
      toast.error("Digite um código de cupom");
      return;
    }
    setValidandoCupom(true);
    try {
      const res = await fetch("/api/cupons/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: cupomInput,
          restauranteId: restauranteIdAtual,
          valorSubtotal: subtotal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Cupom inválido");
        setCupom(null, 0, null);
        return;
      }
      setCupom(data.cupom.codigo, data.cupom.descontoPercentual || data.cupom.descontoFixo, data.cupom.tipo);
      toast.success(`Cupom ${data.cupom.codigo} aplicado!`);
    } catch {
      toast.error("Erro ao validar cupom");
    } finally {
      setValidandoCupom(false);
    }
  };

  const handleCheckout = async () => {
    if (!restauranteIdAtual) {
      toast.error("Carrinho vazio");
      return;
    }
    if (!enderecoEntrega) {
      toast.error("Selecione o endereço de entrega");
      return;
    }
    if (!cliente) {
      toast.error("Cliente não carregado");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId: cliente.id,
          restauranteId: restauranteIdAtual,
          itens: itens.map((i) => ({
            produtoId: i.produtoId,
            quantidade: i.quantidade,
            precoUnitario: i.preco,
            observacoes: i.observacoes,
          })),
          enderecoEntrega,
          formaPagamento,
          valorTotal: total,
          valorFrete: taxaEntrega,
          valorDesconto: desconto,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao criar pedido");
        return;
      }

      toast.success("Pedido criado com sucesso!");
      clear();
      router.push(`/pedidos/${data.pedido.id}`);
    } catch {
      toast.error("Erro ao processar pedido");
    } finally {
      setLoading(false);
    }
  };

  if (itens.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-16">
            <EmptyState
              icon={ShoppingCart}
              title="Seu carrinho está vazio"
              description="Adicione itens do cardápio dos seus restaurantes favoritos."
            />
            <div className="mt-6 text-center">
              <Link href="/restaurantes">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Explorar restaurantes
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-border/60 bg-paper">
          <div className="container mx-auto px-4 py-8">
            <div className="border-l-4 border-l-primary pl-4">
              <h1 className="font-serif text-3xl font-black tracking-tight md:text-4xl">
                Carrinho
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {itens.length} item(s) · {itens[0]?.restauranteNome}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-background">
          <div className="container mx-auto grid grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-3">
            {/* Coluna esquerda: itens + endereço + pagamento */}
            <div className="space-y-6 lg:col-span-2">
              {/* Itens */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">
                    Itens do pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {itens.map((item) => (
                    <div
                      key={item.produtoId}
                      className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
                    >
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                        {item.imagemUrl ? (
                          <Image
                            src={item.imagemUrl}
                            alt={item.nome}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-primary/10 text-primary">
                            <span className="font-serif text-sm font-bold">
                              {item.nome.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-medium leading-tight text-foreground">
                          {item.nome}
                        </h4>
                        <p className="text-sm font-medium text-primary">
                          {formatCurrency(item.preco)}
                        </p>
                        {item.observacoes && (
                          <p className="mt-1 text-xs italic text-muted-foreground">
                            &ldquo;{item.observacoes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Quantidade */}
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() =>
                            updateQuantidade(item.produtoId, item.quantidade - 1)
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantidade}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() =>
                            updateQuantidade(item.produtoId, item.quantidade + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeItem(item.produtoId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clear}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Limpar carrinho
                  </Button>
                </CardContent>
              </Card>

              {/* Endereço */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <MapPin className="h-4 w-4 text-primary" />
                    Endereço de entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCliente ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando endereços...
                    </div>
                  ) : cliente && cliente.enderecos.length > 0 ? (
                    <RadioGroup
                      value={enderecoEntrega || ""}
                      onValueChange={setEndereco}
                      className="space-y-2"
                    >
                      {cliente.enderecos.map((end) => {
                        const enderecoCompleto = `${end.rua}, ${end.numero}${end.complemento ? ` - ${end.complemento}` : ""}, ${end.bairro}, ${end.cidade}`;
                        return (
                          <Label
                            key={end.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                              enderecoEntrega === enderecoCompleto
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <RadioGroupItem value={enderecoCompleto} id={`end-${end.id}`} />
                            <div>
                              <p className="font-medium">{end.apelido}</p>
                              <p className="text-sm text-muted-foreground">
                                {end.rua}, {end.numero}
                                {end.complemento ? ` - ${end.complemento}` : ""}
                                <br />
                                {end.bairro} - {end.cidade}
                              </p>
                            </div>
                          </Label>
                        );
                      })}
                    </RadioGroup>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum endereço cadastrado.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Forma de pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-lg">
                    Forma de pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formaPagamento}
                    onValueChange={(v) => setFormaPagamento(v as "PIX" | "CARTAO" | "CARTEIRA")}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                  >
                    {[
                      { value: "PIX", label: "PIX", icon: QrCode, desc: "Aprovação imediata" },
                      { value: "CARTAO", label: "Cartão", icon: CreditCard, desc: "Crédito/Débito" },
                      { value: "CARTEIRA", label: "Carteira", icon: Wallet, desc: "Saldo digital" },
                    ].map((opt) => (
                      <Label
                        key={opt.value}
                        htmlFor={`pgto-${opt.value}`}
                        className={cn(
                          "flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors",
                          formaPagamento === opt.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <RadioGroupItem value={opt.value} id={`pgto-${opt.value}`} className="sr-only" />
                        <opt.icon className={cn(
                          "h-5 w-5",
                          formaPagamento === opt.value ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className="font-medium text-sm">{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Coluna direita: resumo */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Resumo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cupom */}
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Cupom de desconto
                    </Label>
                    <div className="mt-1 flex gap-2">
                      <Input
                        placeholder="BEMVINDO10"
                        value={cupomInput}
                        onChange={(e) => setCupomInput(e.target.value.toUpperCase())}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        onClick={handleValidarCupom}
                        disabled={validandoCupom}
                      >
                        {validandoCupom ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Tag className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {cupomCodigo && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">
                          <Check className="mr-1 h-3 w-3" />
                          {cupomCodigo} aplicado
                        </Badge>
                        <button
                          onClick={() => {
                            setCupom(null, 0, null);
                            setCupomInput("");
                          }}
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          remover
                        </button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Valores */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa de entrega</span>
                      <span className="font-medium">{formatCurrency(taxaEntrega)}</span>
                    </div>
                    {desconto > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Desconto</span>
                        <span className="font-medium">-{formatCurrency(desconto)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-serif text-base font-bold">Total</span>
                      <span className="font-serif text-xl font-bold text-primary">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={loading || !enderecoEntrega}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Confirmar pedido
                      </>
                    )}
                  </Button>

                  {!enderecoEntrega && (
                    <p className="text-center text-xs text-muted-foreground">
                      Selecione o endereço de entrega para continuar
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
