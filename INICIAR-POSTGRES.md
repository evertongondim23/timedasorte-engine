# 🐘 Como Iniciar o PostgreSQL

## ⚠️ IMPORTANTE

O PostgreSQL precisa estar rodando para:

- Executar migrations
- Testar o servidor
- Desenvolver a aplicação

---

## 🚀 Opções para Iniciar

### Opção 1: Homebrew (MacOS - Recomendado)

```bash
# Se já tiver instalado
brew services start postgresql@14

# Ou versão específica
brew services start postgresql@15
brew services start postgresql@16

# Verificar se está rodando
brew services list | grep postgres
```

### Opção 2: pg_ctl

```bash
# Iniciar
pg_ctl -D /usr/local/var/postgres start

# Verificar status
pg_ctl -D /usr/local/var/postgres status
```

### Opção 3: Docker (Alternativa)

```bash
# Criar e iniciar container PostgreSQL
docker run --name postgres-jogo-sorte \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=jogo_da_sorte_db \
  -p 5432:5432 \
  -d postgres:15

# Verificar se está rodando
docker ps | grep postgres
```

---

## ✅ Verificar se Está Rodando

```bash
# Tentar conexão
psql -U postgres -h localhost -c "SELECT version();"

# Ou
pg_isready -h localhost -p 5432
```

---

## 📝 Criar o Banco de Dados

Depois que o PostgreSQL estiver rodando:

```bash
# Criar banco
createdb jogo_da_sorte_db

# Ou com psql
psql -U postgres -c "CREATE DATABASE jogo_da_sorte_db;"
```

---

## 🔄 Executar Migrations

Após o banco estar criado e rodando:

```bash
cd /Users/everton/jogo-da-sorte-engine

# Executar migrations
npm run prisma:migrate

# Ou migration inicial
npx prisma migrate dev --name init
```

---

## 🆘 Troubleshooting

### Erro: "Can't reach database server"

```bash
# Verificar se PostgreSQL está rodando
ps aux | grep postgres

# Ou
lsof -i :5432
```

### Erro: "FATAL: database does not exist"

```bash
# Criar o banco
createdb jogo_da_sorte_db
```

### Erro: "FATAL: role postgres does not exist"

```bash
# Criar usuário postgres
createuser -s postgres
```

---

## 📊 Status Atual

Para continuar o desenvolvimento AGORA sem PostgreSQL:

- ✅ Podemos criar os módulos
- ✅ Podemos escrever os services
- ✅ Podemos criar os DTOs
- ❌ Não podemos testar o servidor
- ❌ Não podemos fazer queries

**Recomendação:** Inicie o PostgreSQL quando for testar a aplicação.

---

## 🎯 Próximos Passos (SEM PostgreSQL)

Podemos continuar criando:

1. Módulo Wallets
2. Módulo Transactions
3. Módulo Teams
4. DTOs e Services

Quando o PostgreSQL estiver rodando:

```bash
npm run prisma:migrate
npm run start:dev
```

---

**📌 Lembre-se de iniciar o PostgreSQL antes de testar o servidor!**
