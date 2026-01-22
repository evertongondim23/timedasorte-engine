import { IsEnum, IsNumber, IsArray, IsInt, Min, Max, IsOptional, ValidateIf, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BetModality } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateBetDto {
  @ApiProperty({
    description: 'ID da rodada (draw) para a qual a aposta será feita',
    example: 'cl9abc123xyz',
  })
  drawId: string;

  @ApiProperty({
    description: 'Modalidade da aposta',
    enum: BetModality,
    example: BetModality.TIME,
  })
  @IsEnum(BetModality)
  modality: BetModality;

  @ApiProperty({
    description: 'Valor da aposta em R$',
    example: 10.00,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Valor mínimo da aposta é R$ 1,00' })
  amount: number;

  // ========================================
  // CAMPOS ESPECÍFICOS POR MODALIDADE
  // ========================================

  @ApiPropertyOptional({
    description: 'Array de IDs de times (para TIME, DUPLA, TERNO)',
    type: [Number],
    example: [1, 5, 12],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(25, { each: true })
  @ValidateIf((o) => [BetModality.TIME, BetModality.DUPLA, BetModality.TERNO, BetModality.PASSE].includes(o.modality))
  teamIds?: number[];

  @ApiPropertyOptional({
    description: 'Array de números de camisa/dezenas (para CAMISA, PASSE)',
    type: [Number],
    example: [34, 56, 89],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(99, { each: true })
  @ValidateIf((o) => [BetModality.CAMISA, BetModality.PASSE].includes(o.modality))
  jerseys?: number[];

  @ApiPropertyOptional({
    description: 'Número da centena (para CENTENA)',
    example: 234,
    minimum: 0,
    maximum: 999,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  @ValidateIf((o) => o.modality === BetModality.CENTENA)
  centena?: number;

  @ApiPropertyOptional({
    description: 'Número do milhar (para MILHAR)',
    example: 1234,
    minimum: 0,
    maximum: 9999,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  @ValidateIf((o) => o.modality === BetModality.MILHAR)
  milhar?: number;
}
