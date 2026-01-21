import {
  IsEnum,
  IsOptional,
  IsDateString,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { TransactionType, TransactionStatus, PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';

export class FilterTransactionsDto {
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;
}

