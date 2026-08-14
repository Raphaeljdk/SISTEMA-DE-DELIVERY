# Dockerfile para o WebSocket service (Render compatible)
# Uso: render.yaml com runtime: docker, ou build local manual
FROM oven/bun:1 AS base
WORKDIR /app

# Copy lockfile e package.json primeiro (cache de dependências)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Copy código fonte
COPY . .

# Environment
ENV NODE_ENV=production
ENV PORT=3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3003/health || exit 1

EXPOSE 3003

CMD ["bun", "index.ts"]
