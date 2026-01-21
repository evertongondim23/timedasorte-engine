# 🎲 Jogo da Sorte - Backend Engine

> Sistema backend robusto para plataforma de apostas e sorteios, desenvolvido com NestJS 11 e Prisma ORM.

## 📌 Sobre o Projeto

O **Jogo da Sorte Engine** é um backend completo para sistema de apostas baseado no jogo do bicho modernizado com times de futebol. Desenvolvido com arquitetura SOLID, inclui autenticação JWT, sistema de carteiras, processamento de apostas e sorteios automatizados.

### 🎯 Funcionalidades Principais

- 🔐 **Autenticação JWT** completa (login, refresh token, logout)
- 👥 **Gestão de Usuários** com roles e KYC
- 💰 **Sistema de Carteiras** com saldo e transações
- 🎲 **Apostas** em 7 modalidades diferentes
- 🎰 **Sorteios Automatizados** com RNG seguro
- 💳 **Integração Payment Gateways** (preparado para Mercado Pago, PagSeguro, Stripe)
- 🔔 **Notificações em Tempo Real** via WebSocket
- 📁 **Upload de Arquivos** com MinIO
- 📊 **Métricas e Monitoramento** com Prometheus
- 📝 **Auditoria Completa** de todas as ações

---

## 🧰 Stack Tecnológico

- **NestJS 11** - Framework backend
- **TypeScript** - Linguagem
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas
- **CASL** - Sistema de permissões
- **MinIO** - Storage de arquivos
- **Socket.io** - WebSockets
- **Winston** - Logging
- **Prometheus** - Métricas
- **Docker** - Containerização

---

## 🗂️ Estrutura do Projeto

```
jogo-da-sorte-engine/
├── src/
│   ├── modules/              # Módulos de domínio
│   │   ├── users/           # ✅ Gestão de usuários
│   │   ├── companies/       # ✅ Multi-tenancy (opcional)
│   │   ├── teams/           # 🆕 Times e animais (A CRIAR)
│   │   ├── bets/            # 🆕 Sistema de apostas (A CRIAR)
│   │   ├── draws/           # 🆕 Sorteios (A CRIAR)
│   │   ├── wallets/         # 🆕 Carteiras (A CRIAR)
│   │   ├── transactions/    # 🆕 Transações (A CRIAR)
│   │   ├── notifications/   # ✅ Notificações WebSocket
│   │   └── payment-gateways/ # 🆕 Integrações de pagamento (A CRIAR)
│   │
│   ├── shared/              # Infraestrutura compartilhada
│   │   ├── auth/           # ✅ Sistema de autenticação completo
│   │   ├── prisma/         # ✅ Configuração do Prisma
│   │   ├── casl/           # ✅ Permissões e autorização
│   │   ├── files/          # ✅ Upload de arquivos (MinIO)
│   │   ├── universal/      # ✅ CRUD genérico reutilizável
│   │   ├── common/         # ✅ Utilitários globais
│   │   │   ├── filters/    # 10 filtros de erro
│   │   │   ├── logger/     # Winston configurado
│   │   │   ├── messages/   # Mensagens centralizadas
│   │   │   └── validators/ # Validadores customizados (CPF, email, etc)
│   │   └── interceptors/   # Soft delete, métricas
│   │
│   ├── app.module.ts        # Módulo principal
│   └── main.ts              # Bootstrap
│
├── prisma/
│   ├── schema.prisma        # ✅ Schema do banco de dados
│   └── seed.ts              # Seed de dados iniciais
│
├── docs/                    # Documentação
├── scripts/                 # Scripts utilitários
├── .env.example             # Variáveis de ambiente
├── package.json             # Dependências
└── README.md                # Este arquivo
```

---

## 🚀 Quick Start

### 1. **Pré-requisitos**

- Node.js 18+ 
- PostgreSQL 14+
- Docker (opcional, recomendado)
- MinIO (para upload de arquivos)

### 2. **Instalação**

```bash
# Clone o repositório
cd /Users/everton/jogo-da-sorte-engine

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 3. **Configuração do Banco de Dados**

```bash
# Gere o Prisma Client
npm run prisma:generate

# Execute as migrations
npm run prisma:migrate

# (Opcional) Execute o seed para dados iniciais
npm run prisma:seed
```

### 4. **Executar em Desenvolvimento**

```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000`

### 5. **Executar com Docker**

```bash
# Development
npm run docker:dev

# Production
npm run docker:prod
```

---

## 📊 Endpoints Principais

### Autenticação

```
POST   /auth/login       # Login
POST   /auth/register    # Registro
POST   /auth/refresh     # Refresh token
POST   /auth/logout      # Logout
```

### Usuários

```
GET    /users            # Listar usuários
GET    /users/:id        # Buscar usuário
POST   /users            # Criar usuário
PATCH  /users/:id        # Atualizar usuário
DELETE /users/:id        # Deletar usuário (soft delete)
```

### Apostas (A IMPLEMENTAR)

```
GET    /bets             # Listar apostas do usuário
POST   /bets             # Criar aposta
GET    /bets/:id         # Detalhes da aposta
DELETE /bets/:id         # Cancelar aposta (antes do sorteio)
```

### Sorteios (A IMPLEMENTAR)

```
GET    /draws            # Listar sorteios
GET    /draws/next       # Próximo sorteio
GET    /draws/:id        # Detalhes do sorteio
GET    /draws/:id/results # Resultados do sorteio
```

### Carteiras (A IMPLEMENTAR)

```
GET    /wallets/me       # Minha carteira
POST   /wallets/deposit  # Depositar
POST   /wallets/withdraw # Sacar
```

### Transações (A IMPLEMENTAR)

```
GET    /transactions     # Histórico de transações
GET    /transactions/:id # Detalhes da transação
```

---

## 🎯 Próximos Passos de Desenvolvimento

### Fase 1: Módulos Financeiros (1 semana)
- [ ] Criar módulo `Wallets`
- [ ] Criar módulo `Transactions`
- [ ] Implementar lógica de depósito/saque
- [ ] Validações de saldo

### Fase 2: Módulos de Apostas (1 semana)
- [ ] Criar módulo `Teams`
- [ ] Seed com 25 times brasileiros
- [ ] Criar módulo `Bets`
- [ ] Implementar 7 modalidades de aposta
- [ ] Validações de apostas

### Fase 3: Sistema de Sorteios (1 semana)
- [ ] Criar módulo `Draws`
- [ ] Implementar RNG seguro (Random Number Generation)
- [ ] Cron job para sorteios automáticos
- [ ] Processamento de apostas vencedoras
- [ ] Distribuição de prêmios

### Fase 4: Integrações (1 semana)
- [ ] Módulo `PaymentGateways`
- [ ] Integração Mercado Pago
- [ ] Integração PagSeguro
- [ ] Webhooks de pagamento
- [ ] Serviço de Email (SendGrid/SES)
- [ ] Serviço de SMS (Twilio)

### Fase 5: Admin e Relatórios (5 dias)
- [ ] Painel administrativo
- [ ] Relatórios de apostas
- [ ] Relatórios financeiros
- [ ] Analytics de usuários

---

## 🔒 Segurança

### Implementado ✅

- ✅ Autenticação JWT com refresh token
- ✅ Hash de senhas com bcrypt
- ✅ Rate limiting (100 req/15min)
- ✅ Validação de dados com class-validator
- ✅ Soft delete para preservar dados
- ✅ Auditoria de ações
- ✅ Proteção CORS
- ✅ Helmet security headers

### A Implementar 🔨

- [ ] KYC (Know Your Customer) completo
- [ ] Verificação em duas etapas (2FA)
- [ ] Detecção de fraudes
- [ ] Limites de apostas por usuário
- [ ] Limites de saque diário
- [ ] Blacklist de IPs

---

## 📊 Monitoramento

### Endpoints de Saúde

```
GET /health          # Health check
GET /metrics         # Métricas Prometheus
```

### Logs

Os logs são armazenados em:
- `logs/combined.log` - Todos os logs
- `logs/error.log` - Apenas erros

### Métricas Prometheus

Acesse o Grafana em `http://localhost:3001` (quando executando via Docker)

---

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Coverage
npm run test:cov
```

---

## 📚 Documentação Adicional

- [Arquitetura SOLID](./docs/CODING_STANDARDS.md)
- [Sistema de Autenticação](./docs/AUTH-REFATORACAO.md)
- [Multi-tenancy](./docs/README-tenant-multitenancy.md)
- [Sistema de Erros](./docs/ESTRATEGIA-ERROS-SIMPLES.md)

---

## 🎲 Modalidades de Aposta

1. **Time da Sorte** - Apostar em 1 time (R$ 1.000)
2. **Camisa** - Apostar em número de camisa (R$ 500)
3. **Dupla** - Apostar em 2 times (R$ 2.500)
4. **Terno** - Apostar em 3 camisas (R$ 5.000)
5. **Passe** - Apostar em vários times (R$ 10.000)
6. **Centena** - Últimos 2 números (R$ 3.000)
7. **Milhar** - 4 números exatos (R$ 25.000)

---

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run start:dev       # Inicia com hot reload
npm run start:debug     # Inicia em modo debug

# Build e Produção
npm run build           # Build para produção
npm run start:prod      # Executa build de produção

# Database
npm run prisma:generate # Gera Prisma Client
npm run prisma:migrate  # Executa migrations
npm run prisma:studio   # Abre Prisma Studio
npm run prisma:seed     # Popula banco com dados iniciais

# Qualidade de Código
npm run lint            # Executa ESLint
npm run format          # Formata código com Prettier
```

---

## 🤝 Contribuindo

1. Clone o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob licença privada. Todos os direitos reservados.

---

## 🎯 Status do Projeto

**Versão:** 0.0.1 (Alpha)  
**Status:** 🟡 Em Desenvolvimento

### Módulos Implementados
- ✅ Sistema de Autenticação (100%)
- ✅ Gestão de Usuários (100%)
- ✅ Sistema de Permissões (100%)
- ✅ Upload de Arquivos (100%)
- ✅ Notificações WebSocket (100%)
- ✅ Infraestrutura Base (100%)

### Módulos Pendentes
- 🆕 Carteiras (0%)
- 🆕 Transações (0%)
- 🆕 Times (0%)
- 🆕 Apostas (0%)
- 🆕 Sorteios (0%)
- 🆕 Payment Gateways (0%)
- 🆕 Admin Panel (0%)

---

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através de:
- Email: suporte@jogodasorte.com
- Discord: [Link do Discord]
- Documentação: [Link da Documentação]

---

**🎲 Desenvolvido com ❤️ para revolucionar o mercado de apostas online!**

