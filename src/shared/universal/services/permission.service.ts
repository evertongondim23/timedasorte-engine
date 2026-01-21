import { Injectable } from '@nestjs/common';

/**
 * Universal Permission Service - Stub
 * TODO: Implementar lógica completa quando necessário
 */
@Injectable()
export class UniversalPermissionService {
  constructor() {}

  validarAction(entityName: string, action: string): boolean {
    // Stub - sempre retorna true por enquanto
    return true;
  }

  validarCriacaoDeEntidadeComRole(entityName: string, role: string): boolean {
    // Stub - sempre retorna true por enquanto
    return true;
  }

  validatePermission(action: string, subject: string): boolean {
    // Stub - sempre retorna true por enquanto
    return true;
  }

  checkAccess(userId: string, resource: string): boolean {
    // Stub - sempre retorna true por enquanto
    return true;
  }
}
