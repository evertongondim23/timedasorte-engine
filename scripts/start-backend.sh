#!/bin/bash

echo "🚀 Iniciando Backend Jogo da Sorte..."

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose -f docker/docker-compose.backend.yml down

# Iniciar backend
echo "▶️ Iniciando backend..."
docker compose -f docker/docker-compose.backend.yml up -d

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 15

# Verificar status
echo "📊 Status dos containers:"
docker compose -f docker/docker-compose.backend.yml ps

echo ""
echo "✅ Backend iniciado!"
echo "🌐 API disponível em: http://localhost:3000"
echo "🗄️ PostgreSQL disponível em: localhost:5432"
echo "⚡ Redis disponível em: localhost:6379"
echo "📁 MinIO disponível em: http://localhost:9000 (API) e http://localhost:9001 (Console)"
echo ""
echo "📋 Comandos úteis:"
echo "  - Logs: docker compose -f docker/docker-compose.backend.yml logs -f backend"
echo "  - Parar: docker compose -f docker/docker-compose.backend.yml down"
echo "  - Restart: docker compose -f docker/docker-compose.backend.yml restart backend"
