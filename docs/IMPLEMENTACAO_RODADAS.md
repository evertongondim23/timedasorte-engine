# 🎰 Implementação de Rodadas com Categorias e Grade Fixa

## ✅ O Que Foi Implementado

### 1. **Schema do Banco de Dados**

#### **Novos Enums:**
- `RoundCategory`: PTM, PPT, PT, PTV, PTN, COR
- `DrawStatus`: Adicionado `PENDING_RESULT` e `PUBLISHED`

#### **Model Draw Atualizado:**
- Campo `category: RoundCategory` (obrigatório)
- Índices para otimização de consultas

**Migration criada:** `20260126140000_add_round_category`

---

### 2. **RoundScheduleService** ✅

Serviço responsável por:
- **Gerar rodadas automaticamente** baseado na grade fixa
- **Calcular horários** (scheduledAt) para cada categoria
- **Atualizar status** das rodadas automaticamente
- **Buscar rodadas disponíveis** para o frontend

**Grade Fixa (Seg-Sáb):**

```typescript
PTM: 11:00
PPT: 14:00
PT:  16:00
PTV: 18:00
PTN: 21:00
COR: 00:30 (próximo dia)
```

**Métodos principais:**
- `generateRoundsForDate(date)` - Gera rodadas para um dia
- `generateRoundsForNextDays(days)` - Gera rodadas para N dias
- `getNextAvailableRound()` - Próxima rodada OPEN
- `getAvailableRoundsInfo()` - Info completa para frontend
- `updateRoundsStatus()` - Atualiza status automaticamente

---

### 3. **OJogoDoBichoProvider** ✅

Provider para buscar resultados do site:
- **URL:** https://www.ojogodobicho.com/deu_no_poste.htm
- **Parsing:** Extrai milhares e dezenas da tabela HTML
- **Validação:** Garante 5 milhares e 5 dezenas por categoria

**Formato esperado:**

```
| PPT | PTM     | PT      | PTV     | PTN     | COR    |
| 1   | 0199-25 | 4681-21 | 6233-9  | 8419-5  | 0000-0 |
```

**Métodos:**
- `getLatestResult()` - Busca resultado mais recente
- `getHistoricalResult(date)` - Busca resultado por data

---

### 4. **Endpoints Atualizados**

#### **GET /api/rounds/available** (NOVO)

Retorna:

```json
{
  "available": {
    "id": "...",
    "category": "PTM",
    "scheduledAt": "2026-01-26T11:00:00Z",
    "cutoffAt": "2026-01-26T10:30:00Z",
    "canPlaceBet": true,
    "minutesToCutoff": 15
  },
  "nextClosed": {
    "id": "...",
    "category": "PPT",
    "status": "PENDING_RESULT",
    "minutesToResult": 30
  },
  "nextScheduled": {
    "id": "...",
    "category": "PT",
    "minutesUntilOpen": 120
  }
}
```

#### **GET /api/rounds/next** (ATUALIZADO)

Agora usa `RoundScheduleService.getNextAvailableRound()`

---

## 🔄 Lógica de Status

### **Transições Automáticas:**

```
SCHEDULED → OPEN → CLOSED → PENDING_RESULT → PUBLISHED
```

**Regras:**
1. **OPEN**: `now < cutoffAt`
2. **CLOSED**: `cutoffAt <= now < scheduledAt`
3. **PENDING_RESULT**: `scheduledAt <= now` e `publishedAt === null`
4. **PUBLISHED**: Quando resultado é publicado

---

## 📋 Próximos Passos

### **1. Instalar Dependências**

```bash
npm install cheerio
npm install --save-dev @types/cheerio
```

### **2. Aplicar Migration**

```bash
npx prisma migrate deploy
# ou
npx prisma migrate dev
```

### **3. Gerar Rodadas Iniciais**

Criar um script ou endpoint admin para gerar rodadas:

```typescript
await scheduleService.generateRoundsForNextDays(30); // Próximos 30 dias
```

### **4. Cron Job para Atualizar Status**

```typescript
@Cron('*/5 * * * *') // A cada 5 minutos
async updateRoundsStatus() {
  await this.scheduleService.updateRoundsStatus();
}
```

### **5. Integrar Provider no RoundsService**

Atualizar `publishResult()` para usar `OJogoDoBichoProvider` quando `source === OFFICIAL`

---

## 🎯 Como Usar no Frontend

### **Buscar Rodada Disponível:**

```typescript
const { available, nextClosed, nextScheduled } = await api.get('/rounds/available');

if (available) {
  // Mostrar: "Aposte agora! Fecha em X minutos"
} else if (nextClosed) {
  // Mostrar: "Aguardando resultado... em X minutos"
} else if (nextScheduled) {
  // Mostrar: "Próxima rodada abre em X minutos"
}
```

### **Exibir Categoria:**

```typescript
const categoryLabels = {
  PTM: 'Manhã',
  PPT: 'Tarde 1',
  PT: 'Tarde 2',
  PTV: 'Vespertino',
  PTN: 'Noite',
  COR: 'Corujão',
};
```

---

## 🐛 Correções Necessárias

1. **RoundScheduleService**: Corrigir import de `GameConfigService`
2. **OJogoDoBichoProvider**: Instalar `cheerio` e `@types/cheerio`
3. **RoundsService**: Atualizar para incluir `category` ao criar rodadas
4. **AdminController**: Atualizar DTOs para incluir `category`

---

## 📝 Notas

- **Domingo**: Não gera rodadas (conforme regra do jogo)
- **COR**: 00:30 do próximo dia (meia-noite e meia)
- **Cutoff**: Sempre 30 minutos antes do `scheduledAt`
- **Status**: Atualizado automaticamente via `updateRoundsStatus()`

