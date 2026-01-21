import { Injectable } from '@nestjs/common';
import { CaslAbilityService } from '../../casl/casl-ability/casl-ability.service';
import { TenantService } from '../../tenant/tenant.service';
import { accessibleBy } from '@casl/prisma';
import { CrudAction } from '../../common/types';
import { EntityNameCasl } from '../types';
import { ForbiddenError } from '../../common/errors';
import { ERROR_MESSAGES } from 'src/shared/common/messages';

@Injectable()
export class UniversalQueryService {
  constructor(
    private abilityService: CaslAbilityService,
    private tenantService: TenantService,
  ) {}

  // ============================================================================
  // 📋 MÉTODOS PÚBLICOS - CONSTRUÇÃO DE WHERE CLAUSE
  // ============================================================================

  /**
   * Constrói where clause para operações de leitura
   */
  construirWhereClauseParaRead(
    entityName: EntityNameCasl,
    baseWhere: any = {},
  ): any {
    return this.construirWhereClauseBase(entityName, 'read', baseWhere);
  }

  /**
   * Constrói where clause para operações de atualização
   */
  construirWhereClauseParaUpdate(entityName: EntityNameCasl, id: string): any {
    return this.construirWhereClauseBase(entityName, 'update', { id });
  }

  /**
   * Constrói where clause para operações de criação
   */
  construirWhereClauseParaCreate(entityName: EntityNameCasl): any {
    return this.construirWhereClauseBase(entityName, 'create');
  }

  /**
   * Constrói where clause para operações de exclusão
   */
  construirWhereClauseParaDelete(entityName: EntityNameCasl, id: string): any {
    return this.construirWhereClauseBase(entityName, 'delete', { id });
  }

  // ============================================================================
  // 🔧 MÉTODOS PRIVADOS - LÓGICA CENTRALIZADA
  // ============================================================================

  /**
   * Constrói where clause baseado na ação e filtros adicionais
   * Centraliza a lógica de construção de filtros Prisma com regras CASL
   */

  private construirWhereClauseBase(
    entityName: EntityNameCasl,
    action: CrudAction,
    additionalWhere: any = {},
  ): any {
    const ability = this.abilityService.ability;
    
    const tenant = this.tenantService.getTenant();

    try {
      const whereClause: any = {
        ...additionalWhere,
        AND: [accessibleBy(ability, action)[entityName]],
        deletedAt: null,
      };

      // Se não for tenant global, filtra por companyId
      if (!tenant.isGlobal) {
        whereClause.companyId = tenant.id;
      }

      return whereClause;
    } catch (error) {
      // Capturar ForbiddenError do CASL e relançar como erro mais específico
      if (error.name === 'ForbiddenError') {
        throw new ForbiddenError(
          ERROR_MESSAGES.AUTHORIZATION.RESOURCE_ACCESS_DENIED,
        );
      }
      // Re-throw outros erros
      throw error;
    }
  }
}
