import {
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import {
  IsCPF,
  IsPhoneNumberBR,
  IsStrongPassword,
  IsUniqueEmail,
  IsUniqueCPF,
} from '../../../shared/validators';
import { VALIDATION_MESSAGES } from '../../../shared/common/messages';
import { UserStatus } from '@prisma/client';

export class BaseUserDto {
  @IsString({ message: VALIDATION_MESSAGES.REQUIRED.NAME })
  @MinLength(2, { message: VALIDATION_MESSAGES.LENGTH.NAME_MIN })
  name: string;

  @IsEmail({}, { message: VALIDATION_MESSAGES.FORMAT.EMAIL_INVALID })
  @IsUniqueEmail({ message: VALIDATION_MESSAGES.UNIQUENESS.EMAIL_EXISTS })
  email: string;

  @IsStrongPassword({ message: VALIDATION_MESSAGES.FORMAT.PASSWORD_WEAK })
  password: string;

  @IsOptional()
  @IsCPF({ message: VALIDATION_MESSAGES.FORMAT.CPF_INVALID })
  @IsUniqueCPF({ message: VALIDATION_MESSAGES.UNIQUENESS.CPF_EXISTS })
  cpf?: string;

  @IsOptional()
  @IsPhoneNumberBR({ message: VALIDATION_MESSAGES.FORMAT.PHONE_INVALID })
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

  @IsOptional()
  @IsEnum(UserStatus, { message: VALIDATION_MESSAGES.FORMAT.ENUM_INVALID })
  status?: UserStatus;
}
