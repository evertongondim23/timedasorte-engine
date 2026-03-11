#!/bin/bash

# Executar a partir da raiz do projeto
cd "$(dirname "$0")/.." || exit 1

echo "🗄️ Iniciando Banco de Dados Jogo da Sorte..."

# Garantir rede e volume existem (external: true no compose)
docker network create app-net-time-da-sorte 2>/dev/null || true
docker volume create jogodasorte-engine-lobocode_postgres_data 2>/dev/null || true

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose -f docker/docker-compose.database.yml --env-file .env down

# Iniciar banco de dados (carrega .env da raiz)
echo "▶️ Iniciando banco de dados..."
docker compose -f docker/docker-compose.database.yml --env-file .env up -d

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 10

# Verificar status
echo "📊 Status dos containers:"
docker compose -f docker/docker-compose.database.yml --env-file .env ps

echo ""
echo "✅ Banco de dados iniciado!"
echo "🗄️ PostgreSQL disponível em: localhost:3200"
echo "⚡ Redis disponível em: localhost:3900"
echo ""
echo "📋 Comandos úteis:"
echo "  - Logs: docker compose -f docker/docker-compose.database.yml logs -f"
echo "  - Parar: docker compose -f docker/docker-compose.database.yml down"
echo "  - Conectar: docker compose -f docker/docker-compose.database.yml --env-file .env exec db psql -U postgres -d jogo_da_sorte_db"
