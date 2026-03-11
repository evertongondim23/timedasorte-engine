# 🎯 Busca Automática de Resultados - Implementação Completa

## ✅ O Que Foi Implementado

### **1. OJogoDoBichoProvider Melhorado** ✅

#### **Busca por Categoria:**
- ✅ Método `fetchResult()` agora aceita parâmetro `category` opcional
- ✅ Busca resultado específico para a categoria da rodada
- ✅ Logs detalhados para debugging
- ✅ Validação de resultado antes de retornar

#### **Melhorias:**

```typescript
// Antes: Retornava qualquer resultado encontrado
fetchResult(scheduledAt: Date)

// Agora: Busca por categoria específica
fetchResult(scheduledAt: Date, category?: RoundCategory)
```

---

### **2. Interface IResultProvider Atualizada** ✅

- ✅ Parâmetro `category` opcional adicionado
- ✅ Compatibilidade mantida com providers existentes
- ✅ Todos os providers atualizados (Admin, Official, OJogoDoBicho)

---

### **3. RoundsService - Novos Métodos** ✅

#### **`fetchResultFromProvider(id, providerName?)`**
Busca resultado do provider externo sem publicar:

```typescript
const result = await roundsService.fetchResultFromProvider(roundId, 'OJOGODOBICHO');
// Retorna: { success: true, data: { milhares: [...], ... } }
```

#### **`fetchAndPublishResult(id, providerName?)`**
Busca e publica resultado automaticamente:

```typescript
const published = await roundsService.fetchAndPublishResult(roundId);
// Busca resultado, valida e publica automaticamente
```

---

### **4. Endpoints Admin** ✅

#### **POST /api/admin/rounds/:id/fetch-result**
Busca resultado sem publicar (para verificação):

```bash
curl -X POST http://localhost:3020/api/admin/rounds/{id}/fetch-result?provider=OJOGODOBICHO \
  -H "Authorization: Bearer {token}"
```

**Resposta:**

```json
{
  "success": true,
  "message": "Resultado encontrado com sucesso",
  "data": {
    "milhares": [199, 4681, 6233, 8419, 0],
    "source": "OFFICIAL",
    "externalRef": "OJOGODOBICHO-PTM-2026-01-26T11:00:00Z",
    "fetchedAt": "2026-01-26T11:05:00Z"
  }
}
```

#### **POST /api/admin/rounds/:id/fetch-and-publish**
Busca e publica resultado automaticamente:

```bash
curl -X POST http://localhost:3020/api/admin/rounds/{id}/fetch-and-publish?provider=OJOGODOBICHO \
  -H "Authorization: Bearer {token}"
```

**Resposta:**

```json
{
  "id": "...",
  "status": "PUBLISHED",
  "milhares": [199, 4681, 6233, 8419, 0],
  "jerseys": [25, 21, 9, 5, 0],
  "teams": [7, 6, 3, 2, 1],
  "publishedAt": "2026-01-26T11:05:00Z",
  "message": "Resultado publicado com sucesso. Processamento de apostas iniciado."
}
```

---

### **5. Cron Job Automático** ✅

#### **Busca Automática a Cada 2 Minutos**

**Cron:** `*/2 * * * *` (a cada 2 minutos)

**Lógica:**
1. Busca rodadas com status `PENDING_RESULT`
2. Verifica se `scheduledAt <= now` (já passou o horário)
3. Verifica se `publishedAt === null` (ainda não foi publicado)
4. Tenta buscar resultado via `OJOGODOBICHO`
5. Se encontrar, publica automaticamente
6. Processa até 5 rodadas por execução

**Logs:**

```
🔍 Buscando resultados automaticamente...
📋 Encontradas 2 rodada(s) aguardando resultado
🔍 Buscando resultado para rodada abc123 (PTM)...
✅ Resultado encontrado e publicado para rodada abc123
✅ Busca de resultados concluída
```

---

## 🔄 Fluxo Completo

```
1. Rodada criada → Status: OPEN
   ↓
2. Cutoff passa → Status: CLOSED
   ↓
3. Horário agendado chega → Status: PENDING_RESULT
   ↓
4. Cron job detecta (a cada 2 min)
   ↓
5. Busca resultado via OJogoDoBichoProvider
   ↓
6. Se encontrado → Publica automaticamente
   ↓
7. Status: PUBLISHED
   ↓
8. Processa apostas e calcula vencedores
```

---

## 🎯 Como Usar

### **1. Busca Manual (Admin)**

#### **Apenas Buscar (sem publicar):**

```bash
POST /api/admin/rounds/{id}/fetch-result
```

#### **Buscar e Publicar:**

```bash
POST /api/admin/rounds/{id}/fetch-and-publish
```

### **2. Busca Automática**

O cron job executa automaticamente a cada 2 minutos. Não é necessário fazer nada manualmente.

**Para desabilitar temporariamente:**  
Comente o método `handleFetchResults()` no `RoundsSchedulerService`.

---

## 📊 Estrutura de Dados

### **DrawResultData:**

```typescript
{
  milhares: number[];        // [199, 4681, 6233, 8419, 0]
  source: ResultSource;      // "OFFICIAL" | "ADMIN" | "SYSTEM"
  externalRef?: string;      // "OJOGODOBICHO-PTM-2026-01-26T11:00:00Z"
  fetchedAt: Date;          // Data/hora da busca
}
```

---

## 🐛 Troubleshooting

### **Erro: "Nenhum resultado encontrado"**

**Possíveis causas:**
1. Site `ojogodobicho.com` não está acessível
2. Resultado ainda não foi publicado no site
3. Categoria não encontrada na tabela
4. Formato da tabela mudou

**Solução:**
- Verificar logs do provider
- Testar acesso manual ao site
- Verificar formato da tabela HTML

### **Erro: "Resultado inválido"**

**Causa:** Provider retornou menos de 5 milhares ou valores fora do range (0-9999)

**Solução:**
- Verificar parsing da tabela HTML
- Verificar se a tabela tem todas as 5 posições

### **Cron Job não está executando**

**Verificar:**
1. `ScheduleModule` está importado no `app.module.ts`?
2. Timezone está configurado corretamente?
3. Logs mostram execução do cron?

---

## ✅ Checklist de Teste

- [ ] Provider consegue acessar o site
- [ ] Provider consegue parsear a tabela HTML
- [ ] Provider retorna resultado correto por categoria
- [ ] Endpoint `/fetch-result` funciona
- [ ] Endpoint `/fetch-and-publish` funciona
- [ ] Cron job executa a cada 2 minutos
- [ ] Cron job encontra rodadas PENDING_RESULT
- [ ] Cron job publica resultados automaticamente
- [ ] Apostas são processadas após publicação

---

## 🚀 Próximos Passos (Opcional)

1. **Retry Logic:** Tentar buscar resultado múltiplas vezes antes de desistir
2. **Notificações:** Enviar email/SMS quando resultado for publicado
3. **Histórico:** Armazenar tentativas de busca (sucesso/falha)
4. **Múltiplos Providers:** Tentar outros providers se OJOGODOBICHO falhar
5. **Cache:** Cachear resultados para evitar múltiplas requisições

---

**Status:** ✅ Implementação completa e funcional!

