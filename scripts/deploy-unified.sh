#!/bin/bash

echo "🚀 Deploy Unificado - Jogo da Sorte"

# Verificar se está no diretório correto
if [ ! -f "docker/docker-compose.unified.yml" ]; then
    echo "❌ Erro: Execute este script no diretório do projeto"
    exit 1
fi

# Criar rede se não existir
echo "🔧 Verificando rede app-net..."
if ! docker network ls | grep -q "app-net"; then
    echo "📡 Criando rede app-net..."
    docker network create --driver bridge app-net
    echo "✅ Rede app-net criada com sucesso!"
else
    echo "✅ Rede app-net já existe"
fi

# Parar todos os containers existentes
echo "🛑 Parando containers existentes..."
docker compose -f docker/docker-compose.unified.yml down

# Remover containers órfãos
echo "🧹 Limpando containers órfãos..."
docker compose -f docker/docker-compose.unified.yml down --remove-orphans

# Iniciar todos os serviços (migration executa automaticamente)
echo "🚀 Iniciando todos os serviços..."
echo "📦 Migration será executada automaticamente antes do backend"
docker compose -f docker/docker-compose.unified.yml up -d --build

# Aguardar migration e inicialização
echo "⏳ Aguardando migration e inicialização..."
sleep 60

# Verificar status
echo "📊 Status dos containers:"
docker compose -f docker/docker-compose.unified.yml ps

# Aguardar mais um pouco para o backend inicializar
echo "⏳ Aguardando backend inicializar..."
sleep 15

# Testar health check
echo "🏥 Testando health check..."
sleep 5
curl -k -f https://localhost/health && echo "✅ Backend OK" || echo "❌ Backend falhou"

echo ""
echo "✅ Deploy unificado concluído!"
echo "🌐 API disponível em: https://localhost"
echo ""
echo "📋 Comandos úteis:"
echo "  - Logs: docker compose -f docker/docker-compose.unified.yml logs -f"
echo "  - Restart: docker compose -f docker/docker-compose.unified.yml restart"
echo "  - Parar: docker compose -f docker/docker-compose.unified.yml down"
