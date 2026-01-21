# 📁 Módulo de Armazenamento de Arquivos (Simplificado)

Sistema simples de armazenamento de arquivos integrado ao backend NestJS do AuMigoPet Engine, utilizando MinIO como storage.

## 🏗️ Arquitetura Simplificada

### Estrutura de Diretórios
```
src/modules/files/
├── services/
│   └── files.service.ts        # Service principal
├── controllers/
│   └── files.controller.ts     # Controller principal
├── files.module.ts             # Módulo principal
└── README.md                   # Esta documentação
```

## 🚀 Funcionalidades

### ✅ Upload de Arquivos
- **Upload simples**: Um endpoint para todos os tipos
- **Validação básica**: Tamanho máximo de 100MB
- **Organização automática**: Por empresa no MinIO
- **URLs públicas**: Acesso direto aos arquivos

### ✅ Consulta de Arquivos
- **Listar todos**: Com paginação
- **Buscar por ID**: Arquivo específico
- **Filtro por empresa**: Multi-tenancy automático

### ✅ Gestão de Arquivos
- **Deletar**: Remove do MinIO e banco
- **Controle de acesso**: Baseado em autenticação

## 🔧 Configuração

### 1. Variáveis de Ambiente
```env
# MinIO Configuration
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=password123
MINIO_ENDPOINT=http://localhost:9000
MINIO_USE_SSL=false
```

### 2. Docker Compose
O MinIO já está configurado no `docker-compose.yml`:
```yaml
minio:
  image: minio/minio:latest
  ports:
    - '9000:9000'  # API
    - '9001:9001'  # Console web
  environment:
    MINIO_ROOT_USER: ${MINIO_ROOT_USER:-admin}
    MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-password123}
```

## 📡 APIs Disponíveis

### Upload de Arquivo
```http
POST /files/upload?type=TIPO&description=DESCRIÇÃO
Content-Type: multipart/form-data

{
  "file": [arquivo]
}
```

### Listar Arquivos
```http
GET /files?page=1&limit=10
Authorization: Bearer {token}
```

### Buscar Arquivo
```http
GET /files/{id}
Authorization: Bearer {token}
```

### Deletar Arquivo
```http
DELETE /files/{id}
Authorization: Bearer {token}
```

## 🔐 Controle de Acesso

- **Autenticação obrigatória**: Todos os endpoints
- **Multi-tenancy**: Arquivos isolados por empresa
- **Sem roles específicos**: Qualquer usuário autenticado pode usar

## 📊 Tipos de Arquivo Suportados

- **PROFILE_IMAGE**: Imagens de perfil
- **DOCUMENT**: Documentos
- **REPORT**: Relatórios
- **VIDEO**: Vídeos
- **AUDIO**: Áudios
- **OTHER**: Outros tipos

## 🧪 Testando o Módulo

### 1. Iniciar Serviços
```bash
# Iniciar MinIO
docker-compose up minio

# Iniciar backend
npm run start:dev
```

### 2. Acessar Console MinIO
- **URL**: http://localhost:9001
- **Login**: admin
- **Senha**: password123

### 3. Testar Upload via cURL
```bash
# Upload de documento
curl -X POST http://localhost:3000/files/upload \
  -H "Authorization: Bearer {seu-token}" \
  -F "file=@documento.pdf" \
  -F "type=DOCUMENT" \
  -F "description=Relatório mensal"
```

### 4. Testar via Request File
Use o arquivo `request/files.http` para testes completos.

## 📁 Estrutura de Pastas no MinIO

```
aumigopet-files/
├── public/                    # Arquivos públicos
└── companies/
    └── {companyId}/           # Arquivos por empresa
```

## 🎯 Exemplo de Uso

### 1. Fazer Login
```http
POST /auth/login
{
  "login": "user@example.com",
  "password": "password"
}
```

### 2. Fazer Upload
```http
POST /files/upload?type=DOCUMENT&description=Meu documento
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [arquivo]
```

### 3. Listar Arquivos
```http
GET /files?page=1&limit=10
Authorization: Bearer {token}
```

### 4. Acessar Arquivo
```http
GET {url_do_arquivo}
```

## 🚨 Tratamento de Erros

### Erros Comuns
- `401`: Não autenticado
- `404`: Arquivo não encontrado
- `400`: Arquivo muito grande ou inválido

## 📈 Monitoramento

### Logs
- Upload de arquivos
- Deletar arquivos
- Erros de operação

## 🔮 Próximas Funcionalidades

- [ ] **Validação de tipos MIME**
- [ ] **Limites por tipo de arquivo**
- [ ] **Compressão de imagens**
- [ ] **Thumbnails automáticos**
- [ ] **Backup automático**

## ✅ Checklist de Implementação

- ✅ **Service simplificado** com upload e busca
- ✅ **Controller básico** com 4 endpoints
- ✅ **MinIO integrado** para storage
- ✅ **Multi-tenancy** por empresa
- ✅ **Autenticação** obrigatória
- ✅ **URLs públicas** para acesso
- ✅ **Documentação** completa
- ✅ **Request file** para testes

## 🎯 Resultado Final

O módulo está **simples e funcional**, focando apenas no essencial:

- **Upload** de arquivos
- **Busca** de arquivos
- **Deletar** arquivos
- **URLs públicas** para acesso

Perfeito para começar e expandir conforme necessário!
