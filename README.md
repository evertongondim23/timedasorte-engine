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
- Docker e Docker Compose (recomendado)
- MinIO (para upload de arquivos - opcional)

### 2. **Instalação - Modo Desenvolvimento**

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

# Execute o seed para dados iniciais (times e admin)
npm run prisma:seed
```

### 4. **Executar em Desenvolvimento**

```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000`

### 5. **Executar com Docker (Produção)**

```bash
# Criar arquivo .env com as variáveis necessárias
cp .env.example .env

# Subir os containers
docker-compose up -d

# Verificar logs
docker-compose logs -f api

# Parar os containers
docker-compose down
```

A API estará disponível em `http://localhost:3000`

### 6. **Credenciais Padrão**

Após executar o seed, use estas credenciais para acessar:

```
Email: admin@jogodasorte.com
Senha: Admin@123
```

⚠️ **IMPORTANTE**: Altere essas credenciais em produção!

---

## 📊 Endpoints Principais

### Autenticação

```
POST   /api/auth/login       # Login
POST   /api/auth/register    # Registro
POST   /api/auth/refresh     # Refresh token
POST   /api/auth/logout      # Logout
```

### Usuários

```
GET    /api/users            # Listar usuários
GET    /api/users/:id        # Buscar usuário
POST   /api/users            # Criar usuário
PATCH  /api/users/:id        # Atualizar usuário
DELETE /api/users/:id        # Deletar usuário (soft delete)
```

### Game Config

```
GET    /api/game/config      # Configuração completa do jogo
GET    /api/game/rules       # Regras do jogo
GET    /api/game/multipliers # Multiplicadores de prêmios
```

### Rodadas (Draws)

```
GET    /api/rounds           # Listar rodadas
GET    /api/rounds/next      # Próxima rodada disponível
GET    /api/rounds/:id       # Detalhes da rodada
GET    /api/rounds/:id/result # Resultado publicado
```

### Apostas (Bets)

```
GET    /api/bets/me          # Minhas apostas
POST   /api/bets             # Criar aposta
GET    /api/bets/:id         # Detalhes da aposta
DELETE /api/bets/:id         # Cancelar aposta (antes do cutoff)
```

### Carteiras (Wallets)

```
GET    /api/wallets/me       # Minha carteira
POST   /api/wallets/deposit  # Depositar (PIX/Boleto/Cartão)
POST   /api/wallets/withdraw # Sacar
```

### Transações

```
GET    /api/transactions     # Histórico de transações
GET    /api/transactions/:id # Detalhes da transação
```

### Admin (Requer role=admin)

```
POST   /api/admin/rounds              # Criar rodada
POST   /api/admin/rounds/:id/publish  # Publicar resultado
POST   /api/admin/rounds/:id/cancel   # Cancelar rodada
POST   /api/admin/rounds/close-expired # Fechar rodadas expiradas (cron)
GET    /api/admin/rounds              # Listar todas as rodadas
GET    /api/admin/rounds/:id          # Detalhes com estatísticas
```

---

## 🎯 Funcionalidades Implementadas

### ✅ Módulos do Jogo
- [x] **GameModule** - Configuração e regras do jogo
  - Mapeamento dezena → time (00-99 → 1-25)
  - Processamento de milhares → resultado
  - Multiplicadores configuráveis
  - Regras de cutoff (30min antes)
- [x] **RoundsModule** - Gestão de rodadas
  - Criação de rodadas agendadas
  - Bloqueio automático por cutoff
  - Publicação de resultados
  - Cancelamento de rodadas
- [x] **BetsModule** - Sistema de apostas completo
  - 7 modalidades implementadas
  - Validações específicas por modalidade
  - Verificação de saldo
  - Verificação de cutoff
  - Cancelamento antes do cutoff
- [x] **ResultsModule** - Cálculo de vencedores
  - Processamento automático após publicação
  - Cálculo de prêmios
  - Criação de settlements (auditoria)
  - Creditação automática na carteira
- [x] **AdminModule** - Gestão administrativa
  - Endpoints protegidos por role=admin
  - Gestão completa de rodadas
  - Publicação de resultados
- [x] **ResultProviderModule** - Sistema plugável
  - AdminProvider (entrada manual)
  - OfficialProvider (stub para API oficial)

### ✅ Módulos Financeiros
- [x] **WalletsModule** - Carteiras de usuários
- [x] **TransactionsModule** - Histórico de transações
- [x] **TeamsModule** - 25 times brasileiros

### 🔨 Próximos Passos

### Fase 1: Integrações de Pagamento (1 semana)
- [ ] Módulo `PaymentGateways`
- [ ] Integração Mercado Pago (PIX)
- [ ] Integração PagSeguro
- [ ] Webhooks de pagamento
- [ ] Confirmação automática de depósitos

### Fase 2: Automação e Cron Jobs (3 dias)
- [ ] Cron para fechar rodadas expiradas
- [ ] Cron para notificar resultados
- [ ] Cron para lembrar de apostas próximas
- [ ] Cron para limpar dados antigos

### Fase 3: Notificações (3 dias)
- [ ] Email (SendGrid/AWS SES)
- [ ] SMS (Twilio)
- [ ] Push Notifications
- [ ] WebSocket para eventos em tempo real

### Fase 4: Admin Dashboard (5 dias)
- [ ] Relatórios de apostas
- [ ] Relatórios financeiros
- [ ] Analytics de usuários
- [ ] Gestão de usuários
- [ ] Auditoria de ações

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

O sistema implementa 7 modalidades de apostas, inspiradas no jogo do bicho mas adaptadas para times de futebol:

| Modalidade | Descrição | Multiplicador | Exemplo |
|------------|-----------|---------------|---------|
| **TIME** | Apostar em 1 time (1-25) | 18x | Apostar R$ 10 → Prêmio R$ 180 |
| **CAMISA** | Apostar em 1 dezena (00-99) | 60x | Apostar R$ 10 → Prêmio R$ 600 |
| **DUPLA** | Apostar em 2 times diferentes | 600x | Apostar R$ 10 → Prêmio R$ 6.000 |
| **TERNO** | Apostar em 3 times diferentes | 6000x | Apostar R$ 10 → Prêmio R$ 60.000 |
| **PASSE** | Time + Dezena (ambos devem sair) | 180x | Apostar R$ 10 → Prêmio R$ 1.800 |
| **CENTENA** | Últimos 3 dígitos (000-999) | 600x | Apostar R$ 10 → Prêmio R$ 6.000 |
| **MILHAR** | 4 dígitos exatos (0000-9999) | 4000x | Apostar R$ 10 → Prêmio R$ 40.000 |

### Como Funciona

1. **Sorteio**: São sorteados 5 milhares (ex: 1234, 5678, 9012, 3456, 7890)
2. **Derivação**: De cada milhar, extrai-se a **dezena** (últimos 2 dígitos)
3. **Mapeamento**: Cada dezena mapeia para um **time** (00-99 → 1-25)
4. **Resultado Final**: 5 milhares → 5 dezenas → 5 times únicos

### Regras de Cutoff

- ⏰ **Cutoff**: 30 minutos antes do sorteio
- 🔒 **Bloqueio**: Apostas automaticamente bloqueadas após cutoff
- ❌ **Cancelamento**: Apostas podem ser canceladas apenas antes do cutoff (com reembolso)

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

**Versão:** 1.0.0 (Beta)  
**Status:** 🟢 Funcional (Backend Core Completo)

### Módulos Implementados ✅
- ✅ Sistema de Autenticação (100%)
- ✅ Gestão de Usuários (100%)
- ✅ Sistema de Permissões (100%)
- ✅ Upload de Arquivos (100%)
- ✅ Notificações WebSocket (100%)
- ✅ Infraestrutura Base (100%)
- ✅ **Carteiras** (100%)
- ✅ **Transações** (100%)
- ✅ **Times** (100%)
- ✅ **Apostas** (100%)
- ✅ **Sorteios/Rodadas** (100%)
- ✅ **Cálculo de Vencedores** (100%)
- ✅ **Admin Panel API** (100%)
- ✅ **Result Providers** (100%)

### Módulos Pendentes 🔨
- 🆕 Payment Gateways (0%)
- 🆕 Cron Jobs (0%)
- 🆕 Notificações Email/SMS (0%)
- 🆕 Admin Dashboard UI (0%)
- 🆕 Relatórios e Analytics (0%)

---

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através de:
- Email: suporte@jogodasorte.com
- Discord: [Link do Discord]
- Documentação: [Link da Documentação]

---

**🎲 Desenvolvido com ❤️ para revolucionar o mercado de apostas online!**

