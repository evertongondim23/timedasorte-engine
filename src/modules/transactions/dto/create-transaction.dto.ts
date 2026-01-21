import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';
import { TransactionType, TransactionStatus, PaymentMethod } from '@prisma/client';

export class CreateTransactionDto {
  @IsString()
  userId: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  referenceId?: string; // ID de referência externa (ex: ID do pagamento)
}

