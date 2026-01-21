# 👥 User Services - Jogo da Sorte

Serviços relacionados ao gerenciamento de usuários do sistema de apostas.

## 📁 Estrutura

- `base-user.service.ts` - Serviço base para operações de usuários
- `admin.service.ts` - Serviço para administradores da plataforma
- `system-admin.service.ts` - Serviço para super administradores
- `user-permission.service.ts` - Gerenciamento de permissões (CASL)
- `user-query.service.ts` - Queries otimizadas com filtros

## 🎯 Responsabilidades

- **BaseUserService**: CRUD básico de usuários
- **AdminService**: Operações administrativas (aprovar apostas, gerenciar times)
- **SystemAdminService**: Operações de sistema (configurações globais)
- **UserPermissionService**: Validação de permissões baseada em roles
- **UserQueryService**: Queries filtradas por tenant e permissões

## 🔐 Roles

- `USER` - Apostador comum
- `ADMIN` - Administrador da plataforma
- `OPERATOR` - Operador de sorteios
- `SYSTEM_ADMIN` - Super administrador
