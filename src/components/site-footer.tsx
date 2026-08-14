import Link from "next/link";
import { Utensils, Github, Mail } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-secondary/5">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Utensils className="h-4 w-4" />
              </div>
              <span className="font-serif text-base font-bold">
                Food Delivery
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Plataforma completa de delivery com 500+ restaurantes parceiros.
              Modelagem UML aplicada a Next.js, TypeScript e Prisma.
            </p>
          </div>

          {/* Links: Sistema */}
          <div>
            <h4 className="mb-3 font-serif text-sm font-semibold text-foreground">
              Sistema
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/restaurantes" className="hover:text-primary">
                  Restaurantes
                </Link>
              </li>
              <li>
                <Link href="/carrinho" className="hover:text-primary">
                  Carrinho
                </Link>
              </li>
              <li>
                <Link href="/pedidos" className="hover:text-primary">
                  Meus Pedidos
                </Link>
              </li>
            </ul>
          </div>

          {/* Links: Painéis */}
          <div>
            <h4 className="mb-3 font-serif text-sm font-semibold text-foreground">
              Painéis
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/admin" className="hover:text-primary">
                  Painel Administrativo
                </Link>
              </li>
              <li>
                <Link href="/restaurante-painel" className="hover:text-primary">
                  Painel do Restaurante
                </Link>
              </li>
              <li>
                <Link href="/rastreamento" className="hover:text-primary">
                  Rastreamento
                </Link>
              </li>
            </ul>
          </div>

          {/* Tech */}
          <div>
            <h4 className="mb-3 font-serif text-sm font-semibold text-foreground">
              Stack
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>Next.js 16 + App Router</li>
              <li>TypeScript + Prisma ORM</li>
              <li>Tailwind + shadcn/ui</li>
              <li>SQLite (dev) / PostgreSQL (prod)</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Food Delivery System. Documentação
            UML 2.5 (ISO/IEC 19505).
          </p>
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-muted-foreground transition-colors hover:text-primary"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="text-muted-foreground transition-colors hover:text-primary"
              aria-label="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
