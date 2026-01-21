import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../../shared/common/messages';

/**
 * DTO para atualização de perfil próprio
 * Não permite alterar campos sensíveis como role, status, password
 * Validações de unicidade são feitas no service para evitar conflitos ao manter valores iguais
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.NAME })
  @MinLength(2, { message: VALIDATION_MESSAGES.LENGTH.NAME_MIN })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: VALIDATION_MESSAGES.FORMAT.EMAIL_INVALID })
  email?: string;

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FORMAT.FIELD_INVALID })
  cpf?: string;

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FORMAT.FIELD_INVALID })
  phone?: string;

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FORMAT.FIELD_INVALID })
  address?: string;

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FORMAT.FIELD_INVALID })
  city?: string;

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FORMAT.FIELD_INVALID })
  state?: string;

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FORMAT.FIELD_INVALID })
  zipCode?: string;

  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.FORMAT.FIELD_INVALID })
  profilePicture?: string;
}
