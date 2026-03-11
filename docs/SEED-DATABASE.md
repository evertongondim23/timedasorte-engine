# 🌱 Guia de Seed do Banco de Dados

## 📋 O que é Seed?

Seed é o processo de popular o banco de dados com dados iniciais necessários para o funcionamento da aplicação.

---

## 🎲 Seeds Disponíveis

### 1. **Teams Seed** (25 Times Brasileiros)

Popula o banco com os 25 times/animais tradicionais do jogo:

- Avestruz 🦤 (01-04)
- Águia 🦅 (05-08)
- Burro 🫏 (09-12)
- Borboleta 🦋 (13-16)
- Cachorro 🐕 (17-20)
- Cabra 🐐 (21-24)
- Carneiro 🐑 (25-28)
- Camelo 🐪 (29-32)
- Cobra 🐍 (33-36)
- Coelho 🐰 (37-40)
- Cavalo 🐴 (41-44)
- Elefante 🐘 (45-48)
- Galo 🐓 (49-52)
- Gato 🐱 (53-56)
- Jacaré 🐊 (57-60)
- Leão 🦁 (61-64)
- Macaco 🐵 (65-68)
- Porco 🐷 (69-72)
- Pavão 🦚 (73-76)
- Peru 🦃 (77-80)
- Touro 🐂 (81-84)
- Tigre 🐯 (85-88)
- Urso 🐻 (89-92)
- Veado 🦌 (93-96)
- Vaca 🐮 (97-00)

---

## 🚀 Como Executar Seeds

### ⚠️ Pré-requisitos

1. PostgreSQL rodando
2. Migrations executadas
3. Prisma Client gerado

```bash
# Verificar PostgreSQL
pg_isready -h localhost -p 5432

# Executar migrations se necessário
npx prisma migrate dev

# Gerar Prisma Client se necessário
npx prisma generate
```

### 1. Seed de Times

```bash
# Executar seed dos 25 times
npx tsx prisma/seed-teams.ts
```

**Saída esperada:**

```
🎲 Iniciando seed dos times...
  ✅ Time "Avestruz" criado com sucesso!
  ✅ Time "Águia" criado com sucesso!
  ...
🎉 Seed dos times concluído!
```

### 2. Seed Completo (Quando disponível)

```bash
# Executar todos os seeds
npm run prisma:seed
```

---

## 🔍 Verificar Seeds

### Via Terminal

```bash
# Contar times criados
psql -U postgres -d jogo_da_sorte_db -c "SELECT COUNT(*) FROM \"Team\";"

# Listar todos os times
psql -U postgres -d jogo_da_sorte_db -c "SELECT name, animal, \"animalEmoji\" FROM \"Team\" ORDER BY name;"
```

### Via Prisma Studio

```bash
# Abrir interface visual
npx prisma studio
```

Acesse: http://localhost:5555

### Via API

```bash
# Listar times (após servidor iniciado)
curl http://localhost:3000/api/teams

# Buscar time por ID
curl http://localhost:3000/api/teams/{id}

# Buscar por camisa
curl http://localhost:3000/api/teams/jersey/10
```

---

## 🔄 Re-executar Seeds

### Seeds são Idempotentes

Os scripts de seed verificam se os dados já existem antes de criar:

```typescript
const existing = await prisma.team.findUnique({
  where: { name: team.name },
});

if (existing) {
  console.log(`Time "${team.name}" já existe. Pulando...`);
  continue;
}
```

### Limpar e Re-seed

```bash
# ATENÇÃO: Isso apaga TODOS os dados!

# Resetar banco completo
npx prisma migrate reset

# Isso vai:
# 1. Dropar o banco
# 2. Recriar o banco
# 3. Executar todas as migrations
# 4. Executar os seeds automaticamente
```

---

## 📦 Seeds Futuros (A Criar)

### 2. Admin User Seed

```bash
# Criar usuário administrador padrão
npx tsx prisma/seed-admin.ts
```

**Dados:**

- Email: admin@jogodasorte.com
- Senha: Admin@123
- Role: SYSTEM_ADMIN

### 3. Sample Data Seed (Desenvolvimento)

```bash
# Criar dados de teste para desenvolvimento
npx tsx prisma/seed-sample-data.ts
```

Inclui:

- 10 usuários de teste
- 50 apostas fictícias
- 5 sorteios passados
- Transações de exemplo

---

## 🛠️ Criar Novos Seeds

### Template de Seed

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMyData() {
  console.log('🌱 Iniciando seed...');
  
  // Seu código aqui
  
  console.log('✅ Seed concluído!');
}

async function main() {
  try {
    await seedMyData();
  } catch (error) {
    console.error('❌ Erro:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

### Executar

```bash
npx tsx prisma/seed-my-data.ts
```

---

## 🎯 Ordem Recomendada de Seeds

1. **Teams** - Base do jogo
2. **Admin User** - Acesso ao sistema
3. **Sample Data** (opcional) - Testes

```bash
# Executar em ordem
npx tsx prisma/seed-teams.ts
npx tsx prisma/seed-admin.ts      # Quando criado
npx tsx prisma/seed-sample-data.ts # Quando criado
```

---

## 🐛 Troubleshooting

### Erro: "Can't reach database server"

```bash
# PostgreSQL não está rodando
brew services start postgresql@15

# Ou Docker
docker start postgres-jogo-sorte
```

### Erro: "Table does not exist"

```bash
# Migrations não foram executadas
npx prisma migrate dev
```

### Erro: "Unique constraint failed"

```bash
# Dados já existem, não é um erro real
# Os seeds são idempotentes e vão pular registros existentes
```

### Erro: "Module not found: tsx"

```bash
# Instalar tsx para executar TypeScript
npm install -D tsx
```

---

## 📊 Estatísticas Após Seed Completo

- **Times:** 25
- **Camisas totais:** 100 (00-99)
- **Usuários:** 1 admin + usuários criados
- **Empresas:** 1 default

---

## 🔐 Seeds de Produção

⚠️ **IMPORTANTE:** Nunca execute seeds com dados de teste em produção!

### Seeds seguros para produção:

- ✅ Teams seed
- ✅ Admin user seed (com senha forte)

### Seeds APENAS para desenvolvimento:

- ❌ Sample data seed
- ❌ Test users seed

---

## 📝 Adicionar ao package.json

```json
{
  "scripts": {
    "seed:teams": "npx tsx prisma/seed-teams.ts",
    "seed:admin": "npx tsx prisma/seed-admin.ts",
    "seed:all": "npm run seed:teams && npm run seed:admin"
  }
}
```

Uso:

```bash
npm run seed:teams
npm run seed:all
```

---

**Última atualização:** 6 de janeiro de 2026  
**Status:** 🟢 Teams seed disponível

