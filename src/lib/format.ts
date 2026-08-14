/**
 * Helpers de formatação e tipos compartilhados.
 */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "agora mesmo";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days} dia(s) atrás`;
}

export const STATUS_PEDIDO_LABELS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando Pagamento",
  PAGO: "Pago",
  EM_PREPARACAO: "Em Preparação",
  SAIU_ENTREGA: "Saiu para Entrega",
  ENTREGUE: "Entregue",
  CANCELADO: "Cancelado",
};

export const STATUS_PEDIDO_COLORS: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "bg-amber-100 text-amber-800 border-amber-200",
  PAGO: "bg-blue-100 text-blue-800 border-blue-200",
  EM_PREPARACAO: "bg-purple-100 text-purple-800 border-purple-200",
  SAIU_ENTREGA: "bg-orange-100 text-orange-800 border-orange-200",
  ENTREGUE: "bg-green-100 text-green-800 border-green-200",
  CANCELADO: "bg-red-100 text-red-800 border-red-200",
};
