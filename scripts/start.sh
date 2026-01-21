#!/bin/bash

# Script de inicialização robusto para o backend NestJS
set -e

echo "🚀 Iniciando aplicação..."

# Função para log com timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Aguardar banco estar pronto
log "⏳ Aguardando banco de dados..."
until npx prisma db push --accept-data-loss >/dev/null 2>&1; do
    log "Banco ainda não está pronto, aguardando..."
    sleep 3
done

log "✅ Banco de dados pronto!"

# Gerar cliente Prisma
log "🔧 Gerando cliente Prisma..."
npx prisma generate

# Aplicar migrations (se houver)
log "📦 Verificando migrations..."
if npx prisma migrate status >/dev/null 2>&1; then
    log "📦 Aplicando migrations..."
    npx prisma migrate deploy
    log "✅ Migrations aplicadas!"
else
    log "ℹ️ Nenhuma migration pendente"
fi

# Rodar seed (com validação)
log "🌱 Executando seed..."
if npm run prisma:seed >/dev/null 2>&1; then
    log "✅ Seed executado com sucesso!"
else
    log "⚠️ Seed pode ter falhado, continuando..."
fi

# Iniciar aplicação
log "🎯 Iniciando NestJS..."
exec npm run start:dev 