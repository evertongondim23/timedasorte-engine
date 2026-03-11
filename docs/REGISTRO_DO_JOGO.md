# 🎲 REGISTRO DO JOGO - TIMES DA SORTE

## 📋 Visão Geral

**Times da Sorte** é um sistema de apostas baseado no modelo clássico de 25 grupos/100 dezenas, adaptado para times de futebol brasileiros.

---

## 🎯 Domínio do Jogo

### Universo de Dezenas

- **Total de dezenas:** 00 a 99 (100 dezenas)
- **Total de times:** 25 times
- **Dezenas por time:** 4 dezenas cada

### Mapeamento Times × Dezenas

| Time | Dezenas      |
|------|-------------|
| 01   | 01, 02, 03, 04 |
| 02   | 05, 06, 07, 08 |
| ...  | ...         |
| 24   | 93, 94, 95, 96 |
| 25   | 97, 98, 99, 00 |

> ⚠️ **REGRA ESPECIAL:** A dezena `00` pertence ao Time 25

### Cálculo: Dezena → Time

```
Para dezena != 00:
  timeId = ceil(dezena / 4)

Para dezena == 00:
  timeId = 25  (tratado como 100 / 4)
```

---

## 🎰 Mecânica de Sorteio (Rodadas)

### Estrutura de uma Rodada (Draw)

Cada rodada possui:
- **5 milhares** (números de 0000 a 9999)
- De cada milhar, extraímos a **dezena** (últimos 2 dígitos)
- De cada dezena, derivamos o **time**

**Exemplo:**
```
Milhares sorteados: [1234, 5697, 9100, 3450, 7808]

Dezenas: [34, 97, 00, 50, 08]
Times:   [09, 25, 25, 13, 02]
Times únicos: [02, 09, 13, 25]
```

---

## 🃏 Modalidades de Aposta

### 1. TIME (Grupo)
- **Como jogar:** Escolher 1 time (1..25)
- **Como ganhar:** Se qualquer das 5 dezenas sorteadas pertencer ao time
- **Multiplicador:** **18x**

### 2. CAMISA (Dezena)
- **Como jogar:** Escolher 1 dezena (00..99)
- **Como ganhar:** Se a dezena aparecer entre as 5 sorteadas
- **Multiplicador:** **60x**

### 3. CENTENA
- **Como jogar:** Escolher 000..999
- **Como ganhar:** Se os 3 últimos dígitos de algum milhar sorteado baterem
- **Multiplicador:** **600x**

### 4. MILHAR
- **Como jogar:** Escolher 0000..9999
- **Como ganhar:** Se algum milhar sorteado bater exatamente
- **Multiplicador:** **4000x**

### 5. DUPLA DE TIMES (Duque)
- **Como jogar:** Escolher 2 times distintos
- **Como ganhar:** Se ambos os times aparecerem na rodada
- **Multiplicador:** **300x**

### 6. TERNO DE TIMES
- **Como jogar:** Escolher 3 times distintos
- **Como ganhar:** Se todos os 3 times aparecerem na rodada
- **Multiplicador:** **3000x**

### 7. PASSE (Time + Camisa)
- **Como jogar:** Escolher 1 time e 1 dezena pertencente a ele
- **Como ganhar:** Se a dezena aparecer E pertencer ao time selecionado
- **Multiplicador:** **120x**

---

## ⏰ Regras de Cutoff (Bloqueio de Apostas)

### Timeline de uma Rodada

```
CRIAÇÃO → OPEN → CUTOFF → CLOSED → RESULTADO → IN_PROGRESS → COMPLETED
          [30min antes]
```

### Cutoff Automático

- **Todas as apostas** para uma rodada são bloqueadas **30 minutos antes** do `scheduledAt`
- `cutoffAt = scheduledAt - 30 minutos`
- Após o cutoff, tentativas de aposta retornam erro **409 Conflict**

### Estados da Rodada

| Estado | Descrição | Pode apostar? |
|--------|-----------|---------------|
| `SCHEDULED` | Rodada criada | ✅ Sim (se antes do cutoff) |
| `OPEN` | Aberta para apostas | ✅ Sim (se antes do cutoff) |
| `CLOSED` | Cutoff passou | ❌ Não |
| `IN_PROGRESS` | Processando resultado | ❌ Não |
| `COMPLETED` | Finalizada | ❌ Não |
| `CANCELLED` | Cancelada | ❌ Não |

---

## 📊 Resultados

### Armazenamento

Cada rodada armazena:
- `scheduledAt` (quando será publicado)
- `cutoffAt` (limite para apostas)
- `publishedAt` (quando foi publicado)
- `milhares[5]` (array de 5 inteiros 0..9999)
- `jerseys[5]` (dezenas derivadas)
- `teams[5]` (times derivados)
- `source` ("ADMIN" | "OFFICIAL" | "SYSTEM")
- `externalRef` (referência externa opcional)

### Publicação de Resultado

Ao publicar um resultado:
1. Validar milhares (5 números de 0..9999)
2. Calcular dezenas e times automaticamente
3. Fechar a rodada para apostas
4. Calcular vencedores das apostas da rodada
5. Registrar pagamentos (payouts)
6. Atualizar estatísticas

---

## 🔐 Segurança e Compliance

### Autenticação

- **JWT** para autenticação de usuários
- **Refresh Tokens** para renovação de sessão

### Autorização

- Rotas `/admin/*` protegidas por **role=ADMIN** ou **role=OPERATOR**
- Usuários comuns só podem criar apostas e consultar resultados

### ResultProvider Plugável

**Duas fontes de resultados:**

1. **AdminProvider** (Padrão)
   - Resultado inserido manualmente pelo administrador
   - `source: ResultSource.ADMIN`

2. **OfficialProvider** (Compliance)
   - Resultado de fonte legal/oficial configurável
   - `source: ResultSource.OFFICIAL`
   - Requer `externalRef` (ex: certificado da loteria oficial)

> ⚠️ **IMPORTANTE:** NÃO implementamos scraping de fontes não autorizadas.  
> O `OfficialProvider` é um stub/interface para integração com fontes legais (loterias governamentais, etc).

---

## 🌐 API - Contratos REST

### 📄 Game Config

#### `GET /api/game/config`

**Resposta:**
```json
{
  "success": true,
  "data": {
    "rules": {
      "totalTeams": 25,
      "totalJerseys": 100,
      "jerseysPerTeam": 4,
      "drawCount": 5,
      "cutoffMinutes": 30
    },
    "payoutMultipliers": [
      { "modality": "TIME", "multiplier": 18, "name": "Time da Sorte", ...},
      ...
    ],
    "teams": [
      { "id": 1, "jerseys": [1,2,3,4] },
      ...
    ]
  }
}
```

---

### 🎰 Rodadas (Rounds)

#### `GET /api/rounds/next`

Retorna a próxima rodada aberta para apostas.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "cl9abc123xyz",
    "scheduledAt": "2026-01-22T14:00:00Z",
    "cutoffAt": "2026-01-22T13:30:00Z",
    "status": "OPEN",
    "canPlaceBet": true,
    "minutesToCutoff": 25
  }
}
```

#### `GET /api/rounds/:id`

Detalhes de uma rodada.

#### `GET /api/rounds/:id/result`

Retorna o resultado publicado (milhares, dezenas, times, etc).

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "cl9abc123xyz",
    "scheduledAt": "2026-01-22T14:00:00Z",
    "publishedAt": "2026-01-22T14:01:00Z",
    "status": "COMPLETED",
    "source": "ADMIN",
    "milhares": [1234, 5678, 9012, 3456, 7890],
    "jerseys": [34, 78, 12, 56, 90],
    "teams": [9, 20, 3, 14, 23],
    "totalBets": 120,
    "totalPrizePool": 5000.00,
    "totalWinners": 15,
    "totalPrizesPaid": 4500.00
  }
}
```

#### `POST /api/rounds` 🔒 (Admin)

Cria uma nova rodada.

**Body:**
```json
{
  "scheduledAt": "2026-01-23T14:00:00Z",
  "externalRef": "LOTERIA-RJ-2026-01-23"
}
```

#### `POST /api/rounds/:id/publish` 🔒 (Admin)

Publica o resultado de uma rodada.

**Body:**
```json
{
  "milhares": [1234, 5678, 9012, 3456, 7890],
  "source": "ADMIN",
  "externalRef": "LOTERIA-RJ-CERT-12345"
}
```

#### `POST /api/rounds/:id/cancel` 🔒 (Admin)

Cancela uma rodada e reembolsa apostas.

---

### 🎲 Apostas (Bets)

#### `POST /api/bets` 🔐

Cria uma nova aposta.

**Body (Exemplo - TIME):**
```json
{
  "drawId": "cl9abc123xyz",
  "modality": "TIME",
  "amount": 10.00,
  "teamIds": [5]
}
```

**Body (Exemplo - CAMISA):**
```json
{
  "drawId": "cl9abc123xyz",
  "modality": "CAMISA",
  "amount": 5.00,
  "jerseys": [34]
}
```

**Body (Exemplo - DUPLA):**
```json
{
  "drawId": "cl9abc123xyz",
  "modality": "DUPLA",
  "amount": 20.00,
  "teamIds": [3, 15]
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "bet_xyz789",
    "modality": "TIME",
    "amount": 10.00,
    "status": "PENDING",
    "multiplier": 18,
    "expectedReturn": 180.00,
    "createdAt": "2026-01-22T13:00:00Z"
  }
}
```

**Erros:**
- `409 Conflict` - Cutoff já passou, aposta bloqueada
- `400 Bad Request` - Dados inválidos (ex: time fora do range 1-25)
- `404 Not Found` - Rodada não encontrada
- `402 Payment Required` - Saldo insuficiente

#### `GET /api/bets?userId=xyz` 🔐

Lista apostas do usuário autenticado.

---

### 🔒 Admin - Gestão de Rodadas

#### `GET /api/admin/rounds`

Lista todas as rodadas (com filtros e paginação).

#### `GET /api/admin/rounds/:id/bets`

Lista todas as apostas de uma rodada específica.

---

## 🗄️ Banco de Dados (Prisma)

### Models Principais

#### `User`
```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  bets      Bet[]
  wallet    Wallet?
  ...
}
```

#### `Team`
```prisma
model Team {
  id      Int     @id @default(autoincrement())
  name    String  @unique
  jerseys Int[]   // [1,2,3,4]
  shield  String?
  color   String
  ...
}
```

#### `Draw` (Rodada)
```prisma
model Draw {
  id          String       @id @default(cuid())
  scheduledAt DateTime
  cutoffAt    DateTime
  publishedAt DateTime?
  executedAt  DateTime?
  status      DrawStatus   @default(SCHEDULED)
  source      ResultSource @default(ADMIN)
  externalRef String?
  
  milhares    Int[]
  jerseys     Int[]
  teams       Int[]
  
  bets        Bet[]
  settlements Settlement[]
  
  totalBets       Int   @default(0)
  totalPrizePool  Float @default(0)
  totalWinners    Int   @default(0)
  totalPrizesPaid Float @default(0)
  
  ...
}
```

#### `Bet`
```prisma
model Bet {
  id       String      @id @default(cuid())
  modality BetModality
  amount   Float
  status   BetStatus   @default(PENDING)
  jerseys  Int[]
  
  prize       Float?
  multiplier  Float?
  isWinner    Boolean @default(false)
  
  user       User   @relation(fields: [userId], references: [id])
  userId     String
  
  draw       Draw?   @relation(fields: [drawId], references: [id])
  drawId     String?
  
  teams      BetTeam[]
  settlement Settlement?
  
  ...
}
```

#### `Settlement` (Liquidação)
```prisma
model Settlement {
  id          String @id @default(cuid())
  betId       String @unique
  bet         Bet    @relation(fields: [betId], references: [id])
  drawId      String
  draw        Draw   @relation(fields: [drawId], references: [id])
  
  resultSnapshot Json    // Snapshot do resultado para auditoria
  isWinner       Boolean
  matchedItems   String[]
  prizeAmount    Float
  multiplier     Float
  
  computedAt DateTime @default(now())
  computedBy String?
  
  ...
}
```

---

## 🏗️ Arquitetura e Decisões

### Módulos Principais

```
src/
├── modules/
│   ├── game/              # Configuração e regras do jogo
│   │   ├── game-config.service.ts
│   │   ├── game.controller.ts
│   │   └── game.module.ts
│   │
│   ├── rounds/            # Gerenciamento de rodadas
│   │   ├── rounds.service.ts
│   │   ├── rounds.controller.ts
│   │   └── rounds.module.ts
│   │
│   ├── bets/              # Criação e validação de apostas
│   │   ├── bets.service.ts
│   │   ├── bets.controller.ts
│   │   └── bets.module.ts
│   │
│   ├── results/           # Cálculo de vencedores e payouts
│   │   ├── results.service.ts
│   │   └── results.module.ts
│   │
│   └── providers/         # ResultProviders plugáveis
│       ├── admin-provider.service.ts
│       └── official-provider.service.ts
```

### Padrões Utilizados

- **Strategy Pattern:** ResultProvider (Admin vs Official)
- **Service Layer:** Lógica de negócio isolada dos controllers
- **DTO Pattern:** Validação de entrada com class-validator
- **Repository Pattern:** Prisma ORM como camada de persistência
- **Guard Pattern:** Autenticação e autorização via NestJS Guards

---

## 🧪 Testes

### Testes Unit

Áriosários

Executar:
```bash
npm run test
```

### Cobertura

Módulos cobertos:
- ✅ `GameConfigService` - 100% (mapeamento dezena->time, milhares->resultado)
- ⏳ `RoundsService` - TODO
- ⏳ `BetsService` - TODO
- ⏳ `ResultsService` - TODO

---

## 📦 Configuração e Deploy

### Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/jogo_da_sorte_db?schema=public"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRATION="7d"

# Game Config (opcional, usa defaults se não definido)
GAME_CUTOFF_MINUTES=30
GAME_MIN_BET_AMOUNT=1.00

# Result Provider
RESULT_PROVIDER_TYPE="ADMIN" # ou "OFFICIAL"
OFFICIAL_PROVIDER_URL="https://api.loterias.gov.br" # se OFFICIAL
OFFICIAL_PROVIDER_API_KEY="your-api-key" # se OFFICIAL
```

### Docker Compose

```bash
# Iniciar infraestrutura (Postgres, MinIO, etc)
docker-compose -f docker/docker-compose.unified.yml up -d

# Rodar migrations
npx prisma migrate deploy

# Rodar seed (times)
npx prisma db seed

# Iniciar backend
npm run start:prod
```

### Healthcheck

```bash
GET /api/health
```

---

## 📚 Exemplos de Uso

### 1. Consultar configuração do jogo

```bash
curl http://localhost:3020/api/game/config
```

### 2. Criar uma rodada (Admin)

```bash
curl -X POST http://localhost:3020/api/rounds \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scheduledAt": "2026-01-23T14:00:00Z"
  }'
```

### 3. Fazer uma aposta (Usuário autenticado)

```bash
curl -X POST http://localhost:3020/api/bets \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "drawId": "cl9abc123xyz",
    "modality": "TIME",
    "amount": 10.00,
    "teamIds": [5]
  }'
```

### 4. Publicar resultado (Admin)

```bash
curl -X POST http://localhost:3020/api/rounds/cl9abc123xyz/publish \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "milhares": [1234, 5678, 9012, 3456, 7890],
    "source": "ADMIN"
  }'
```

### 5. Consultar resultado

```bash
curl http://localhost:3020/api/rounds/cl9abc123xyz/result
```

---

## 🔄 Fluxo Completo (Happy Path)

```
1. Admin cria rodada para 14:00
   └─> scheduledAt: 2026-01-22T14:00:00Z
   └─> cutoffAt:    2026-01-22T13:30:00Z
   └─> status: OPEN

2. Usuários fazem apostas (até 13:30)
   └─> POST /api/bets { modality: "TIME", teamIds: [5], amount: 10 }

3. Às 13:30 → Cutoff automático (cron job)
   └─> status: CLOSED
   └─> Novas apostas retornam 409 Conflict

4. Às 14:00 → Admin publica resultado
   └─> POST /api/rounds/:id/publish { milhares: [...] }
   └─> status: IN_PROGRESS

5. Sistema calcula vencedores
   └─> Processa todas as apostas da rodada
   └─> Cria Settlements
   └─> Atualiza carteiras dos vencedores

6. Rodada finalizada
   └─> status: COMPLETED
   └─> Estatísticas: totalBets, totalWinners, totalPrizesPaid
```

---

## 📞 Suporte e Manutenção

Para dúvidas, consulte:
- `/docs/CHANGELOG.md` - Histórico de versões
- `/docs/DECISOES.md` - Decisões de arquitetura (ADR)
- `/docs/API.md` - Documentação completa da API

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-22  
**Desenvolvido por:** Equipe Jogo da Sorte Engine
