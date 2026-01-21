import { IsOptional, IsEnum } from 'class-validator';
import { Roles } from '@prisma/client';
import { IsCUID } from '../../../shared/validators';
import { VALIDATION_MESSAGES } from '../../../shared/common/messages';
import { BaseUserDto } from './base-user.dto';

export class CreateAdminDto extends BaseUserDto {
  @IsOptional()
  @IsCUID({ message: VALIDATION_MESSAGES.FORMAT.UUID_INVALID })
  companyId?: string;

  @IsEnum(Roles, { message: VALIDATION_MESSAGES.REQUIRED.ROLE })
  role: Roles; // Deve ser Roles.ADMIN
}
