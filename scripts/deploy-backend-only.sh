#!/bin/bash

echo "🚀 Deploy Backend Apenas - jogodasorte"

# Verificar se está no diretório correto
if [ ! -f "docker/docker-compose.prod.yml" ]; then
    echo "❌ Erro: Execute este script no diretório do projeto"
    exit 1
fi

# Criar rede se não existir
echo "🔧 Verificando rede app-net-time-da-sorte..."
if ! docker network ls | grep -q "app-net-time-da-sorte"; then
    echo "📡 Criando rede app-net-time-da-sorte..."
    docker network create --driver bridge app-net-time-da-sorte
    echo "✅ Rede app-net-time-da-sorte criada com sucesso!"
else
    echo "✅ Rede app-net-time-da-sorte já existe"
fi

# Verificar se infraestrutura está rodando
echo "🔍 Verificando infraestrutura..."

if ! docker ps | grep -q "jogodasorte-db"; then
    echo "⚠️ Database não está rodando. Execute: ./scripts/start-database.sh"
    exit 1
fi

# Parar apenas o backend
echo "🛑 Parando backend..."
docker compose -f docker/docker-compose.prod.yml stop backend

# Reconstruir e iniciar apenas o backend
echo "🔨 Reconstruindo backend..."
docker compose -f docker/docker-compose.prod.yml up -d --build backend

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 15

# Verificar status
echo "📊 Status do backend:"
docker compose -f docker/docker-compose.prod.yml ps backend

# Testar health check
echo "🏥 Testando health check..."
sleep 5
curl -k -f https://appjogodasorte.com.br/api/health && echo "✅ Backend OK" || echo "❌ Backend falhou"

echo ""
echo "✅ Deploy do backend concluído!"
echo "🌐 API disponível em: https://appjogodasorte.com.br/api/"
echo ""
echo "📋 Comandos úteis:"
echo "  - Logs: docker compose -f docker/docker-compose.prod.yml logs -f backend"
echo "  - Restart: docker compose -f docker/docker-compose.prod.yml restart backend"
