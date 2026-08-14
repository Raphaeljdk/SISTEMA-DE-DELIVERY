import type { Metadata } from "next";
import { Inter, Playfair_Display, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";

const interSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfairSerif = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Food Delivery System — Plataforma de Delivery",
  description: "Sistema completo de delivery de comida com 500+ restaurantes parceiros. Modelagem UML aplicada a Next.js, TypeScript e Prisma.",
  keywords: ["food delivery", "delivery", "Next.js", "UML", "Engenharia de Software", "TypeScript", "Prisma"],
  authors: [{ name: "Z.ai Engineering" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Food Delivery System",
    description: "Plataforma completa de delivery com modelagem UML aplicada",
    siteName: "Food Delivery",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${interSans.variable} ${playfairSerif.variable} ${geistMono.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
          <SonnerToaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
