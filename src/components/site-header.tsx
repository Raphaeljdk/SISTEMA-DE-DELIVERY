"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, ShoppingCart, ChefHat, LayoutDashboard, Home, Utensils, LogIn, LogOut, User, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCarrinho } from "@/lib/carrinho-store";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const totalItens = useCarrinho((s) => s.totalItens());
  const { usuario, isAuthenticated, isRestaurante, logout, loading } = useAuth();

  const navItems = [
    { href: "/", label: "Início", icon: Home },
    { href: "/restaurantes", label: "Restaurantes", icon: Utensils },
    { href: "/admin", label: "Painel Admin", icon: LayoutDashboard },
  ];

  // Se for restaurante logado, mostra painel do restaurante
  if (isRestaurante && usuario?.restauranteId) {
    navItems.push({
      href: `/restaurante-painel?id=${usuario.restauranteId}`,
      label: "Meu Restaurante",
      icon: ChefHat,
    });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Utensils className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-serif text-lg font-bold tracking-tight">
              Food Delivery
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              System
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href.split("?")[0]);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Carrinho (apenas para clientes/não logados) */}
          {!isRestaurante && (
            <Link href="/carrinho" className="relative">
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="h-4 w-4" />
                {totalItens > 0 && (
                  <Badge
                    className="absolute -right-2 -top-2 h-5 min-w-[20px] px-1 text-[10px]"
                    variant="default"
                  >
                    {totalItens}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {/* User menu */}
          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={usuario.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {usuario.nome.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{usuario.nome}</span>
                    <span className="text-xs text-muted-foreground">{usuario.email}</span>
                    <Badge variant="outline" className="mt-1 w-fit text-[10px]">
                      {usuario.tipoUsuario}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isRestaurante && usuario.restauranteId && (
                  <DropdownMenuItem onClick={() => router.push(`/restaurante-painel?id=${usuario.restauranteId}`)}>
                    <ChefHat className="mr-2 h-4 w-4" />
                    Meu Restaurante
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => router.push("/")}>
                  <Home className="mr-2 h-4 w-4" />
                  Início
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">
                <LogIn className="mr-1 h-4 w-4" />
                Entrar
              </Link>
            </Button>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-border/60 bg-background md:hidden">
          <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href.split("?")[0]);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {!isAuthenticated && (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  <LogIn className="h-4 w-4" />
                  Entrar
                </Link>
                <Link
                  href="/cadastro/restaurante"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/5"
                >
                  <Store className="h-4 w-4" />
                  Seja um restaurante parceiro
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
