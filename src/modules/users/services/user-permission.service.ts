import { Injectable } from "@nestjs/common";
import { CaslService } from "../../../shared/casl/casl.service";
import { PermissionContextService } from "../../../shared/casl/services/permission-context.service";
import { PermissionAuditService } from "../../../shared/casl/services/permission-audit.service";
import { Roles, User } from "@prisma/client";
import { CrudAction } from "../../../shared/common/types";

@Injectable()
export class UserPermissionService {
  constructor(
    private caslService: CaslService,
    private contextService: PermissionContextService,
    private auditService: PermissionAuditService
  ) {}

  // ============================================================================
  // 🔐 MÉTODOS PÚBLICOS - VALIDAÇÃO BÁSICA (Mantidos para compatibilidade)
  // ============================================================================

  /**
   * Verifica se o usuário pode realizar uma ação específica
   */
  validarAction(action: CrudAction): boolean {
    return this.caslService.validarAction(action, "User");
  }

  /**
   * Valida permissões para atualização de campos específicos
   */
  validarPermissoesDeCampo(updateData: any): boolean {
    return this.caslService.validarPermissaoDeCampo("User", updateData);
  }

  // ============================================================================
  // 🎯 MÉTODOS PÚBLICOS - VALIDAÇÃO DE ROLE HIERÁRQUICO
  // ============================================================================

  /**
   * Verifica se pode criar usuário com role específico
   */
  validarCriacaoDeUserComRole(targetRole: Roles): boolean {
    return this.validarPermissaoDeRole("create", targetRole);
  }

  /**
   * Verifica se pode atualizar usuário com role específico
   */
  validarAtualizacaoDeUserComRole(targetRole: Roles): boolean {
    return this.validarPermissaoDeRole("update", targetRole);
  }

  /**
   * Verifica se pode deletar usuário com role específico
   */
  validarDelecaoDeUserComRole(targetRole: Roles): boolean {
    return this.validarPermissaoDeRole("delete", targetRole);
  }

  /**
   * Validação centralizada para qualquer ação CRUD com role específico
   */
  validarAcaoDeUserComRole(action: CrudAction, targetRole: Roles): boolean {
    return this.validarPermissaoDeRole(action, targetRole);
  }

  // ============================================================================
  // 🎯 MÉTODOS PÚBLICOS - VALIDAÇÃO COM AUDITORIA (Recomendado)
  // ============================================================================

  /**
   * Valida ação com auditoria completa
   */
  validarComAuditoria(
    user: User,
    action: CrudAction,
    context?: {
      resourceId?: string;
      ipAddress?: string;
      userAgent?: string;
      additionalContext?: Record<string, any>;
    }
  ): boolean {
    return this.auditService.validarComAuditoria(user, action, "User", context);
  }

  // ============================================================================
  // 🔧 MÉTODOS PÚBLICOS - VALIDAÇÃO CONTEXTUAL (Novo)
  // ============================================================================

  /**
   * Valida permissão considerando contexto do usuário
   */
  validarContextual(
    user: User,
    action: CrudAction,
    context?: {
      postId?: string;
      companyId?: string;
      isOnShift?: boolean;
      timeOfDay?: "day" | "night";
    }
  ): boolean {
    const permissionContext = this.contextService.criarContexto(user, context);

    return this.contextService.validarPermissaoContextual(permissionContext, {
      action,
      subject: "User",
      conditions: {
        companyId: context?.companyId,
        postId: context?.postId,
      },
      timeRestrictions:
        context?.timeOfDay === "night"
          ? {
              startHour: 18,
              endHour: 6,
            }
          : undefined,
    });
  }

  /**
   * Valida permissão para operações de RH (horário comercial)
   */
  validarOperacaoRH(user: User, action: CrudAction, context?: any): boolean {
    const permissionContext = this.contextService.criarContexto(user, context);

    return this.contextService.validarPermissaoContextual(permissionContext, {
      action,
      subject: "User",
      timeRestrictions: {
        startHour: 8,
        endHour: 18,
      },
      conditions: {
        role: { in: ["HR", "ADMIN"] },
      },
    });
  }

  // ============================================================================
  // 📊 MÉTODOS PÚBLICOS - MÉTRICAS E AUDITORIA (Novo)
  // ============================================================================

  /**
   * Obtém métricas de permissões de usuário
   */
  obterMetricas(periodo?: { inicio: Date; fim: Date }) {
    return this.auditService.obterMetricas(periodo);
  }

  /**
   * Obtém logs de auditoria de usuário
   */
  obterLogs(filtros?: any, limit = 100) {
    return this.auditService.obterLogs({ ...filtros, subject: "User" }, limit);
  }

  /**
   * Exporta logs de usuário para análise
   */
  exportarLogs(formato: "json" | "csv" = "json") {
    return this.auditService.exportarLogs(formato);
  }

  // ============================================================================
  // 🔧 MÉTODOS PRIVADOS - LÓGICA ESPECÍFICA DO USUÁRIO
  // ============================================================================

  /**
   * Valida se o usuário pode realizar ação específica com determinado role
   * Usa regras CASL para verificar permissões hierárquicas
   */
  private validarPermissaoDeRole(
    action: CrudAction,
    targetRole: Roles
  ): boolean {
    return this.caslService.validarPermissaoDeRole(action, "User", targetRole);
  }
}
