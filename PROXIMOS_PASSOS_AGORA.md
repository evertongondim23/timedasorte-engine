# 🎯 Próximos Passos - Guia Rápido

## ✅ O Que Já Está Pronto

- ✅ Schema do Prisma atualizado (RoundCategory, PENDING_RESULT)
- ✅ Migration criada
- ✅ RoundScheduleService implementado
- ✅ OJogoDoBichoProvider implementado
- ✅ Cron jobs configurados
- ✅ Endpoints criados (`/rounds/available`)
- ✅ `axios` adicionado ao package.json

---

## 📋 Passos Imediatos (Ordem de Execução)

### **PASSO 1: Instalar Dependências** ⚡

```bash
cd /Users/everton/jogo-da-sorte-engine

# Instalar todas as dependências necessárias
npm install axios cheerio @types/cheerio @nestjs/schedule
```

**Status:** `axios` já está no package.json, mas precisa instalar.

---

### **PASSO 2: Aplicar Migration** 🗄️

```bash
# Aplicar a migration que adiciona RoundCategory e PENDING_RESULT
npx prisma migrate deploy

# OU se estiver em desenvolvimento:
npx prisma migrate dev
```

**O que faz:** Adiciona o enum `RoundCategory` e o campo `category` na tabela `Draw`.

---

### **PASSO 3: Gerar Prisma Client** 🔧

```bash
# Gerar o Prisma Client com os novos tipos
npx prisma generate
```

**Por que é importante:** Sem isso, o TypeScript não reconhece `RoundCategory` e `PENDING_RESULT`.

---

### **PASSO 4: Verificar Compilação** ✅

```bash
# Compilar o projeto para verificar erros
npm run build
```

**Se houver erros:** Verifique a seção "Possíveis Problemas" abaixo.

---

### **PASSO 5: Criar Endpoint para Gerar Rodadas** 🎲

Crie um endpoint admin para gerar rodadas iniciais:

**Opção A: Adicionar no AdminController**

```typescript
// src/modules/admin/admin.controller.ts

@Post('rounds/generate')
@RequiredRoles(Roles.ADMIN)
async generateRounds(@Query('days') days: string = '7') {
  const daysNum = parseInt(days, 10);
  await this.roundScheduleService.generateRoundsForNextDays(daysNum);
  return { 
    message: `Rodadas geradas para os próximos ${daysNum} dias`,
    days: daysNum 
  };
}
```

**Opção B: Script separado**

```typescript
// scripts/generate-initial-rounds.ts
import { PrismaClient } from '@prisma/client';
import { RoundScheduleService } from '../src/modules/rounds/round-schedule.service';

// Executar: ts-node scripts/generate-initial-rounds.ts
```

---

### **PASSO 6: Testar o Sistema** 🧪

#### **6.1. Gerar Rodadas Iniciais**

```bash
# Via endpoint (se criado)
curl -X POST http://localhost:3000/api/admin/rounds/generate?days=7 \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"

# Ou via script (se criado)
npm run generate:rounds
```

#### **6.2. Testar Endpoint de Rodadas Disponíveis**

```bash
curl http://localhost:3000/api/rounds/available
```

**Resposta esperada:**
```json
{
  "available": {
    "id": "...",
    "category": "PTM",
    "scheduledAt": "2026-01-27T11:00:00Z",
    "cutoffAt": "2026-01-27T10:30:00Z",
    "canPlaceBet": true,
    "minutesToCutoff": 45
  },
  "nextClosed": null,
  "nextScheduled": { ... }
}
```

#### **6.3. Verificar Cron Jobs**

Inicie o servidor e observe os logs:

```bash
npm run start:dev
```

**Logs esperados (a cada 5 minutos):**
```
[RoundsSchedulerService] 🔄 Atualizando status das rodadas...
[RoundsSchedulerService] ✅ Status das rodadas atualizado com sucesso
```

---

## 🔧 Configurações Adicionais

### **Variáveis de Ambiente (.env)**

Adicione ao seu `.env`:

```env
# Timezone para cron jobs (opcional, padrão é UTC)
TZ=America/Sao_Paulo
```

---

## 🐛 Solução de Problemas

### **Erro: "Cannot find module 'axios'"**
```bash
npm install axios
```

### **Erro: "Cannot find module 'cheerio'"**
```bash
npm install cheerio @types/cheerio
```

### **Erro: "Module '@prisma/client' has no exported member 'RoundCategory'"**
```bash
npx prisma generate
```

### **Erro: "Cannot find module '@nestjs/schedule'"**
```bash
npm install @nestjs/schedule
```

### **Migration não aplica**
```bash
# Verificar status das migrations
npx prisma migrate status

# Se necessário, resetar (CUIDADO: apaga dados!)
npx prisma migrate reset
```

### **Cron Jobs não executam**
1. Verifique se `ScheduleModule.forRoot()` está no `app.module.ts` ✅ (já está)
2. Verifique se o servidor está rodando
3. Verifique os logs do servidor

---

## 📊 Checklist Rápido

Execute na ordem:

- [ ] **1.** `npm install axios cheerio @types/cheerio @nestjs/schedule`
- [ ] **2.** `npx prisma migrate deploy` (ou `dev`)
- [ ] **3.** `npx prisma generate`
- [ ] **4.** `npm run build` (verificar erros)
- [ ] **5.** Criar endpoint/script para gerar rodadas
- [ ] **6.** `npm run start:dev` (iniciar servidor)
- [ ] **7.** Gerar rodadas iniciais (via endpoint ou script)
- [ ] **8.** Testar `GET /api/rounds/available`
- [ ] **9.** Verificar logs dos cron jobs

---

## 🚀 Após Completar os Passos

### **O Que Estará Funcionando:**

1. ✅ **Geração automática de rodadas** (diária e semanal)
2. ✅ **Atualização automática de status** (a cada 5 minutos)
3. ✅ **Endpoint `/rounds/available`** para o frontend
4. ✅ **Provider OJogoDoBicho** pronto para buscar resultados
5. ✅ **Cron jobs** configurados e funcionando

### **Próximas Melhorias (Opcional):**

1. Integrar frontend com `/rounds/available`
2. Implementar busca automática de resultados do site
3. Adicionar notificações quando rodada está prestes a fechar
4. Criar dashboard admin para gerenciar rodadas
5. Adicionar cache de resultados do site

---

## 📞 Comandos Úteis

```bash
# Ver rodadas no banco
npx prisma studio

# Ver logs em tempo real
npm run start:dev

# Verificar status das migrations
npx prisma migrate status

# Resetar banco (CUIDADO!)
npx prisma migrate reset
```

---

**🎯 Foco Agora:** Execute os passos 1-4 primeiro, depois teste o sistema!
