import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CaslAbilityService } from '../../casl/casl-ability/casl-ability.service';
import { packRules } from '@casl/ability/extra';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { IAuthResponse, IRegisterResponse, ITokenPayload } from '../interfaces';
import { RefreshTokenService } from './refresh-token.service';
import { AuditService } from './audit.service';
import { SecurityService } from './security.service';
import { AuthValidator } from '../validators/auth.validator';
import { MessagesService } from '../../common/messages/messages.service';
import { Request } from 'express';
import { UserRepository } from '../../../modules/users/repositories/user.repository';
import { UserValidator } from '../../../modules/users/validators/user.validator';
import { UserQueryService } from '../../../modules/users/services/user-query.service';
import { UserPermissionService } from '../../../modules/users/services/user-permission.service';
import { UserFactory } from '../../../modules/users/factories/user.factory';
import { WalletsService } from '../../../modules/wallets/wallets.service';
import { Roles } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly abilityService: CaslAbilityService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly auditService: AuditService,
    private readonly securityService: SecurityService,
    private readonly authValidator: AuthValidator,
    private readonly userRepository: UserRepository,
    private readonly userValidator: UserValidator,
    private readonly userQueryService: UserQueryService,
    private readonly userPermissionService: UserPermissionService,
    private readonly userFactory: UserFactory,
    @Inject(forwardRef(() => WalletsService))
    private readonly walletsService: WalletsService,
  ) {}

  /**
   * Realiza login do usuário
   */
  async login(loginDto: LoginDto, request?: Request): Promise<IAuthResponse> {
    try {
      // Validar credenciais usando AuthValidator
      const user = await this.authValidator.validateCredentials(loginDto);

      // Análise de segurança se request estiver disponível
      if (request) {
        const securityEvents = await this.securityService.analyzeLoginActivity(
          user.id,
          request,
          true,
        );

        if (securityEvents.length > 0) {
          await this.securityService.processSecurityEvents(
            securityEvents,
            request,
          );
        }
      }

      // Gerar abilities do usuário
      const ability = this.abilityService.createForUser(user);

      // Criar payload do token
      const payload: ITokenPayload = {
        name: user.name,
        email: user.email,
        role: user.role,
        sub: user.id,
        permissions: packRules(ability.rules),
      };

      // Gerar access token
      const access_token = this.jwtService.sign(payload);
      const expires_in = 2 * 60 * 60; // 2h em segundos

      // Gerar refresh token
      const { refresh_token } = this.refreshTokenService.generate(user);

      // Log de sucesso
      if (request) {
        await this.auditService.logLoginSuccess(user.id, request, {
          role: user.role,
          companyId: user.companyId || null,
        });
      }

      return {
        access_token,
        refresh_token,
        expires_in,
        token_type: 'Bearer',
        // user: {
        //   id: user.id,
        //   name: user.name,
        //   email: user.email,
        //   role: user.role,
        // },
      };
    } catch (error) {
      // Log de falha se request estiver disponível
      if (request) {
        await this.auditService.logLoginFailed(
          loginDto.login,
          request,
          error.message,
        );
      }
      throw error;
    }
  }

  /**
   * Registra um novo usuário
   */
  async register(
    registerDto: RegisterDto,
    request?: Request,
  ): Promise<IRegisterResponse> {
    try {
      // Validar se email já existe
      await this.userValidator.validarSeEmailEhUnico(registerDto.email);

      // Hash da senha
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Criar dados do usuário
      const userData = {
        name: this.normalizeName(registerDto.name),
        email: registerDto.email.trim().toLowerCase(),
        password: hashedPassword,
        role: Roles.USER, // Usuário comum do app
        phone: registerDto.phone || null,
        status: 'ACTIVE' as const,
      };

      // Criar usuário no banco
      const user = await this.userRepository.criar(userData);

      // 🎁 Criar carteira automaticamente para o novo usuário
      try {
        await this.walletsService.create({
          userId: user.id,
        });
        console.log(`✅ Carteira criada automaticamente para usuário ${user.email}`);
      } catch (error) {
        console.error(`❌ Erro ao criar carteira para usuário ${user.email}:`, error.message);
        // Não falhar o registro se a carteira falhar
        // A carteira pode ser criada depois via findOrCreateByUserId
      }

      // Log de sucesso do registro
      if (request) {
        await this.auditService.logLoginSuccess(user.id, request, {
          role: user.role,
          companyId: user.companyId || null,
        });
      }

      // Retornar apenas confirmação de sucesso
      return {
        success: true,
        message: 'Usuário registrado com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      // Log de falha se request estiver disponível
      if (request) {
        await this.auditService.logLoginFailed(
          registerDto.email,
          request,
          error.message,
        );
      }
      throw error;
    }
  }

  private normalizeName(name: string): string {
    if (!name) {
      return '';
    }

    return name
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
