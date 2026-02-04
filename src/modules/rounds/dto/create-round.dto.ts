import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoundCategory } from '@prisma/client';

export class CreateRoundDto {
  @ApiProperty({
    description: 'Categoria da rodada',
    enum: RoundCategory,
    example: RoundCategory.PTM,
  })
  @IsEnum(RoundCategory)
  category: RoundCategory;

  @ApiProperty({
    description: 'Data/hora agendada para publicação do resultado',
    example: '2026-01-22T14:00:00Z',
  })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({
    description: 'Referência externa (opcional, para integração com fonte oficial)',
    example: 'LOTERIA-RJ-2026-01-22-14H',
  })
  @IsOptional()
  @IsString()
  externalRef?: string;
}
