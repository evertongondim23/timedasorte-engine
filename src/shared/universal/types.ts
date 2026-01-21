// ============================================================================
// 🏷️ TIPOS DE ENTIDADES
// ============================================================================

export type EntityNameModel =
  // Core entities
  | "user"
  | "company"
  // Jogo da Sorte
  | "team"
  | "bet"
  | "draw"
  | "transaction"
  | "wallet"
  | "auditLog"
  // System
  | "file"
  | "notification";

export type EntityNameCasl =
  // Core entities
  | "User"
  | "Company"
  // Jogo da Sorte
  | "Team"
  | "Bet"
  | "Draw"
  | "Transaction"
  | "Wallet"
  | "AuditLog"
  // System
  | "File"
  | "Notification";

// ============================================================================
// 🔄 MAPEAMENTO AUTOMÁTICO MODEL ↔ CASL
// ============================================================================

/**
 * Mapeamento entre nomes de entidade do Prisma (model) e CASL (permissions)
 */
export const ENTITY_MAPPING = {
  // Core entities
  user: "User",
  company: "Company",
  // Jogo da Sorte
  team: "Team",
  bet: "Bet",
  draw: "Draw",
  transaction: "Transaction",
  wallet: "Wallet",
  auditLog: "AuditLog",
  // System
  file: "File",
  notification: "Notification",
} as const;

/**
 * Mapeamento reverso CASL → Model
 */
export const CASL_TO_MODEL_MAPPING = {
  // Core entities
  User: "user",
  Company: "company",
  // Jogo da Sorte
  Team: "team",
  Bet: "bet",
  Draw: "draw",
  Transaction: "transaction",
  Wallet: "wallet",
  AuditLog: "auditLog",
  // System
  File: "file",
  Notification: "notification",
} as const;

// ============================================================================
// 🛠️ FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Converte nome da entidade do Prisma para nome do CASL
 * @param modelName Nome da entidade no Prisma (ex: 'company')
 * @returns Nome da entidade no CASL (ex: 'Company')
 */
export function getCaslName(modelName: EntityNameModel): EntityNameCasl {
  return ENTITY_MAPPING[modelName];
}

/**
 * Converte nome da entidade do CASL para nome do Prisma
 * @param caslName Nome da entidade no CASL (ex: 'Company')
 * @returns Nome da entidade no Prisma (ex: 'company')
 */
export function getModelName(caslName: EntityNameCasl): EntityNameModel {
  return CASL_TO_MODEL_MAPPING[caslName];
}

/**
 * Verifica se um nome de entidade é válido
 * @param entityName Nome da entidade para validar
 * @returns true se válido
 */
export function isValidEntityName(
  entityName: string
): entityName is EntityNameModel {
  return Object.keys(ENTITY_MAPPING).includes(entityName);
}

/**
 * Obtém lista de todas as entidades disponíveis
 * @returns Array com todos os nomes de entidade do modelo
 */
export function getAllEntityNames(): EntityNameModel[] {
  return Object.keys(ENTITY_MAPPING) as EntityNameModel[];
}

/**
 * 🚀 Helper para criar configuração completa da entidade
 * @param modelName Nome da entidade no modelo (ex: 'company')
 * @returns Objeto com ambos os nomes para usar no constructor
 */
export function createEntityConfig(modelName: EntityNameModel) {
  return {
    model: modelName,
    casl: getCaslName(modelName),
  } as const;
}

// ============================================================================
// 📋 INTERFACES PARA CONFIGURAÇÃO DE INCLUDES E TRANSFORMAÇÕES
// ============================================================================

export interface IncludeConfig {
  [key: string]:
    | boolean
    | {
        select?: Record<string, boolean>;
        include?: IncludeConfig;
      };
}

export interface TransformConfig {
  // Mapeia campos de relacionamento para campos planos
  // Pode ser string simples ou objeto com configuração específica
  flatten?: Record<string, string | { field: string; target: string }>;
  // Função customizada de transformação
  custom?: (data: any) => any;
  // Remove campos específicos após transformação
  exclude?: string[];
}

export interface EntityConfig {
  includes?: IncludeConfig;
  transform?: TransformConfig;
}

// ============================================================================
// 🔧 TIPOS EXISTENTES
// ============================================================================
