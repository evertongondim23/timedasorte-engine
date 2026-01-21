import { PartialType } from '@nestjs/mapped-types';
import { CreateWalletDto } from './create-wallet.dto';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateWalletDto extends PartialType(CreateWalletDto) {
  @IsNumber()
  @IsOptional()
  @Min(0)
  balance?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  blockedBalance?: number;
}

