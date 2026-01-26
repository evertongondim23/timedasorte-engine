import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { CompaniesService } from '../../companies/companies.service';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../shared/common/errors';

@Injectable()
export class UserValidator {
  constructor(
    private userRepository: UserRepository,
    private companiesService: CompaniesService,
  ) {}

  async validarSeEmailEhUnico(email: string, excludeUserId?: string) {
    const user = await this.userRepository.buscarUnico({ email });
    if (user && user.id !== excludeUserId) {
      throw new ConflictError('Email já está em uso');
    }
  }

  async validarSeCPFEhUnico(cpf: string, excludeUserId?: string) {
    if (!cpf) return; // CPF é opcional

    // Verifica se CPF já existe
    const user = await this.userRepository.buscarPrimeiro({ cpf });
    if (user && user.id !== excludeUserId) {
      console.log('❌ CPF já cadastrado para o usuário:', user.email, '(ID:', user.id, ')');
      throw new ConflictError(
        `CPF já está cadastrado. Se este é seu CPF, entre em contato com o suporte informando o código: ${user.id.substring(0, 8)}`
      );
    }
  }

  async validarSePhoneEhUnico(phone: string, excludeUserId?: string) {
    if (!phone) return; // Telefone é opcional

    // Verifica se telefone já existe
    const user = await this.userRepository.buscarPrimeiro({ phone });
    if (user && user.id !== excludeUserId) {
      console.log('❌ Telefone já cadastrado para o usuário:', user.email, '(ID:', user.id, ')');
      throw new ConflictError(
        `Telefone já está cadastrado. Se este é seu telefone, entre em contato com o suporte informando o código: ${user.id.substring(0, 8)}`
      );
    }
  }

  async validarSeCompanyExiste(companyId: string) {
    await this.companiesService.validarExistencia(companyId);
  }

  async validarSeUserExiste(id: string) {
    const user = await this.userRepository.buscarUnico({ id });
    if (!user) {
      throw new NotFoundError('User', id, 'id');
    }
    return user;
  }

  async validarSeUserPodeSerDeletado(id: string) {
    // Validação simplificada - pode ser expandida futuramente
    // para verificar pets, posts, etc se necessário
    const user = await this.userRepository.buscarUnico({ id });
    if (!user) {
      throw new NotFoundError('User', id, 'id');
    }
  }
}
