# ===============================================
# 🐳 DOCKERFILE - Jogo da Sorte Engine
# ===============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# ===============================================
# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copiar dependências de produção
COPY package*.json ./
RUN npm ci --only=production

# Copiar build e prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Criar diretório de logs
RUN mkdir -p /app/logs

# Expor porta
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de início
CMD ["node", "dist/main"]
