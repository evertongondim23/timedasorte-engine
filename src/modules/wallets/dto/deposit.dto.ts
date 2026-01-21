import { IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}

