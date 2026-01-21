import { IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';

export class WithdrawDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}

