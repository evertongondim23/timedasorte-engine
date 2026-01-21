import { IsNumber, IsPositive, IsString, IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class WithdrawDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  pixKey?: string; // Chave PIX para saque

  @IsString()
  @IsOptional()
  bankAccount?: string; // Conta bancária para saque
}

