# 📋 CHANGELOG - JOGO DA SORTE ENGINE

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.0.0] - 2026-01-22

### 🎉 Adicionado

#### Core do Jogo
- **GameConfigService**: Implementação completa das regras do jogo
  - Mapeamento dezena → time (00-99 → 1-25)
  - Processamento de milhares → resultado (dezenas + times)
  - Cálculo de cutoff automático (30 minutos)
  - Configuração de multiplicadores por modalidade
  - Testes unitários completos (100% de cobertura)

#### Módulo de Rodadas (Rounds)
- **RoundsService**: Gerenciamento completo de rodadas
  - Criação de rodadas com scheduledAt e cutoffAt
  - Bloqueio automático de apostas após cutoff
  - Publicação de resultados (milhares → dezenas → times)
  - Listagem e consulta de rodadas
  - Cancelamento de rodadas com reembolso

- **RoundsController**: Endpoints REST
  - `GET /api/rounds/next` - Próxima rodada disponível
  - `GET /api/rounds/:id` - Detalhes da rodada
  - `GET /api/rounds/:id/result` - Resultado publicado
  - `GET /api/rounds` - Listagem com paginação
  - `POST /api/rounds` - Criar rodada (Admin)
  - `POST /api/rounds/:id/publish` - Publicar resultado (Admin)
  - `POST /api/rounds/:id/cancel` - Cancelar rodada (Admin)

#### Banco de Dados
- **Migration**: `add_game_logic_fields`
  - Enum `ResultSource` (ADMIN, OFFICIAL, SYSTEM)
  - Enum `DrawStatus` atualizado (OPEN, CLOSED, etc)
  - Model `Draw` com campos:
    - `cutoffAt` (DateTime)
    - `publishedAt` (DateTime?)
    - `source` (ResultSource)
    - `externalRef` (String?)
  - Model `Settlement` (liquidação de apostas)
    - `resultSnapshot` (Json)
    - `isWinner` (Boolean)
    - `matchedItems` (String[])
    - `prizeAmount` (Float)
    - `multiplier` (Float)

#### Documentação
- **REGISTRO_DO_JOGO.md**: Documentação completa do sistema
  - Visão geral e domínio do jogo
  - Regras das 7 modalidades de aposta
  - Mecânica de sorteio (milhares → dezenas → times)
  - Regras de cutoff e bloqueio
  - Contratos da API REST (endpoints e payloads)
  - Modelos do banco de dados (Prisma)
  - Exemplos de uso completos
  - Fluxo end-to-end (happy path)

- **CHANGELOG.md**: Este arquivo
- **DECISOES.md**: Decisões de arquitetura (ADR)

#### Testes
- Testes unitários para `GameConfigService`:
  - ✅ Mapeamento dezena → time (incluindo caso especial 00)
  - ✅ Obtenção de dezenas por time
  - ✅ Extração de dezena/centena de milhar
  - ✅ Processamento completo de resultado
  - ✅ Cálculo de cutoff
  - ✅ Validação de horários de aposta

### 🔄 Modificado

#### Prisma Schema
- Atualizado `Draw` com novos campos de cutoff e source
- Adicionado relacionamento `Draw` ↔ `Settlement`
- Adicionado relacionamento `Bet` ↔ `Settlement`

#### App Module
- Registrado `GameModule`
- Registrado `RoundsModule`

### 🔧 Corrigido
- N/A (primeira versão)

### 🗑️ Removido
- N/A (primeira versão)

### ⚠️ Pendente (TODO)

#### Módulos a Implementar
- [ ] **BetsModule**: Criação e validação de apostas por modalidade
- [ ] **ResultsModule**: Cálculo automático de vencedores
- [ ] **AdminModule**: Dashboard e gestão avançada
- [ ] **ResultProviderModule**: Providers plugáveis (Admin + Official)

#### Integrações
- [ ] Cron job para fechar rodadas automaticamente no cutoff
- [ ] Worker/Queue para processamento assíncrono de resultados
- [ ] Webhook para notificar vencedores

#### Testes
- [ ] Testes unitários para `RoundsService`
- [ ] Testes unitários para `BetsService`
- [ ] Testes unitários para `ResultsService`
- [ ] Testes de integração E2E

#### DevOps
- [ ] Docker Compose production-ready
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring (Prometheus + Grafana)
- [ ] Logs estruturados (Winston/Pino)

---

## [Planejado] - Próximas Versões

### [1.1.0] - Q1 2026
- Implementação completa de BetsModule
- Implementação de ResultsModule com cálculo de vencedores
- Testes E2E automatizados
- Dashboard administrativo

### [1.2.0] - Q2 2026
- Result Provider Official (integração com fonte legal)
- Sistema de notificações (email + push)
- Relatórios e analytics avançados
- Auditoria completa (blockchain?)

### [2.0.0] - Q3 2026
- Multi-tenancy (suporte a múltiplas plataformas)
- API GraphQL
- Mobile app (React Native)
- Cashback e gamificação

---

## Versionamento

- **MAJOR** (X.0.0): Mudanças incompatíveis na API
- **MINOR** (0.X.0): Novos recursos compatíveis
- **PATCH** (0.0.X): Correções de bugs

---

**Mantido por:** Equipe Jogo da Sorte Engine  
**Última atualização:** 2026-01-22
