"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Loader2, X, Upload, Image as ImageIcon, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { ImageUpload } from "@/components/image-upload";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  categoria: string;
  disponivel: boolean;
  imagemUrl: string | null;
  tempoPreparo: number;
}

interface GerenciarCardapioProps {
  restauranteId: string;
}

const CATEGORIAS_SUGERIDAS = ["Hambúrgueres", "Pizzas", "Entradas", "Pratos Principais", "Acompanhamentos", "Sobremesas", "Bebidas"];

export function GerenciarCardapio({ restauranteId }: GerenciarCardapioProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/produtos?restauranteId=${restauranteId}`);
      const data = await res.json();
      setProdutos(data.produtos || []);
    } catch {
      toast.error("Erro ao carregar cardápio");
    } finally {
      setLoading(false);
    }
  }, [restauranteId]);

  useEffect(() => {
    fetchProdutos();
  }, [fetchProdutos]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao excluir");
        return;
      }
      toast.success("Produto excluído");
      fetchProdutos();
    } catch {
      toast.error("Erro de conexão");
    }
  };

  const handleToggleDisponivel = async (produto: Produto) => {
    try {
      const res = await fetch(`/api/produtos/${produto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disponivel: !produto.disponivel }),
      });
      if (!res.ok) {
        toast.error("Erro ao atualizar");
        return;
      }
      toast.success(produto.disponivel ? "Produto oculto" : "Produto visível");
      fetchProdutos();
    } catch {
      toast.error("Erro de conexão");
    }
  };

  // Agrupa por categoria
  const produtosPorCategoria: Record<string, Produto[]> = {};
  for (const p of produtos) {
    if (!produtosPorCategoria[p.categoria]) produtosPorCategoria[p.categoria] = [];
    produtosPorCategoria[p.categoria].push(p);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-serif text-lg">
            Cardápio ({produtos.length} {produtos.length === 1 ? "item" : "itens"})
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingId(null);
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Novo produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar produto" : "Novo produto"}
                </DialogTitle>
              </DialogHeader>
              <ProdutoForm
                restauranteId={restauranteId}
                produtoId={editingId}
                onSaved={() => {
                  setDialogOpen(false);
                  setEditingId(null);
                  fetchProdutos();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando cardápio...
          </div>
        ) : produtos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              Seu cardápio está vazio
            </p>
            <p className="text-xs text-muted-foreground/70">
              Clique em "Novo produto" para adicionar o primeiro item
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(produtosPorCategoria).map(([categoria, items]) => (
              <div key={categoria}>
                <h4 className="mb-2 font-serif text-sm font-semibold text-muted-foreground">
                  {categoria}
                </h4>
                <div className="space-y-2">
                  {items.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 rounded-lg border border-border/60 bg-background p-3 ${!p.disponivel ? "opacity-60" : ""}`}
                    >
                      {/* Imagem */}
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                        {p.imagemUrl ? (
                          <Image
                            src={p.imagemUrl}
                            alt={p.nome}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-primary/5">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.nome}</p>
                        {p.descricao && (
                          <p className="truncate text-xs text-muted-foreground">
                            {p.descricao}
                          </p>
                        )}
                        <div className="mt-0.5 flex items-center gap-3">
                          <span className="font-serif text-sm font-bold text-primary">
                            {formatCurrency(p.preco)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {p.tempoPreparo} min
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleToggleDisponivel(p)}
                          title={p.disponivel ? "Ocultar" : "Mostrar"}
                        >
                          {p.disponivel ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingId(p.id);
                            setDialogOpen(true);
                          }}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(p.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Form de produto (criar/editar) ──────────────────────────────────────

function ProdutoForm({
  restauranteId,
  produtoId,
  onSaved,
}: {
  restauranteId: string;
  produtoId: string | null;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    preco: "",
    categoria: "Hambúrgueres",
    tempoPreparo: "15",
    imagemUrl: "",
    disponivel: true,
  });

  // Se estiver editando, carrega dados
  useEffect(() => {
    if (produtoId) {
      fetch(`/api/produtos?restauranteId=${restauranteId}`)
        .then((r) => r.json())
        .then((data) => {
          const p = data.produtos?.find((x: Produto) => x.id === produtoId);
          if (p) {
            setForm({
              nome: p.nome,
              descricao: p.descricao || "",
              preco: String(p.preco),
              categoria: p.categoria,
              tempoPreparo: String(p.tempoPreparo),
              imagemUrl: p.imagemUrl || "",
              disponivel: p.disponivel,
            });
          }
        });
    }
  }, [produtoId, restauranteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = produtoId ? `/api/produtos/${produtoId}` : "/api/produtos";
      const method = produtoId ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        nome: form.nome,
        descricao: form.descricao || null,
        preco: parseFloat(form.preco),
        categoria: form.categoria,
        tempoPreparo: parseInt(form.tempoPreparo),
        imagemUrl: form.imagemUrl || null,
      };
      if (!produtoId) body.disponivel = form.disponivel;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao salvar");
        return;
      }

      toast.success(produtoId ? "Produto atualizado!" : "Produto criado!");
      onSaved();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome do produto *</Label>
        <Input
          id="nome"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          placeholder="X-Burger Especial"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          placeholder="Pão brioche, blend 180g, cheddar, bacon..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="preco">Preço (R$) *</Label>
          <Input
            id="preco"
            type="number"
            step="0.01"
            min="0"
            value={form.preco}
            onChange={(e) => setForm({ ...form, preco: e.target.value })}
            placeholder="25.90"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tempo">Tempo preparo (min)</Label>
          <Input
            id="tempo"
            type="number"
            min="1"
            value={form.tempoPreparo}
            onChange={(e) => setForm({ ...form, tempoPreparo: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="categoria">Categoria *</Label>
        <Input
          id="categoria"
          list="categorias-list"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          placeholder="Hambúrgueres"
          required
        />
        <datalist id="categorias-list">
          {CATEGORIAS_SUGERIDAS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="space-y-1.5">
        <Label>Imagem do produto</Label>
        <ImageUpload
          endpoint={produtoId ? `/api/produtos/${produtoId}/imagem` : "/api/upload"}
          folder={`produtos/${restauranteId}`}
          value={form.imagemUrl}
          onChange={(url) => setForm({ ...form, imagemUrl: url })}
          size="md"
          label="JPG, PNG ou WebP · máx 5MB"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : produtoId ? (
            "Salvar alterações"
          ) : (
            "Criar produto"
          )}
        </Button>
      </div>
    </form>
  );
}
