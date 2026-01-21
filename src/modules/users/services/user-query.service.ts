import { Injectable } from '@nestjs/common';
import { CaslAbilityService } from '../../../shared/casl/casl-ability/casl-ability.service';
import { TenantService } from '../../../shared/tenant/tenant.service';
import { accessibleBy } from '@casl/prisma';
import { Prisma, Roles } from '@prisma/client';
import { ForbiddenError } from 'src/shared/common/errors';
import { ERROR_MESSAGES } from 'src/shared/common/messages';
import { CrudAction } from '../../../shared/common/types';

@Injectable()
export class UserQueryService {
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
    baseWhere: Prisma.UserWhereInput = {},
  ): Prisma.UserWhereInput {
    return this.construirWhereClauseBase('read', baseWhere);
  }

  /**
   * Constrói where clause para operações de atualização
   */
  construirWhereClauseParaUpdate(id: string): Prisma.UserWhereInput {
    return this.construirWhereClauseBase('update', { id });
  }

  /**
   * Constrói where clause para operações de criação
   */
  construirWhereClauseParaCreate(): Prisma.UserWhereInput {
    return this.construirWhereClauseBase('create');
  }

  /**
   * Constrói where clause para operações de exclusão
   */
  construirWhereClauseParaDelete(id: string): Prisma.UserWhereInput {
    return this.construirWhereClauseBase('delete', { id });
  }

  // ============================================================================
  // 🔧 MÉTODOS PRIVADOS - LÓGICA CENTRALIZADA
  // ============================================================================

  /**
   * Constrói where clause baseado na ação e filtros adicionais
   * Centraliza a lógica de construção de filtros Prisma com regras CASL
   */

  private construirWhereClauseBase(
    action: CrudAction,
    additionalWhere: Prisma.UserWhereInput = {},
  ): Prisma.UserWhereInput {
    const ability = this.abilityService.ability;
    const tenant = this.tenantService.getTenant();

    const whereClause: Prisma.UserWhereInput = {
      ...additionalWhere,
      AND: [accessibleBy(ability, action).User],
      deletedAt: null,
    };

    // Se não for tenant global, filtra por companyId
    if (!tenant.isGlobal) {
      whereClause.companyId = tenant.id;
    }

    return whereClause;
  }


}
