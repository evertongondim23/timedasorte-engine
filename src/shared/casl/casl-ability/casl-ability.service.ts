import { Injectable, Scope } from "@nestjs/common";
import { AbilityBuilder, PureAbility } from "@casl/ability";
import { createPrismaAbility, PrismaQuery, Subjects } from "@casl/prisma";
import {
  User,
  Team,
  Bet,
  Draw,
  Transaction,
  Wallet,
  Company,
  File,
  Notification,
  AuditLog,
} from "@prisma/client";

// ========================================
// 🎯 TIPOS DE AÇÕES E RECURSOS - JOGO DA SORTE
// ========================================

export type PermActions =
  | "manage"
  | "create"
  | "read"
  | "update"
  | "delete"
  | "approve"
  | "export"
  | "bet" // Ação específica para apostas
  | "draw" // Ação específica para sorteios
  | "payout"; // Ação específica para pagamentos

export type PermissionResource =
  | Subjects<{
      User: User;
      Company: Company;
      Team: Team;
      Bet: Bet;
      Draw: Draw;
      Transaction: Transaction;
      Wallet: Wallet;
      File: File;
      Notification: Notification;
      AuditLog: AuditLog;
    }>
  | "all";

export type AppAbility = PureAbility<
  [PermActions, PermissionResource],
  PrismaQuery
>;

// ========================================
// 🔐 SERVIÇO DE PERMISSÕES - JOGO DA SORTE
// ========================================

@Injectable({ scope: Scope.REQUEST })
export class CaslAbilityService {
  ability: AppAbility;

  /**
   * Cria abilities baseado no usuário autenticado
   */
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createPrismaAbility
    );

    // ========================================
    // 🔴 SYSTEM_ADMIN - Acesso total
    // ========================================
    if (user.role === "SYSTEM_ADMIN") {
      can("manage", "all");
      this.ability = build();
      return this.ability;
    }

    // ========================================
    // 🟡 ADMIN - Administrador da empresa
    // ========================================
    if (user.role === "ADMIN") {
      // Gerenciar usuários da própria empresa
      can("read", "User", { companyId: user.companyId });
      can("create", "User", { companyId: user.companyId });
      can("update", "User", { companyId: user.companyId });
      can("delete", "User", { companyId: user.companyId });

      // Gerenciar times
      can("read", "Team");
      can("create", "Team");
      can("update", "Team");
      can("delete", "Team");

      // Gerenciar apostas
      can("read", "Bet");
      can("approve", "Bet");
      can("delete", "Bet");

      // Gerenciar sorteios
      can("read", "Draw");
      can("create", "Draw");
      can("draw", "Draw");
      can("update", "Draw");

      // Gerenciar transações
      can("read", "Transaction");
      can("create", "Transaction");
      can("payout", "Transaction");
      can("export", "Transaction");

      // Gerenciar carteiras
      can("read", "Wallet");
      can("update", "Wallet");

      // Logs e auditoria
      can("read", "AuditLog");
      can("export", "AuditLog");

      // Notificações
      can("read", "Notification");
      can("create", "Notification");

      // Arquivos
      can("read", "File");
      can("create", "File");
      can("delete", "File");
    }

    // ========================================
    // 🟢 USER - Usuário comum (apostador)
    // ========================================
    if (user.role === "USER") {
      // Ver próprio perfil
      can("read", "User", { id: user.id });
      can("update", "User", { id: user.id });

      // Ver times
      can("read", "Team", { isActive: true });

      // Gerenciar próprias apostas
      can("read", "Bet", { userId: user.id });
      can("create", "Bet");
      can("bet", "Bet", { userId: user.id });
      // Não pode deletar apostas com status final
      cannot("delete", "Bet", { status: { equals: "WON" } } as any);
      cannot("delete", "Bet", { status: { equals: "LOST" } } as any);

      // Ver sorteios
      can("read", "Draw");

      // Ver próprias transações
      can("read", "Transaction", { userId: user.id });

      // Ver própria carteira
      can("read", "Wallet", { userId: user.id });

      // Ver próprias notificações (Notification não tem userId no schema, então liberado para todos)
      can("read", "Notification");
      can("update", "Notification");
    }

    // ========================================
    // 🔒 REGRAS GERAIS DE SEGURANÇA
    // ========================================

    // Ninguém pode deletar registros de auditoria
    cannot("delete", "AuditLog");

    // Apenas SYSTEM_ADMIN pode deletar empresas (já tratado acima)
    // Usuários normais não podem deletar empresas
    if (
      user.role === "USER" ||
      user.role === "ADMIN" ||
      user.role === "OPERATOR"
    ) {
      cannot("delete", "Company");
    }

    // Ninguém pode modificar apostas após sorteio
    cannot("update", "Bet", { status: { equals: "WON" } } as any);
    cannot("update", "Bet", { status: { equals: "LOST" } } as any);

    // Construir e retornar abilities
    this.ability = build();
    return this.ability;
  }

  /**
   * Verifica se pode realizar uma ação
   */
  can(action: PermActions, subject: PermissionResource): boolean {
    return this.ability.can(action, subject);
  }

  /**
   * Verifica se NÃO pode realizar uma ação
   */
  cannot(action: PermActions, subject: PermissionResource): boolean {
    return this.ability.cannot(action, subject);
  }

  /**
   * Valida e lança erro se não tiver permissão
   */
  throwUnlessCan(
    action: PermActions,
    subject: PermissionResource,
    message?: string
  ): void {
    if (this.cannot(action, subject)) {
      throw new Error(
        message || `Você não tem permissão para ${action} em ${subject}`
      );
    }
  }
}
