import { IsNumber, IsPositive, IsString, IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class DepositDto {
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
  externalId?: string; // ID da transação no gateway de pagamento
}

