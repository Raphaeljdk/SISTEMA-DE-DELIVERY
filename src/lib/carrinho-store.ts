/**
 * Carrinho de compras - estado global com Zustand.
 * Persiste em localStorage para manter estado entre navegações.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CarrinhoItem {
  produtoId: string;
  restauranteId: string;
  restauranteNome: string;
  nome: string;
  preco: number;
  quantidade: number;
  observacoes?: string;
  imagemUrl?: string | null;
}

interface CarrinhoState {
  itens: CarrinhoItem[];
  restauranteIdAtual: string | null;
  cupomCodigo: string | null;
  cupomDesconto: number;
  cupomTipo: "PERCENTUAL" | "FIXO" | "FRETE_GRATIS" | null;
  enderecoEntrega: string | null;
  formaPagamento: "PIX" | "CARTAO" | "CARTEIRA";

  addItem: (item: Omit<CarrinhoItem, "quantidade">, quantidade?: number) => void;
  removeItem: (produtoId: string) => void;
  updateQuantidade: (produtoId: string, quantidade: number) => void;
  updateObservacoes: (produtoId: string, obs: string) => void;
  clear: () => void;
  setCupom: (codigo: string | null, desconto: number, tipo: "PERCENTUAL" | "FIXO" | "FRETE_GRATIS" | null) => void;
  setEndereco: (endereco: string | null) => void;
  setFormaPagamento: (forma: "PIX" | "CARTAO" | "CARTEIRA") => void;
  calcularSubtotal: () => number;
  calcularDesconto: (subtotal: number, frete: number) => number;
  calcularTotal: (frete: number) => number;
  totalItens: () => number;
}

export const useCarrinho = create<CarrinhoState>()(
  persist(
    (set, get) => ({
      itens: [],
      restauranteIdAtual: null,
      cupomCodigo: null,
      cupomDesconto: 0,
      cupomTipo: null,
      enderecoEntrega: null,
      formaPagamento: "PIX",

      addItem: (item, quantidade = 1) => {
        const state = get();
        // Se restaurante diferente, limpa carrinho
        if (state.restauranteIdAtual && state.restauranteIdAtual !== item.restauranteId) {
          set({
            itens: [{ ...item, quantidade }],
            restauranteIdAtual: item.restauranteId,
            cupomCodigo: null,
            cupomDesconto: 0,
            cupomTipo: null,
          });
          return;
        }
        const existing = state.itens.find((i) => i.produtoId === item.produtoId);
        if (existing) {
          set({
            itens: state.itens.map((i) =>
              i.produtoId === item.produtoId
                ? { ...i, quantidade: i.quantidade + quantidade }
                : i
            ),
            restauranteIdAtual: item.restauranteId,
          });
        } else {
          set({
            itens: [...state.itens, { ...item, quantidade }],
            restauranteIdAtual: item.restauranteId,
          });
        }
      },

      removeItem: (produtoId) => {
        const state = get();
        const novos = state.itens.filter((i) => i.produtoId !== produtoId);
        set({
          itens: novos,
          restauranteIdAtual: novos.length === 0 ? null : state.restauranteIdAtual,
          cupomCodigo: novos.length === 0 ? null : state.cupomCodigo,
          cupomDesconto: novos.length === 0 ? 0 : state.cupomDesconto,
          cupomTipo: novos.length === 0 ? null : state.cupomTipo,
        });
      },

      updateQuantidade: (produtoId, quantidade) => {
        if (quantidade <= 0) {
          get().removeItem(produtoId);
          return;
        }
        set((state) => ({
          itens: state.itens.map((i) =>
            i.produtoId === produtoId ? { ...i, quantidade } : i
          ),
        }));
      },

      updateObservacoes: (produtoId, obs) => {
        set((state) => ({
          itens: state.itens.map((i) =>
            i.produtoId === produtoId ? { ...i, observacoes: obs } : i
          ),
        }));
      },

      clear: () => set({
        itens: [],
        restauranteIdAtual: null,
        cupomCodigo: null,
        cupomDesconto: 0,
        cupomTipo: null,
        enderecoEntrega: null,
        formaPagamento: "PIX",
      }),

      setCupom: (codigo, desconto, tipo) => set({
        cupomCodigo: codigo,
        cupomDesconto: desconto,
        cupomTipo: tipo,
      }),

      setEndereco: (endereco) => set({ enderecoEntrega: endereco }),
      setFormaPagamento: (forma) => set({ formaPagamento: forma }),

      calcularSubtotal: () => {
        return get().itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
      },

      calcularDesconto: (subtotal, frete) => {
        const { cupomTipo, cupomDesconto } = get();
        if (!cupomTipo) return 0;
        if (cupomTipo === "PERCENTUAL") return (subtotal * cupomDesconto) / 100;
        if (cupomTipo === "FIXO") return Math.min(cupomDesconto, subtotal);
        if (cupomTipo === "FRETE_GRATIS") return frete;
        return 0;
      },

      calcularTotal: (frete) => {
        const subtotal = get().calcularSubtotal();
        const desconto = get().calcularDesconto(subtotal, frete);
        return Math.max(0, subtotal + frete - desconto);
      },

      totalItens: () => get().itens.reduce((acc, i) => acc + i.quantidade, 0),
    }),
    {
      name: "food-delivery-carrinho",
      version: 1,
    }
  )
);
