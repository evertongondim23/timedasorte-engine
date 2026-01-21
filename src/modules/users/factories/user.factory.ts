import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { Roles, UserStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { CreateSystemAdminDto } from '../dto/create-system-admin.dto';
import { CreateAdminDto } from '../dto/create-admin.dto';

@Injectable()
export class UserFactory {
  private criptografarPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

  private criarUsuarioBase(dto: any, role: Roles): Prisma.UserCreateInput {
    return {
      name: dto.name,
      email: dto.email.trim().toLowerCase(),
      cpf: dto?.cpf,
      phone: dto?.phone,
      address: dto?.address,
      city: dto?.city,
      state: dto?.state,
      zipCode: dto?.zipCode,
      profilePicture: dto?.profilePicture,
      status: dto?.status,
      password: this.criptografarPassword(dto.password),
      role: role,
      company: dto.companyId ? {
        connect: { id: dto.companyId },
      } : undefined,
    };
  }

  criarAdmin(dto: CreateAdminDto): Prisma.UserCreateInput {
    return this.criarUsuarioBase(dto, Roles.ADMIN);
  }

  criarUser(dto: any): Prisma.UserCreateInput {
    return this.criarUsuarioBase(dto, Roles.USER);
  }
}
