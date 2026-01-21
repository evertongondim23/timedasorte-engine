import { Injectable } from '@nestjs/common';
import { CreateSystemAdminDto } from './dto/create-system-admin.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BaseUserService } from './services/base-user.service';
import { UserRepository } from './repositories/user.repository';
import { UserValidator } from './validators/user.validator';
import { UserQueryService } from './services/user-query.service';
import {
  SystemAdminService,
  AdminService,
  UserPermissionService,
} from './services';
import { Prisma, Roles, UserStatus } from '@prisma/client';
import { UserFactory } from './factories/user.factory';

@Injectable()
export class UsersService extends BaseUserService {
  constructor(
    userRepository: UserRepository,
    userValidator: UserValidator,
    userQueryService: UserQueryService,
    userPermissionService: UserPermissionService,
    private systemAdminService: SystemAdminService,
    private adminService: AdminService,
    private userFactory: UserFactory,
  ) {
    super(
      userRepository,
      userValidator,
      userQueryService,
      userPermissionService,
    );
  }

  //  Métodos de orquestração - delegam para serviços específicos
  async criarNovoSystemAdmin(dto: CreateSystemAdminDto) {
    return this.systemAdminService.criarNovoSystemAdmin(dto);
  }

  async criarNovoAdmin(dto: CreateAdminDto) {
    return this.adminService.criarNovoAdmin(dto);
  }

  /**
   * Cria usuário comum
   */
  async criarNovoUser(dto: any) {
    // Validações comuns
    await this.validarSeEmailEhUnico(dto.email);
    if (dto.cpf) await this.validarSeCPFEhUnico(dto.cpf);
    if (dto.phone) await this.validarSePhoneEhUnico(dto.phone);

    // Criação do usuário
    const userData = this.userFactory.criarUser(dto);
    const user = await this.userRepository.criar(
      userData as Prisma.UserCreateInput,
    );

    return user;
  }

  /**
   * Busca usuários por role
   */
  async buscarUsersPorRole(role: Roles) {
    const whereClause = this.userQueryService.construirWhereClauseParaRead({
      role,
      status: UserStatus.ACTIVE,
    });

    const users = await this.userRepository.buscarMuitos(whereClause);
    return this.transformData(users);
  }

  /**
   * Atualiza perfil do próprio usuário
   * Não permite alterar campos sensíveis como role, status, password
   */
  async atualizarPerfil(userId: string, updateProfileDto: UpdateProfileDto) {
    console.log('🔄 atualizarPerfil: Iniciando...', { userId, updateProfileDto });
    
    // Buscar usuário
    const user = await this.userRepository.buscarPrimeiro({ id: userId });
    this.validarResultadoDaBusca(user, 'User', 'id', userId);

    // Garantir que o usuário foi encontrado após validação
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    console.log('📝 atualizarPerfil: Dados atuais do usuário:', {
      email: user.email,
      cpf: user.cpf,
      phone: user.phone,
    });

    // Helper para normalizar valores vazios (null, undefined, '')
    const normalize = (value: string | null | undefined): string => {
      return value?.trim() || '';
    };

    // Validações de unicidade (se campos estiverem sendo alterados)
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      console.log('✉️ Validando email:', updateProfileDto.email);
      await this.validarSeEmailEhUnico(updateProfileDto.email);
    }
    
    // Para CPF: só valida se realmente mudou (considerando '', null e undefined como iguais)
    const newCpf = normalize(updateProfileDto.cpf);
    const currentCpf = normalize(user.cpf);
    if (newCpf && newCpf !== currentCpf) {
      console.log('📄 Validando CPF:', newCpf, 'vs atual:', currentCpf);
      await this.validarSeCPFEhUnico(newCpf, userId);
    }
    
    // Para telefone: só valida se realmente mudou (considerando '', null e undefined como iguais)
    const newPhone = normalize(updateProfileDto.phone);
    const currentPhone = normalize(user.phone);
    if (newPhone && newPhone !== currentPhone) {
      console.log('📱 Validando telefone:', newPhone, 'vs atual:', currentPhone);
      await this.validarSePhoneEhUnico(newPhone, userId);
    }

    // Preparar dados para atualização (apenas campos permitidos)
    const updateData: Prisma.UserUpdateInput = {};
    
    if (updateProfileDto.name !== undefined) updateData.name = updateProfileDto.name;
    if (updateProfileDto.email !== undefined) updateData.email = updateProfileDto.email;
    if (updateProfileDto.cpf !== undefined) updateData.cpf = updateProfileDto.cpf;
    if (updateProfileDto.phone !== undefined) updateData.phone = updateProfileDto.phone;
    if (updateProfileDto.address !== undefined) updateData.address = updateProfileDto.address;
    if (updateProfileDto.city !== undefined) updateData.city = updateProfileDto.city;
    if (updateProfileDto.state !== undefined) updateData.state = updateProfileDto.state;
    if (updateProfileDto.zipCode !== undefined) updateData.zipCode = updateProfileDto.zipCode;
    if (updateProfileDto.profilePicture !== undefined) updateData.profilePicture = updateProfileDto.profilePicture;

    // Atualizar usuário
    const updatedUser = await this.userRepository.atualizar({ id: userId }, updateData);

    return updatedUser;
  }
}
