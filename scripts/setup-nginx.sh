#!/bin/bash

echo "🔧 Configurando Nginx para Jogo da Sorte..."

# Verificar se está no diretório correto
if [ ! -f "docker/docker-compose.unified.yml" ]; then
    echo "❌ Erro: Execute este script no diretório do projeto"
    exit 1
fi

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p nginx/ssl
mkdir -p nginx/logs

# Criar certificado SSL auto-assinado (se não existir)
if [ ! -f "nginx/ssl/cert.pem" ]; then
    echo "🔐 Criando certificado SSL de teste..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=BR/ST=SP/L=SP/O=JOGODASORTE/CN=localhost"
    echo "✅ Certificado SSL criado!"
else
    echo "✅ Certificado SSL já existe"
fi

# Verificar se a rede app-net-time-da-sorte existe
echo "🔗 Verificando rede app-net-time-da-sorte..."
if ! docker network ls | grep -q "app-net-time-da-sorte"; then
    echo "📡 Criando rede app-net-time-da-sorte..."
    docker network create --driver bridge app-net-time-da-sorte
    echo "✅ Rede app-net-time-da-sorte criada!"
else
    echo "✅ Rede app-net-time-da-sorte já existe"
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose -f docker/docker-compose.unified.yml down

# Iniciar todos os serviços
echo "🚀 Iniciando todos os serviços..."
docker compose -f docker/docker-compose.unified.yml up -d

# Aguardar inicialização
echo "⏳ Aguardando inicialização dos serviços..."
sleep 10

# Verificar status
echo "📊 Status dos serviços:"
docker compose -f docker/docker-compose.unified.yml ps

# Testar conectividade
echo "🧪 Testando conectividade..."

# Testar backend
echo "   🔍 Testando backend..."
if curl -s -f http://localhost:3000/health >/dev/null; then
    echo "   ✅ Backend respondendo na porta 3000"
else
    echo "   ❌ Backend não responde na porta 3020"
fi

# Testar frontend
echo "   🔍 Testando frontend..."
if curl -s -f http://localhost:4220 >/dev/null; then
    echo "   ✅ Frontend respondendo na porta 4220"
else
    echo "   ❌ Frontend não responde na porta 4220"
fi

# Testar nginx
echo "   🔍 Testando nginx..."
if curl -s -f -k https://localhost >/dev/null; then
    echo "   ✅ Nginx respondendo na porta 443 (HTTPS)"
else
    echo "   ❌ Nginx não responde na porta 443"
fi

# Testar roteamento de API
echo "   🔍 Testando roteamento de API..."
if curl -s -f -k https://localhost/api/health >/dev/null; then
    echo "   ✅ API roteada corretamente via nginx"
else
    echo "   ❌ API não está sendo roteada via nginx"
fi

echo ""
echo "🎯 Configuração concluída!"
echo ""
echo "📋 URLs de acesso:"
echo "   🌐 Frontend: https://localhost (via nginx)"
echo "   🔌 Backend: http://localhost:3000 (direto)"
echo "   📡 API: https://localhost/api/* (via nginx)"
echo "   🗄️ Database: localhost:3200"
echo "   📁 MinIO: http://localhost:3300"
echo ""
echo "🔧 Para ver logs:"
echo "   docker compose -f docker/docker-compose.unified.yml logs -f nginx"
echo "   docker compose -f docker/docker-compose.unified.yml logs -f backend"
echo "   docker compose -f docker/docker-compose.unified.yml logs -f frontend"
