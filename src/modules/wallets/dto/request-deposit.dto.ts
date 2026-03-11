import {
  IsNumber,
  IsPositive,
  IsString,
  IsOptional,
  Min,
  IsIn,
} from 'class-validator';

export type DepositMethod = 'pix' | 'boleto' | 'credit_card';

export class RequestDepositDto {
  @IsNumber()
  @Min(5, { message: 'Valor mínimo para depósito é R$ 5,00' })
  @IsPositive()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  /** Forma de pagamento: pix (padrão), boleto ou credit_card */
  @IsOptional()
  @IsIn(['pix', 'boleto', 'credit_card'], {
    message: 'method deve ser pix, boleto ou credit_card',
  })
  method?: DepositMethod;
}
