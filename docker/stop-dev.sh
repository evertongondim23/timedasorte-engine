#!/bin/bash

echo "🛑 Parando ambiente de desenvolvimento jogodasorte..."

# Parar serviços
echo "📦 Parando serviços..."
docker compose -f docker/docker-compose.yml --env-file .env down

echo "✅ Ambiente parado com sucesso!"
echo ""
echo "📋 Para iniciar novamente:"
echo "  🚀 ./docker/start-dev.sh"
echo "  🚀 docker compose -f docker/docker-compose.yml up -d"
