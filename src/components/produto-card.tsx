"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Minus, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCarrinho } from "@/lib/carrinho-store";
import { formatCurrency } from "@/lib/format";

interface ProdutoCardProps {
  produto: {
    id: string;
    nome: string;
    descricao?: string | null;
    preco: number;
    imagemUrl?: string | null;
    tempoPreparo: number;
    disponivel: boolean;
  };
  restaurante: {
    id: string;
    nome: string;
    taxaEntrega: number;
  };
  disabled?: boolean;
}

export function ProdutoCard({
  produto,
  restaurante,
  disabled = false,
}: ProdutoCardProps) {
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState("");
  const [open, setOpen] = useState(false);

  const addItem = useCarrinho((s) => s.addItem);

  const handleAdd = () => {
    addItem({
      produtoId: produto.id,
      restauranteId: restaurante.id,
      restauranteNome: restaurante.nome,
      nome: produto.nome,
      preco: produto.preco,
      observacoes: observacoes || undefined,
      imagemUrl: produto.imagemUrl,
    }, quantidade);
    toast.success(`${quantidade}x ${produto.nome} adicionado ao carrinho`);
    setOpen(false);
    setQuantidade(1);
    setObservacoes("");
  };

  const handleQuickAdd = () => {
    addItem({
      produtoId: produto.id,
      restauranteId: restaurante.id,
      restauranteNome: restaurante.nome,
      nome: produto.nome,
      preco: produto.preco,
      imagemUrl: produto.imagemUrl,
    }, 1);
    toast.success(`${produto.nome} adicionado ao carrinho`);
  };

  if (!produto.disponivel) {
    return (
      <Card className="opacity-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
              {produto.imagemUrl && (
                <Image
                  src={produto.imagemUrl}
                  alt={produto.nome}
                  fill
                  sizes="64px"
                  className="object-cover grayscale"
                />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground">{produto.nome}</h4>
              <p className="text-sm text-muted-foreground">Indisponível</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`card-hover p-0 ${disabled ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Imagem */}
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            {produto.imagemUrl ? (
              <Image
                src={produto.imagemUrl}
                alt={produto.nome}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-primary/10 text-primary">
                <span className="font-serif text-xl font-bold">
                  {produto.nome.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col">
            <h4 className="font-medium leading-tight text-foreground">
              {produto.nome}
            </h4>
            {produto.descricao && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {produto.descricao}
              </p>
            )}
            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-serif text-sm font-bold text-primary">
                  {formatCurrency(produto.preco)}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {produto.tempoPreparo}min
                </span>
              </div>

              {/* Quick add */}
              <Button
                size="sm"
                variant="outline"
                onClick={handleQuickAdd}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Customize button */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-xs"
              disabled={disabled}
            >
              Personalizar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{produto.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {produto.descricao && (
                <p className="text-sm text-muted-foreground">
                  {produto.descricao}
                </p>
              )}

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Ex: sem cebola, ponto da carne, etc."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Quantidade</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {quantidade}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setQuantidade(quantidade + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <Label>Subtotal</Label>
                  <p className="mt-1 font-serif text-lg font-bold text-primary">
                    {formatCurrency(produto.preco * quantidade)}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleAdd}
                className="w-full"
                disabled={disabled}
              >
                <Check className="mr-2 h-4 w-4" />
                Adicionar ao carrinho
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
