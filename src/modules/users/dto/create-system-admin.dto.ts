import { IsEnum } from 'class-validator';
import { Roles } from '@prisma/client';
import { VALIDATION_MESSAGES } from '../../../shared/common/messages';
import { BaseUserDto } from './base-user.dto';

export class CreateSystemAdminDto extends BaseUserDto {
  @IsEnum(Roles, {
    message: VALIDATION_MESSAGES.REQUIRED.ROLE,
  })
  role: Roles; // Deve ser Roles.ADMIN
}
