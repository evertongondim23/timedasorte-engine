import { IsNumber, IsPositive, IsString, IsOptional, Min } from 'class-validator';

export class RequestDepositDto {
  @IsNumber()
  @Min(5, { message: 'Valor mínimo para depósito é R$ 5,00' })
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}
