# 🚀 Guia de Deploy — Food Delivery System

Guia passo-a-passo para colocar o sistema em produção na Vercel + Neon PostgreSQL + Railway (WebSocket).

---

## 📋 Pré-requisitos

- Conta no [GitHub](https://github.com) (já configurada: `Raphaeljdk/SISTEMA-DE-DELIVERY`)
- Conta no [Vercel](https://vercel.com) (login com GitHub)
- Conta no [Neon](https://neon.tech) (banco PostgreSQL gratuito)
- Conta no [Railway](https://railway.app) (para WebSocket service)
- Conta no [Stripe](https://stripe.com) (pagamentos)
- Conta no [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
- Conta no [Cloudinary](https://cloudinary.com) (upload de imagens)

---

## 🗄 Passo 1: Criar Banco PostgreSQL no Neon

1. Acesse [neon.tech](https://neon.tech) e clique em **Sign Up**
2. Crie um novo projeto:
   - **Name**: `food-delivery`
   - **Postgres version**: 16
   - **Region**: `AWS US East 2` (ou mais próxima dos usuários)
3. Aguarde o provisionamento (~30 segundos)
4. Na aba **Connection Details**, copie a connection string:
   ```
   postgresql://neondb_owner:npg_xxx@ep-xxx-xxx.us-east-2.aws.neon.tech/food_delivery?sslmode=require
   ```
5. **Guarde essa string** — ela será usada como `DATABASE_URL`

> 💡 **Plano gratuito Neon**: 0.5 GB storage, suficiente para desenvolvimento inicial.

### Alternativa: Supabase
Se preferir Supabase:
1. Acesse [supabase.com](https://supabase.com) → New Project
2. Settings → Database → Connection string → URI
3. Use a connection do pooler (porta 6543) para Vercel serverless

---

## 💳 Passo 2: Configurar Stripe

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com) e crie conta
2. **API Keys** ([dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)):
   - Copie **Publishable key**: `pk_test_...` (depois `pk_live_...` em produção)
   - Copie **Secret key**: `sk_test_...` (depois `sk_live_...`)
3. **Webhooks** ([dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)):
   - Clique **Add endpoint**
   - URL: `https://SEU_DOMINIO_VERCEL.app/api/webhooks/stripe`
   - Eventos:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
   - Após criar, clique em **Click to reveal** → copie o **Signing secret**: `whsec_...`

> ⚠️ **Importante**: o webhook só funciona depois do primeiro deploy na Vercel. Configure primeiro com a URL placeholder e atualize após o deploy.

---

## 💰 Passo 3: Configurar Mercado Pago

1. Acesse [mercadopago.com.br](https://mercadopago.com.br) e crie conta vendedor
2. Acesse [developers.mercadopago.com.br/panel/app](https://www.mercadopago.com.br/developers/panel/app)
3. Crie uma aplicação:
   - **Nome**: Food Delivery System
   - **Caso de uso**: Pagamentos online
4. Na aba **Credenciais**:
   - Copie **Access Token**: `APP_USR-...` (ou `TEST-...` para sandbox)
   - Copie **Public Key**: `APP_USR-...` (ou `TEST-...`)
5. **Webhooks** (aba Notificações):
   - URL: `https://SEU_DOMINIO_VERCEL.app/api/webhooks/mercadopago`
   - Evento: `payment`
6. Configure `MP_SANDBOX=true` para testes, `false` para produção

---

## 🖼 Passo 4: Configurar Cloudinary

1. Acesse [cloudinary.com](https://cloudinary.com) → Sign Up (plano gratuito: 25 créditos/mês)
2. No **Dashboard**, copie:
   - **Cloud Name**: `dxXXXXXXX`
   - **API Key**: `123456789012345`
   - **API Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 🔌 Passo 5: Deploy na Vercel

### 5.1 Importar repositório

1. Acesse [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Importe o repositório `Raphaeljdk/SISTEMA-DE-DELIVERY`
3. A Vercel detecta automaticamente Next.js (config do `vercel.json`)

### 5.2 Configurar variáveis de ambiente

Na seção **Environment Variables**, adicione TODAS:

| Key | Value | Obs |
|-----|-------|-----|
| `DATABASE_URL` | `postgresql://...neon.tech/...` | Do Passo 1 |
| `NEXTAUTH_URL` | `https://SEU_PROJETO.vercel.app` | URL final da Vercel |
| `NEXTAUTH_SECRET` | `<gerar com openssl>` | Veja abaixo |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Do Passo 2 |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Do Passo 2 |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Do Passo 2 |
| `MERCADOPAGO_ACCESS_TOKEN` | `APP_USR-...` | Do Passo 3 |
| `MERCADOPAGO_PUBLIC_KEY` | `APP_USR-...` | Do Passo 3 |
| `MP_SANDBOX` | `false` | Produção |
| `CLOUDINARY_CLOUD_NAME` | `dxXXXXXXX` | Do Passo 4 |
| `CLOUDINARY_API_KEY` | `123456789012345` | Do Passo 4 |
| `CLOUDINARY_API_SECRET` | `xxxxxxxxxxxxxxxxxx` | Do Passo 4 |
| `DEMO_MODE` | `false` | Desativa modo demo |

**Gerar NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
# Cole o resultado no valor da variável
```

### 5.3 Deploy

Clique em **Deploy** e aguarde (~2-3 minutos).

Acesse a URL gerada: `https://SEU_PROJETO.vercel.app`

### 5.4 Atualizar Webhooks com URL final

Após o deploy, volte aos painéis do Stripe e Mercado Pago e atualize as URLs de webhook com a URL final da Vercel.

---

## 🛵 Passo 6: Deploy do WebSocket Service (Railway)

O WebSocket não roda na Vercel (serverless). Use o Railway:

### 6.1 Deploy no Railway

1. Acesse [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → selecione `Raphaeljdk/SISTEMA-DE-DELIVERY`
3. **Settings**:
   - **Root Directory**: `mini-services/rastreamento-service`
   - **Build Command**: `bun install`
   - **Start Command**: `bun index.ts`
4. **Variables**:
   - `PORT` = `3003`
5. **Deploy** e aguarde

### 6.2 Configurar domínio público

1. Na aba **Settings** → **Networking**
2. **Generate Domain** → copie a URL: `https://xxx.up.railway.app`
3. No projeto Next.js na Vercel, adicione variável:
   ```
   WS_PUBLIC_URL=wss://xxx.up.railway.app
   ```

### 6.3 Atualizar hook no frontend

Edite `src/hooks/use-rastreamento.ts` para usar a URL pública em produção:

```typescript
const wsUrl = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_WS_URL || '/'
  : '/?XTransformPort=3003';

const socket = io(wsUrl, {
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
});
```

---

## 📊 Passo 7: Popular Banco de Produção

Após o primeiro deploy, popule o banco PostgreSQL com dados iniciais:

```bash
# Clone local (ou use o mesmo)
git clone https://github.com/Raphaeljdk/SISTEMA-DE-DELIVERY.git
cd SISTEMA-DE-DELIVERY
bun install

# Configure .env com DATABASE_URL do Neon (produção)
echo 'DATABASE_URL="postgresql://...neon.tech/..."' > .env

# Aplique schema PostgreSQL
bun run db:push:prod

# Popule com dados de exemplo
bun run db:seed
```

> ⚠️ **Atenção**: o seed apaga dados existentes. Use apenas no primeiro deploy ou em ambiente de staging.

---

## ✅ Passo 8: Checklist de Verificação

Após completar todos os passos, verifique:

- [ ] App Next.js acessível em `https://SEU_PROJETO.vercel.app`
- [ ] Homepage carrega com restaurantes do seed
- [ ] Login funciona (se NextAuth configurado)
- [ ] Cliente consegue adicionar itens ao carrinho
- [ ] Checkout cria pedido no banco
- [ ] Webhook do Stripe recebe eventos (testar com `stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
- [ ] Webhook do Mercado Pago recebe eventos
- [ ] Upload de imagem funciona (produto/restaurante)
- [ ] WebSocket conecta (badge "Ao vivo" no rastreamento)
- [ ] Dashboard admin mostra métricas
- [ ] Painel do restaurante mostra pedidos

---

## 🆘 Troubleshooting

### Erro: "Prisma cannot find database"
- Verifique se `DATABASE_URL` está configurada na Vercel
- Para Neon/Supabase, a URL deve incluir `?sslmode=require`

### Erro: "Stripe webhook signature verification failed"
- Confirme que `STRIPE_WEBHOOK_SECRET` está correto
- O body deve ser raw (não JSON parsed) — já configurado no código

### WebSocket não conecta em produção
- Verifique se o Railway service está rodando
- Confirme `WS_PUBLIC_URL` na Vercel
- Teste health check: `https://xxx.up.railway.app/health`

### Upload de imagem falha
- Verifique credenciais Cloudinary
- Tamanho máximo: 5MB
- Tipos aceitos: JPEG, PNG, WebP

### Build falha na Vercel
- Verifique se `prisma generate` está no buildCommand (já no `vercel.json`)
- Veja logs completos em **Deployments** → **Build Logs**

---

## 💰 Custos Estimados (plano gratuito)

| Serviço | Plano Gratuito | Limite |
|---------|----------------|--------|
| Vercel | Hobby | 100 GB bandwidth/mês |
| Neon | Free | 0.5 GB storage |
| Railway | Trial | $5 credit (≈1 mês) |
| Stripe | — | 4.99% + R$0,49 por transação |
| Mercado Pago | — | 4.99% por transação |
| Cloudinary | Free | 25 créditos/mês (~25 GB storage + bandwidth) |

**Total mensal gratuito**: suficiente para MVP e testes iniciais.

---

## 📞 Suporte

Encontrou algum problema? Abra uma issue:
[github.com/Raphaeljdk/SISTEMA-DE-DELIVERY/issues](https://github.com/Raphaeljdk/SISTEMA-DE-DELIVERY/issues)
