#!/bin/bash

# Script de Limpeza de Documentação - Jogo da Sorte
# Remove documentação obsoleta do sistema antigo de segurança

set -e  # Para em caso de erro

echo "🗑️  LIMPEZA DE DOCUMENTAÇÃO - Jogo da Sorte"
echo "========================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador
ARCHIVED=0
DELETED=0

# Navegar para o diretório do projeto
cd /Users/everton/jogo-da-sorte-engine

echo "📦 Passo 1: Arquivando documentação do sistema antigo..."
echo ""

# Criar diretório de arquivo
mkdir -p docs/archive/sistema-seguranca

# Arquivar (mover, não deletar)
FILES_TO_ARCHIVE=(
    "ANALISE_BACKEND_ATUAL.md"
    "ANALISE_COMPLETA_FRONTEND.md"
    "PLANO-IMPLEMENTACAO-INTEGRACAO.md"
    "ESCOPO-SISTEMA.md"
    "FASE-1-FUNDACAO-SOLIDA.md"
    "PLANO-DESENVOLVIMENTO-FASES.md"
    "RESUMO-ESTRATEGIA-COMPLETA.md"
)

for file in "${FILES_TO_ARCHIVE[@]}"; do
    if [ -f "docs/$file" ]; then
        mv "docs/$file" "docs/archive/sistema-seguranca/"
        echo "${GREEN}✓${NC} Arquivado: $file"
        ((ARCHIVED++))
    else
        echo "${YELLOW}⚠${NC}  Não encontrado: $file"
    fi
done

echo ""
echo "🗑️  Passo 2: Deletando documentação obsoleta..."
echo ""

# Deletar definitivamente
FILES_TO_DELETE=(
    "AUTH-REFATORACAO.md"
    "PLANO-UNIVERSALIZACAO-PERMISSOES.md"
    "README-users.md"
    "SOLUCAO-PROBLEMA-PORTA-3000.md"
    "ATUALIZACAO-DOCUMENTACAO.md"
)

for file in "${FILES_TO_DELETE[@]}"; do
    if [ -f "docs/$file" ]; then
        rm "docs/$file"
        echo "${RED}✗${NC} Deletado: $file"
        ((DELETED++))
    else
        echo "${YELLOW}⚠${NC}  Não encontrado: $file"
    fi
done

echo ""
echo "🗑️  Passo 3: Removendo context builders antigos..."
echo ""

# Deletar context builders de notificações antigas
CONTEXT_BUILDERS=(
    "doorman-checklist"
    "motorcycle-checklist"
    "motorized-service"
    "occurrence"
    "occurrence-dispatch"
    "patrol"
    "shift"
    "supply"
    "vehicle-checklist"
)

BUILDERS_DELETED=0

for builder in "${CONTEXT_BUILDERS[@]}"; do
    if [ -d "src/modules/notifications/entities/$builder" ]; then
        rm -rf "src/modules/notifications/entities/$builder"
        echo "${RED}✗${NC} Deletado: $builder/"
        ((BUILDERS_DELETED++))
    else
        echo "${YELLOW}⚠${NC}  Não encontrado: $builder/"
    fi
done

echo ""
echo "========================================"
echo "✨ LIMPEZA CONCLUÍDA!"
echo "========================================"
echo ""
echo "📊 Resumo:"
echo "  ${GREEN}• Arquivos arquivados:${NC} $ARCHIVED"
echo "  ${RED}• Arquivos deletados:${NC} $DELETED"
echo "  ${RED}• Context builders deletados:${NC} $BUILDERS_DELETED"
echo ""
echo "📁 Arquivos arquivados em: docs/archive/sistema-seguranca/"
echo ""
echo "⚠️  Próximos passos:"
echo "  1. Execute: ${YELLOW}npm run build${NC}"
echo "  2. Verifique se não há erros"
echo "  3. Teste o servidor: ${YELLOW}npm run start:dev${NC}"
echo "  4. Commit das alterações"
echo ""

