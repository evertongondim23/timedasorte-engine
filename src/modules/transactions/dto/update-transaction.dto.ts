import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create-transaction.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { TransactionStatus } from '@prisma/client';

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;
}

