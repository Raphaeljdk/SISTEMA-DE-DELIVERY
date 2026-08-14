# 🍔 Food Delivery System

Sistema completo de delivery de comida construído com **Next.js 16**, **TypeScript**, **Prisma ORM**, **Tailwind CSS 4** e **shadcn/ui**.

Modelagem UML aplicada a um sistema real, com autenticação, pagamentos (Stripe + Mercado Pago), rastreamento em tempo real via WebSocket, upload de imagens (Cloudinary) e dashboard administrativo.

---

## 📋 Índice

- [Stack Tecnológica](#-stack-tecnológica)
- [Funcionalidades](#-funcionalidades)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação Local](#-instalação-local)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Banco de Dados](#-banco-de-dados)
- [WebSocket — Rastreamento em Tempo Real](#-websocket--rastreamento-em-tempo-real)
- [Upload de Imagens (Cloudinary)](#-upload-de-imagens-cloudinary)
- [Pagamentos (Stripe + Mercado Pago)](#-pagamentos-stripe--mercado-pago)
- [Deploy na Vercel + Neon PostgreSQL](#-deploy-na-vercel--neon-postgresql)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [API Reference](#-api-reference)

---

## 🚀 Stack Tecnológica

| Categoria | Tecnologia |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript 5 |
| Estilização | Tailwind CSS 4 + shadcn/ui |
| Banco de Dados | Prisma ORM (SQLite dev / PostgreSQL prod) |
| Estado Global | Zustand |
| Data Fetching | TanStack Query |
| WebSocket | Socket.IO (mini-service separado) |
| Pagamentos | Stripe + Mercado Pago SDK |
| Imagens | Cloudinary |
| Fontes | Playfair Display + Inter (Google Fonts) |

---

## ✨ Funcionalidades

### 👤 Cliente
- Busca e filtro de restaurantes (categoria, localização, avaliação)
- Carrinho de compras persistente (Zustand + localStorage)
- Checkout com cupom de desconto, endereço e forma de pagamento
- Rastreamento de pedido em tempo real (WebSocket)
- Avaliação de restaurantes e entregadores
- Histórico de pedidos

### 🏪 Restaurante
- Painel com pedidos em tempo real (tabs: Pendentes, Em Entrega, Histórico)
- Gestão de cardápio (ativar/desativar produtos, atualizar preços)
- Upload de imagens para produtos
- Toggle aberto/fechado
- Métricas de vendas e ticket médio

### 🛵 Entregador
- Recebimento de pedidos para entrega
- Atualização de localização em tempo real (broadcast via WebSocket)
- Atualização de status do pedido

### 👑 Administrador
- Dashboard com KPIs (GMV, ticket médio, restaurantes ativos)
- Gráfico de faturamento dos últimos 7 dias
- Top restaurantes por número de pedidos
- Distribuição de pedidos por status
- Últimos pedidos processados

---

## 📁 Estrutura do Projeto

```
food-delivery/
├── prisma/
│   ├── schema.prisma              # Schema SQLite (desenvolvimento)
│   ├── schema.prod.prisma         # Schema PostgreSQL (produção)
│   └── seed.ts                    # Seed com 6 restaurantes + 32 produtos
├── src/
│   ├── app/
│   │   ├── api/                   # API Routes (Next.js Route Handlers)
│   │   │   ├── restaurantes/
│   │   │   ├── pedidos/[id]/
│   │   │   │   ├── broadcast-status/    # WebSocket broadcast
│   │   │   │   └── localizacao/         # Update entregador
│   │   │   ├── pagamentos/processar/    # Stripe + MP
│   │   │   ├── webhooks/
│   │   │   │   ├── stripe/
│   │   │   │   └── mercadopago/
│   │   │   ├── upload/                  # Cloudinary
│   │   │   ├── cupons/validar/
│   │   │   ├── avaliacoes/
│   │   │   ├── dashboard/
│   │   │   └── sessao/
│   │   ├── restaurantes/[id]/
│   │   ├── carrinho/
│   │   ├── pedidos/[id]/
│   │   ├── admin/
│   │   ├── restaurante-painel/
│   │   ├── rastreamento/
│   │   └── ...
│   ├── components/                # Componentes React + shadcn/ui
│   ├── hooks/
│   │   └── use-rastreamento.ts    # Hook WebSocket
│   └── lib/
│       ├── db.ts                  # Prisma client singleton
│       ├── cloudinary.ts          # Upload de imagens
│       ├── stripe.ts              # Stripe client
│       ├── mercadopago.ts         # Mercado Pago client
│       ├── pagamentos.ts          # Orquestrador de pagamento
│       ├── carrinho-store.ts      # Zustand store
│       └── format.ts              # Helpers de formatação
├── mini-services/
│   └── rastreamento-service/      # WebSocket (porta 3003)
│       ├── index.ts
│       └── package.json
├── public/
│   └── uploads/                   # Fallback local de imagens
├── .env.example                   # Template de variáveis
├── vercel.json                    # Config de deploy
└── package.json
```

---

## 🛠 Instalação Local

### Pré-requisitos
- **Node.js 20+** ou **Bun 1.3+**
- **Git**

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/Raphaeljdk/SISTEMA-DE-DELIVERY.git
cd SISTEMA-DE-DELIVERY

# 2. Instale as dependências
bun install
# ou: npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais (ou use os valores padrão para modo demo)

# 4. Crie o banco de dados e aplique o schema
bun run db:push

# 5. Popule o banco com dados de exemplo (seed)
bun run db:seed

# 6. Inicie o servidor de desenvolvimento
bun run dev
```

Acesse: **http://localhost:3000**

### Credenciais de demo (após seed)
- **Cliente**: maria@gmail.com / cliente123
- **Entregador**: joao@entregador.com / entregador123
- **Admin**: admin@fooddelivery.com / admin123

---

## 🔐 Variáveis de Ambiente

Veja o arquivo [`.env.example`](./.env.example) para a lista completa.

### Obrigatórias (mínimo para rodar)
```env
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="gerar-com-openssl-rand-base64-32"
```

### Opcionais (habilitam features avançadas)
- `STRIPE_*` → Pagamentos via cartão
- `MERCADOPAGO_*` → Pagamentos via PIX e carteira
- `CLOUDINARY_*` → Upload de imagens
- `GOOGLE_CLIENT_*` / `FACEBOOK_CLIENT_*` → Login social

> 💡 **Sem as variáveis opcionais configuradas, o sistema funciona em modo demo** (pagamentos simulados, imagens salvas localmente em `/public/uploads`).

---

## 🗄 Banco de Dados

### Desenvolvimento (SQLite)
```bash
bun run db:push        # Aplica schema ao SQLite
bun run db:seed        # Popula com dados de exemplo
```

### Produção (PostgreSQL — Neon/Supabase)
```bash
# Configure DATABASE_URL no .env com a connection string do Neon/Supabase
bun run db:push:prod   # Aplica schema.prod.prisma ao PostgreSQL
bun run db:seed        # Popula banco de produção (use com cuidado!)
```

---

## 🔌 WebSocket — Rastreamento em Tempo Real

O sistema usa um **mini-service separado** (porta 3003) para WebSocket, seguindo a arquitetura de microservices.

### Iniciar o serviço
```bash
# Em outro terminal:
bun run ws:start
```

### Como funciona
- **Rooms por entidade**: `pedido:<id>`, `restaurante:<id>`, `cliente:<id>`, `entregador:<id>`
- **Eventos**:
  - `entrar-pedido`, `entrar-restaurante`, `entrar-cliente`, `entrar-entregador`
  - `atualizar-localizacao` (entregador → server)
  - `localizacao-entregador` (server → room do pedido)
  - `status-pedido` (server → rooms relacionados)

### Endpoints HTTP internos
- `GET /health` — Health check
- `POST /broadcast-status` — Chamado pelo Next.js quando status do pedido muda

### Frontend (Hook)
```typescript
import { useRastreamento } from "@/hooks/use-rastreamento";

const { connected, localizacao, ultimoStatus } = useRastreamento({
  pedidoId: "abc123",
});
```

---

## 🖼 Upload de Imagens (Cloudinary)

### Configuração
1. Crie conta em [cloudinary.com](https://cloudinary.com)
2. Copie `Cloud Name`, `API Key` e `API Secret` do dashboard
3. Configure no `.env`:
```env
CLOUDINARY_CLOUD_NAME="xxx"
CLOUDINARY_API_KEY="xxx"
CLOUDINARY_API_SECRET="xxx"
```

### Sem Cloudinary configurado?
O sistema usa **fallback local**: imagens são salvas em `/public/uploads/`. Útil para desenvolvimento.

### API
- `POST /api/upload` — Upload genérico (multipart/form-data)
- `PATCH /api/produtos/[id]/imagem` — Atualiza imagem de produto
- `PATCH /api/restaurantes/[id]/imagem` — Atualiza imagem de restaurante

### Componente
```tsx
import { ImageUpload } from "@/components/image-upload";

<ImageUpload
  endpoint={`/api/produtos/${produto.id}/imagem`}
  folder="produtos"
  value={produto.imagemUrl}
  onChange={(url) => console.log("nova URL:", url)}
  size="md"
/>
```

---

## 💳 Pagamentos (Stripe + Mercado Pago)

### Estratégia de Gateway
| Método | Gateway | Razão |
|--------|---------|-------|
| PIX | Mercado Pago | Suporte nativo a QR Code |
| Cartão | Stripe | 3DS e Payment Intent |
| Carteira | Mercado Pago | Mercado Pago Wallet |

### Configuração Stripe
1. Crie conta em [stripe.com](https://stripe.com)
2. Pegue as chaves em [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
3. Configure o webhook em [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks):
   - URL: `https://seu-app.vercel.app/api/webhooks/stripe`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. Copie o `Webhook signing secret` (whsec_...)
5. Configure no `.env`:
```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Configuração Mercado Pago
1. Crie conta em [mercadopago.com.br](https://mercadopago.com.br)
2. Acesse [developers.mercadopago.com.br/panel/app](https://www.mercadopago.com.br/developers/panel/app)
3. Crie uma aplicação e pegue `Access Token` e `Public Key`
4. Configure o webhook:
   - URL: `https://seu-app.vercel.app/api/webhooks/mercadopago`
   - Eventos: `payment`
5. Configure no `.env`:
```env
MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."
MERCADOPAGO_PUBLIC_KEY="APP_USR-..."
MP_SANDBOX="true"  # false para produção
```

### Fluxo de Pagamento
1. Cliente cria pedido → status `AGUARDANDO_PAGAMENTO`
2. `processarPagamento()` cria intent/preferência no gateway
3. Gateway retorna `clientSecret` (Stripe) ou `qrCode` (MP PIX) ou `checkoutUrl`
4. Cliente paga no app/checkout
5. Webhook recebe confirmação
6. Pedido atualizado para `PAGO` automaticamente

### Modo Demo (sem credenciais)
Se nenhum gateway estiver configurado, o sistema simula aprovação automática para desenvolvimento.

---

## ☁ Deploy na Vercel + Neon PostgreSQL

### Passo 1: Banco de Dados (Neon)

1. Acesse [neon.tech](https://neon.tech) e crie uma conta
2. Crie um novo projeto:
   - Name: `food-delivery`
   - Region: `us-east-2` (ou mais próxima)
   - Postgres version: 16
3. Copie a connection string (formato: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)

**Alternativa: Supabase**
1. Acesse [supabase.com](https://supabase.com)
2. New Project → copie a connection string do pooler (porta 6543)

### Passo 2: Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. **Add New Project** → importe o repositório `Raphaeljdk/SISTEMA-DE-DELIVERY`
3. Configurações de build (auto-detectadas pelo `vercel.json`):
   - Framework Preset: Next.js
   - Build Command: `prisma generate && next build`
   - Install Command: `bun install`
4. **Environment Variables** (configure TODAS):
   ```
   DATABASE_URL=postgresql://...neon.tech/...
   NEXTAUTH_URL=https://seu-app.vercel.app
   NEXTAUTH_SECRET=<gerar com openssl rand -base64 32>
   
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
   MERCADOPAGO_PUBLIC_KEY=APP_USR-...
   MP_SANDBOX=false
   
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
5. **Deploy!**

### Passo 3: Configure Webhooks de Produção

Após o primeiro deploy, atualize os webhooks nos dashboards:

- **Stripe**: URL → `https://seu-app.vercel.app/api/webhooks/stripe`
- **Mercado Pago**: URL → `https://seu-app.vercel.app/api/webhooks/mercadopago`

### Passo 4: Popule o banco de produção

```bash
# Clone local e configure .env com DATABASE_URL de produção
DATABASE_URL="postgresql://...neon.tech/..." bun run db:push:prod
DATABASE_URL="postgresql://...neon.tech/..." bun run db:seed
```

### Passo 5: Deploy do WebSocket Service

O WebSocket não roda na Vercel (serverless). Opções:

#### Opção A: Render (recomendado, plano gratuito disponível)
1. Acesse [render.com](https://render.com) e faça login com GitHub
2. **New** → **Blueprint** → selecione o repositório
3. O Render detecta o `render.yaml` e cria o serviço `rastreamento-ws` automaticamente
4. Configure `CORS_ORIGIN` = URL da sua Vercel
5. Após deploy, copie a URL pública (`https://rastreamento-ws.onrender.com`)
6. No app Next.js (Vercel), configure:
   - `WS_SERVICE_URL=https://rastreamento-ws.onrender.com`
   - `NEXT_PUBLIC_WS_URL=https://rastreamento-ws.onrender.com`

#### Opção B: Render (deploy manual, sem Blueprint)
1. Acesse [render.com](https://render.com)
2. **New** → **Web Service** → conecte GitHub
3. Root Directory: `mini-services/rastreamento-service`
4. Build Command: `bun install --production`
5. Start Command: `bun index.ts`
6. Env vars: `PORT=3003`, `CORS_ORIGIN=https://sua-app.vercel.app`

#### Opção C: Fly.io
```bash
cd mini-services/rastreamento-service
fly launch
fly deploy
```

---

## 📜 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `bun run dev` | Inicia servidor Next.js em dev (porta 3000) |
| `bun run build` | Build de produção |
| `bun run start` | Inicia servidor de produção |
| `bun run lint` | Verifica código com ESLint |
| `bun run db:push` | Aplica schema Prisma ao SQLite (dev) |
| `bun run db:push:prod` | Aplica schema Prisma ao PostgreSQL (prod) |
| `bun run db:seed` | Popula banco com dados de exemplo |
| `bun run db:reset` | Reseta banco (CUIDADO: apaga tudo) |
| `bun run ws:start` | Inicia mini-service WebSocket (porta 3003) |
| `bun run vercel:build` | Build otimizado para Vercel |

---

## 📡 API Reference

### Restaurantes
- `GET /api/restaurantes?categoria=&busca=&aberto=` — Lista restaurantes
- `GET /api/restaurantes/[id]` — Detalhes + cardápio + avaliações
- `PATCH /api/restaurantes/[id]` — Atualiza dados (aberto, taxa, etc)
- `PATCH /api/restaurantes/[id]/imagem` — Upload de imagem

### Produtos
- `PATCH /api/produtos/[id]/imagem` — Upload de imagem do produto

### Pedidos
- `GET /api/pedidos?clienteId=&restauranteId=&status=` — Lista pedidos
- `POST /api/pedidos` — Cria pedido (com pagamento automático)
- `GET /api/pedidos/[id]` — Detalhes do pedido
- `PATCH /api/pedidos/[id]` — Atualiza status (state machine)
- `POST /api/pedidos/[id]/broadcast-status` — Notifica WebSocket service
- `POST /api/pedidos/[id]/localizacao` — Atualiza localização do entregador

### Pagamentos
- `POST /api/pagamentos/processar` — Processa pagamento via Stripe ou MP
- `POST /api/webhooks/stripe` — Webhook Stripe
- `POST /api/webhooks/mercadopago` — Webhook Mercado Pago

### Cupons
- `POST /api/cupons/validar` — Valida cupom (Extend: Aplicar Cupom)

### Avaliações
- `POST /api/avaliacoes` — Cria avaliação (apenas pedidos entregues)

### Upload
- `POST /api/upload` — Upload genérico (multipart/form-data)

### Dashboard
- `GET /api/dashboard/admin` — KPIs globais
- `GET /api/dashboard/restaurante/[id]` — KPIs do restaurante

### Sessão
- `GET /api/sessao` — Cliente demo (substituir por NextAuth em produção)

---

## 📄 Licença

MIT — sinta-se livre para usar este projeto como base para sua própria aplicação.

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit: `git commit -m 'feat: adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

---

## 📞 Suporte

- 📧 Email: raphaeljdk@users.noreply.github.com
- 🐛 Issues: [github.com/Raphaeljdk/SISTEMA-DE-DELIVERY/issues](https://github.com/Raphaeljdk/SISTEMA-DE-DELIVERY/issues)

---

**Feito com 💛 usando Next.js, TypeScript, Prisma e shadcn/ui**
