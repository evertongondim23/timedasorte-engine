import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  IsBoolean,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
  Max,
} from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(99, { each: true })
  jerseys: number[]; // Exatamente 4 camisas por time

  @IsString()
  @IsOptional()
  shield?: string; // Emoji ou URL do escudo

  @IsString()
  @IsOptional()
  color?: string; // Cor em hexadecimal (#RRGGBB)

  @IsString()
  @IsOptional()
  animal?: string; // Nome do animal

  @IsString()
  @IsOptional()
  animalEmoji?: string; // Emoji do animal

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
