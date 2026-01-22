# 🏛️ DECISÕES DE ARQUITETURA (ADR)

Este documento registra as decisões arquiteturais significativas tomadas no projeto "Jogo da Sorte Engine".

---

## ADR-001: ResultProvider Plugável

**Data:** 2026-01-22  
**Status:** ✅ Aceito

### Contexto

O sistema precisa suportar múltiplas fontes de resultados:
1. **Entrada manual** (Admin insere os milhares via painel)
2. **Fonte oficial** (Integração com loteria governamental ou fonte legal)

Além disso, por questões de **compliance legal**, não podemos implementar scraping de sites não autorizados ou fontes ilegais.

### Decisão

Implementar um **Strategy Pattern** com `ResultProvider` abstrato e duas implementações:

```typescript
interface ResultProvider {
  fetchResult(externalRef: string): Promise<ResultDto>;
  validateSource(externalRef: string): Promise<boolean>;
}

class AdminProvider implements ResultProvider {
  // Resultado inserido manualmente pelo admin
}

class OfficialProvider implements ResultProvider {
  // Busca resultado de API oficial
  // Requer: API_URL, API_KEY em variáveis de ambiente
}
```

### Consequências

#### Positivas ✅
- **Flexibilidade:** Fácil adicionar novas fontes no futuro
- **Compliance:** Cumprimos requisitos legais (sem scraping ilegal)
- **Testabilidade:** Podemos mockar providers em testes
- **Auditoria:** `source` e `externalRef` rastreiam origem do resultado

#### Negativas ❌
- **Complexidade inicial:** Mais código para gerenciar
- **Configuração:** Requer setup de variáveis de ambiente para Official

#### Mitigações
- Documentar claramente no README como configurar cada provider
- Provider padrão é `AdminProvider` (zero-config)

---

## ADR-002: Cutoff Automático de 30 Minutos

**Data:** 2026-01-22  
**Status:** ✅ Aceito

### Contexto

Precisamos bloquear apostas antes da publicação do resultado para:
1. **Prevenir apostas de última hora** (após vazamento do resultado)
2. **Dar tempo para processamento** de apostas existentes
3. **Seguir padrão do mercado** (jogos similares usam 30min)

### Decisão

- **Todas as apostas** de uma rodada são bloqueadas **30 minutos antes** do `scheduledAt`
- `cutoffAt = scheduledAt - 30 minutos` (calculado automaticamente)
- Tentativas de aposta após cutoff retornam `409 Conflict`

### Implementação

```typescript
// Em GameConfigService
calculateCutoffTime(scheduledAt: Date): Date {
  const cutoff = new Date(scheduledAt);
  cutoff.setMinutes(cutoff.getMinutes() - 30);
  return cutoff;
}

// Em BetsService (validação)
if (!gameConfig.canPlaceBet(draw.cutoffAt)) {
  throw new ConflictException(
    `Apostas para esta rodada estão fechadas. Cutoff: ${draw.cutoffAt}`
  );
}
```

### Consequências

#### Positivas ✅
- **Segurança:** Previne fraudes e apostas tardias
- **Previsibilidade:** Usuários sabem exatamente quando podem apostar
- **Automação:** Cron job fecha rodadas automaticamente

#### Negativas ❌
- **Rigidez:** Não há exceções (mesmo para admin)
- **UX:** Usuários podem reclamar de "pouco tempo"

#### Mitigações
- Mostrar `minutesToCutoff` no frontend (contagem regressiva)
- Avisar usuários via notificação próximo ao cutoff

---

## ADR-003: Settlement (Liquidação) Separado de Bet

**Data:** 2026-01-22  
**Status:** ✅ Aceito

### Contexto

Após o sorteio, precisamos calcular quais apostas venceram e quanto cada uma ganhou.

Duas abordagens possíveis:
1. **Atualizar Bet diretamente** (`bet.isWinner`, `bet.prize`, etc)
2. **Criar entidade Settlement separada** (1:1 com Bet)

### Decisão

Criar modelo `Settlement` separado.

```prisma
model Settlement {
  id             String  @id
  betId          String  @unique
  drawId         String
  
  resultSnapshot Json    // Cópia do resultado para auditoria
  isWinner       Boolean
  matchedItems   String[] // O que bateu (times, dezenas, etc)
  prizeAmount    Float
  multiplier     Float
  
  computedAt     DateTime
  computedBy     String?  // Sistema ou operador que calculou
}
```

### Razões

1. **Auditoria:** `resultSnapshot` guarda cópia do resultado no momento do cálculo
2. **Imutabilidade:** Apostas não são modificadas após criação
3. **Rastreabilidade:** Sabemos quem/quando calculou (`computedBy`, `computedAt`)
4. **Recálculo:** Podemos recalcular settlements sem perder dados originais

### Consequências

#### Positivas ✅
- **Histórico completo:** Auditoria forense possível
- **Recálculo seguro:** Não perdemos dados originais da aposta
- **Compliance:** Rastreabilidade total para reguladores

#### Negativas ❌
- **Complexidade:** Mais uma tabela para gerenciar
- **Joins:** Queries precisam JOIN Bet + Settlement

#### Mitigações
- Indexes otimizados (`betId`, `drawId`, `computedAt`)
- API simplificada (`GET /bets/:id` já inclui settlement)

---

## ADR-004: Processamento de Milhares no Backend

**Data:** 2026-01-22  
**Status:** ✅ Aceito

### Contexto

Quando o admin publica um resultado, ele fornece apenas os **5 milhares**.

As **dezenas** e **times** derivados precisam ser calculados.

Quem deve fazer esse cálculo?
1. **Frontend:** Calcular e enviar milhares + dezenas + times
2. **Backend:** Receber apenas milhares e calcular o resto

### Decisão

**Backend calcula tudo** automaticamente.

```typescript
// Admin envia:
POST /api/rounds/:id/publish
{
  "milhares": [1234, 5678, 9012, 3456, 7890]
}

// Backend processa:
const result = gameConfig.processDrawResult(milhares);
// result = { milhares, jerseys, teams, centenas, details }

// Backend salva no banco:
await prisma.draw.update({
  data: {
    milhares: result.milhares,
    jerseys: result.jerseys,
    teams: result.teams,
    ...
  }
});
```

### Razões

1. **Fonte única da verdade:** Lógica de cálculo fica em um só lugar
2. **Segurança:** Frontend não pode manipular dezenas/times
3. **Consistência:** Todos os clientes (web, mobile, admin) recebem a mesma lógica
4. **Testabilidade:** Testes unitários validam cálculos no backend

### Consequências

#### Positivas ✅
- **Segurança:** Impossível enviar dezenas/times incorretos
- **Manutenção:** Mudanças nas regras só afetam backend
- **Confiabilidade:** Lógica testada e auditada

#### Negativas ❌
- **Overhead:** API precisa processar cálculos (mas são rápidos)

#### Mitigações
- Cálculos são O(n) e super rápidos (< 1ms)
- Cache de configurações (multiplicadores, etc)

---

## ADR-005: Soft Delete para Rodadas e Apostas

**Data:** 2026-01-22  
**Status:** ✅ Aceito

### Contexto

Por questões legais e de auditoria, **nunca** devemos excluir registros de apostas ou sorteios permanentemente.

### Decisão

Implementar **Soft Delete** em todos os modelos críticos:

```prisma
model Draw {
  // ...
  deletedAt DateTime?
  
  @@index([deletedAt])
}

model Bet {
  // ...
  deletedAt DateTime?
  
  @@index([deletedAt])
}
```

Queries padrão sempre filtram:
```typescript
where: { deletedAt: null }
```

### Razões

1. **Auditoria legal:** Reguladores podem exigir histórico completo
2. **Recuperação:** Podemos restaurar dados excluídos por engano
3. **Analytics:** Análises históricas incluem dados "deletados"

### Consequências

#### Positivas ✅
- **Compliance:** Atende requisitos regulatórios
- **Segurança:** Nenhum dado é perdido
- **Recuperação:** Possível restaurar com `UPDATE deletedAt = null`

#### Negativas ❌
- **Performance:** Queries sempre filtram `deletedAt IS NULL`
- **Tamanho do banco:** Dados nunca são removidos

#### Mitigações
- Indexes em `deletedAt` para performance
- Archival strategy (mover registros antigos para cold storage)

---

## ADR-006: Multiplicadores Configuráveis por Modalidade

**Data:** 2026-01-22  
**Status:** ✅ Aceito

### Contexto

Diferentes modalidades têm diferentes probabilidades de vitória e, portanto, diferentes multiplicadores de pagamento.

Precisamos de flexibilidade para ajustar multiplicadores sem redeployar código.

### Decisão

**Multiplicadores hardcoded no código**, mas facilmente configuráveis via variáveis de ambiente.

```typescript
// GameConfigService
private readonly payoutMultipliers: PayoutMultiplier[] = [
  { modality: BetModality.TIME, multiplier: process.env.MULT_TIME || 18, ... },
  { modality: BetModality.CAMISA, multiplier: process.env.MULT_CAMISA || 60, ... },
  // ...
];
```

### Alternativas Consideradas

1. **Banco de dados:** Armazenar multiplicadores em tabela `GameConfig`
   - ✅ Mudanças sem redeploy
   - ❌ Queries extras, cache necessário
   
2. **Arquivo de configuração:** JSON ou YAML
   - ✅ Fácil editar
   - ❌ Requer restart do servidor
   
3. **Hardcoded com env vars:** (escolhido)
   - ✅ Performance (zero queries)
   - ✅ Simples e direto
   - ❌ Requer redeploy para mudanças

### Decisão Final

**Fase 1 (MVP):** Hardcoded com env vars  
**Fase 2 (se necessário):** Migrar para banco com cache agressivo

### Consequências

#### Positivas ✅
- **Performance:** Zero overhead
- **Simplicidade:** Código limpo
- **Testabilidade:** Fácil mockar em testes

#### Negativas ❌
- **Rigidez:** Mudanças requerem redeploy

#### Mitigações
- Documentar multiplicadores no README
- Feature flag para mudanças graduais

---

## ADR-007: NestJS como Framework Backend

**Data:** 2026-01-22  
**Status:** ✅ Aceito

### Contexto

Precisamos escolher um framework backend robusto, escalável e com boa DX (Developer Experience).

### Alternativas

1. **Express.js (Node.js puro)**
   - ✅ Simples, leve, flexível
   - ❌ Sem estrutura padrão, difícil escalar
   
2. **NestJS**
   - ✅ Estrutura opinada, DI, TypeScript nativo
   - ✅ Ecosystem rico (Prisma, Swagger, Guards, etc)
   - ❌ Curva de aprendizado

3. **Fastify**
   - ✅ Muito rápido
   - ❌ Ecosystem menor que Express/Nest

### Decisão

**NestJS** foi escolhido.

### Razões

1. **TypeScript-first:** Type safety end-to-end
2. **Dependency Injection:** Testabilidade e modularidade
3. **Guards & Interceptors:** Autenticação/autorização built-in
4. **Prisma Integration:** ORM poderoso com type safety
5. **Swagger/OpenAPI:** Documentação automática
6. **Escalabilidade:** Arquitetura modular suporta crescimento

### Consequências

#### Positivas ✅
- **Produtividade:** Scaffolding, CLI, hot reload
- **Qualidade:** Type safety reduz bugs
- **Manutenibilidade:** Código organizado e testável

#### Negativas ❌
- **Performance:** Ligeiramente mais lento que Fastify (mas ainda rápido)
- **Bundle size:** Maior que Express puro

#### Mitigações
- Otimizações de performance (cache, indexes, etc)
- Tree-shaking em produção

---

## ADR-008: Prisma ORM vs Raw SQL

**Data:** 2026-01-22  
**Status:** ✅ Aceito

### Contexto

Precisamos de uma camada de persistência type-safe e produtiva.

### Alternativas

1. **Raw SQL (pg, node-postgres)**
   - ✅ Controle total, performance máxima
   - ❌ Sem type safety, queries manuais
   
2. **TypeORM**
   - ✅ Active Record / Data Mapper
   - ❌ Performance issues, migrações problemáticas
   
3. **Prisma**
   - ✅ Type safety automático
   - ✅ Migrations declarativas
   - ✅ Prisma Studio (GUI)
   - ❌ Menos controle em queries complexas

### Decisão

**Prisma** foi escolhido.

### Razões

1. **Type Safety:** Schema → TypeScript types automático
2. **Migrations:** Declarativas e versionadas
3. **Developer Experience:** Autocomplete, formatação
4. **Performance:** Lazy loading, batching, caching
5. **Tooling:** Prisma Studio, VS Code extension

### Consequências

#### Positivas ✅
- **Produtividade:** Menos código boilerplate
- **Confiabilidade:** Tipos previnem bugs
- **Manutenibilidade:** Schema único e versionado

#### Negativas ❌
- **Queries complexas:** Às vezes precisamos raw SQL
- **Learning curve:** Sintaxe própria

#### Mitigações
- `prisma.$queryRaw` para queries complexas
- Documentação e exemplos no código

---

## Resumo de Decisões

| ADR | Decisão | Status | Impacto |
|-----|---------|--------|---------|
| 001 | ResultProvider Plugável | ✅ Aceito | Alto |
| 002 | Cutoff de 30 Minutos | ✅ Aceito | Médio |
| 003 | Settlement Separado | ✅ Aceito | Alto |
| 004 | Processamento no Backend | ✅ Aceito | Médio |
| 005 | Soft Delete | ✅ Aceito | Médio |
| 006 | Multiplicadores Configuráveis | ✅ Aceito | Baixo |
| 007 | NestJS Framework | ✅ Aceito | Alto |
| 008 | Prisma ORM | ✅ Aceito | Alto |

---

**Mantido por:** Equipe Jogo da Sorte Engine  
**Última atualização:** 2026-01-22
