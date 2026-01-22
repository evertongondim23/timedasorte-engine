import { IsArray, IsEnum, IsOptional, IsString, ArrayMinSize, ArrayMaxSize, Min, Max, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResultSource } from '@prisma/client';
import { Type } from 'class-transformer';

export class PublishResultDto {
  @ApiProperty({
    description: 'Array de 5 milhares (0000-9999)',
    example: [1234, 5678, 9012, 3456, 7890],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(9999, { each: true })
  milhares: number[];

  @ApiPropertyOptional({
    description: 'Fonte do resultado',
    enum: ResultSource,
    default: ResultSource.ADMIN,
  })
  @IsOptional()
  @IsEnum(ResultSource)
  source?: ResultSource;

  @ApiPropertyOptional({
    description: 'Referência externa (para ResultSource.OFFICIAL)',
    example: 'LOTERIA-RJ-CERT-12345',
  })
  @IsOptional()
  @IsString()
  externalRef?: string;
}
