import { Injectable } from '@nestjs/common';
import { CreateSystemAdminDto } from '../dto/create-system-admin.dto';
import { BaseUserService } from './base-user.service';
import { UserFactory } from '../factories/user.factory';
import { UserRepository } from '../repositories/user.repository';
import { UserValidator } from '../validators/user.validator';
import { UserQueryService } from './user-query.service'; 
import { Roles } from '@prisma/client';
import { UserPermissionService } from './user-permission.service';

@Injectable()
export class SystemAdminService extends BaseUserService {
  constructor(
    userRepository: UserRepository,
    userValidator: UserValidator,
    userQueryService: UserQueryService,
    userPermissionService: UserPermissionService,
    private userFactory: UserFactory,
  ) {
    super(
      userRepository,
      userValidator,
      userQueryService,
      userPermissionService,
      Roles.ADMIN,
    );
  }

  //  Funcionalidades específicas de administradores da plataforma
    async criarNovoSystemAdmin(dto: CreateSystemAdminDto) {
    // ✅ Validação de role hierárquico
    this.userPermissionService.validarCriacaoDeUserComRole(Roles.ADMIN);
 
    // Valida se email é único
    await this.validarSeEmailEhUnico(dto.email); 
    // Criação do usuário
    const userData = this.userFactory.criarAdmin(dto);
    const user = await this.userRepository.criar(userData);

    return user;
  }

  async buscarTodosOsPlatformAdmins() {
    return this.userRepository.buscarMuitos({ role: Roles.ADMIN });
  }

  async obterEstatisticasDoSistema() {
    // TODO: Implementar estatísticas do sistema
    return {
      totalUsers: 0,
      totalCompanies: 0,
      totalServiceProviders: 0,
      totalPets: 0,
    };
  }

  async obterLogsDoSistema(startDate?: Date, endDate?: Date) {
    // TODO: Implementar logs do sistema
    return [];
  }

  async gerenciarConfiguracoesDoSistema(settings: any) {
    // TODO: Implementar gerenciamento de configurações
    return { success: true };
  }

  async fazerBackupDoSistema() {
    // TODO: Implementar backup do sistema
    return { backupId: 'backup-123' };
  }

  async restaurarSistema(backupId: string) {
    // TODO: Implementar restauração do sistema
    return { success: true };
  }

}
