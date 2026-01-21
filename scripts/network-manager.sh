#!/bin/bash

# Script para gerenciar a rede app-net do Jogo da Sorte
# Uso: ./scripts/network-manager.sh [create|remove|status]

NETWORK_NAME="app-net"
NETWORK_DRIVER="bridge"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir ajuda
show_help() {
    echo -e "${BLUE}📋 Gerenciador de Rede - Jogo da Sorte${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponíveis:"
    echo "  create   - Criar a rede app-net"
    echo "  remove   - Remover a rede app-net"
    echo "  status   - Verificar status da rede"
    echo "  help     - Exibir esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0 create"
    echo "  $0 status"
    echo "  $0 remove"
}

# Função para criar a rede
create_network() {
    echo -e "${BLUE}🔧 Criando rede ${NETWORK_NAME}...${NC}"
    
    # Verificar se a rede já existe
    if docker network ls | grep -q "${NETWORK_NAME}"; then
        echo -e "${YELLOW}⚠️  Rede ${NETWORK_NAME} já existe${NC}"
        return 0
    fi
    
    # Criar a rede
    if docker network create --driver ${NETWORK_DRIVER} ${NETWORK_NAME}; then
        echo -e "${GREEN}✅ Rede ${NETWORK_NAME} criada com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao criar rede ${NETWORK_NAME}${NC}"
        return 1
    fi
}

# Função para remover a rede
remove_network() {
    echo -e "${BLUE}🗑️  Removendo rede ${NETWORK_NAME}...${NC}"
    
    # Verificar se a rede existe
    if ! docker network ls | grep -q "${NETWORK_NAME}"; then
        echo -e "${YELLOW}⚠️  Rede ${NETWORK_NAME} não existe${NC}"
        return 0
    fi
    
    # Verificar se há containers usando a rede
    CONTAINERS_USING_NETWORK=$(docker network inspect ${NETWORK_NAME} --format='{{range .Containers}}{{.Name}} {{end}}')
    
    if [ -n "$CONTAINERS_USING_NETWORK" ]; then
        echo -e "${YELLOW}⚠️  Containers usando a rede:${NC}"
        echo "  $CONTAINERS_USING_NETWORK"
        echo -e "${YELLOW}⚠️  Pare os containers antes de remover a rede${NC}"
        return 1
    fi
    
    # Remover a rede
    if docker network rm ${NETWORK_NAME}; then
        echo -e "${GREEN}✅ Rede ${NETWORK_NAME} removida com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao remover rede ${NETWORK_NAME}${NC}"
        return 1
    fi
}

# Função para verificar status da rede
check_status() {
    echo -e "${BLUE}📊 Status da rede ${NETWORK_NAME}:${NC}"
    echo ""
    
    if docker network ls | grep -q "${NETWORK_NAME}"; then
        echo -e "${GREEN}✅ Rede ${NETWORK_NAME} existe${NC}"
        echo ""
        
        # Informações detalhadas da rede
        echo "📋 Informações da rede:"
        docker network inspect ${NETWORK_NAME} --format='table {{.Name}}\t{{.Driver}}\t{{.Scope}}\t{{.IPAM.Config}}'
        echo ""
        
        # Containers conectados
        CONTAINERS=$(docker network inspect ${NETWORK_NAME} --format='{{range .Containers}}{{.Name}} {{end}}')
        if [ -n "$CONTAINERS" ]; then
            echo "🔗 Containers conectados:"
            for container in $CONTAINERS; do
                echo "  - $container"
            done
        else
            echo "🔗 Nenhum container conectado"
        fi
    else
        echo -e "${RED}❌ Rede ${NETWORK_NAME} não existe${NC}"
        echo ""
        echo "Para criar a rede, execute:"
        echo "  $0 create"
    fi
}

# Função para verificar se o Docker está rodando
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker não está rodando${NC}"
        echo "Inicie o Docker e tente novamente"
        exit 1
    fi
}

# Verificar se o Docker está rodando
check_docker

# Processar argumentos
case "${1:-help}" in
    create)
        create_network
        ;;
    remove)
        remove_network
        ;;
    status)
        check_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Comando inválido: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac 