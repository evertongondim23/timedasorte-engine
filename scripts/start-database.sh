#!/bin/bash

echo "🗄️ Iniciando Banco de Dados Jogo da Sorte..."

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose -f docker/docker-compose.database.yml down

# Iniciar banco de dados
echo "▶️ Iniciando banco de dados..."
docker compose -f docker/docker-compose.database.yml up -d

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 10

# Verificar status
echo "📊 Status dos containers:"
docker compose -f docker/docker-compose.database.yml ps

echo ""
echo "✅ Banco de dados iniciado!"
echo "🗄️ PostgreSQL disponível em: localhost:5432"
echo "⚡ Redis disponível em: localhost:6379"
echo ""
echo "📋 Comandos úteis:"
echo "  - Logs: docker compose -f docker/docker-compose.database.yml logs -f"
echo "  - Parar: docker compose -f docker/docker-compose.database.yml down"
echo "  - Conectar: docker compose -f docker/docker-compose.database.yml exec db psql -U postgres -d mydb"
