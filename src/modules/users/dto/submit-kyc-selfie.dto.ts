import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class SubmitKycSelfieDto {
  @IsString()
  @IsNotEmpty()
  fileId: string;

  @IsString()
  @IsIn(['CNH', 'RG', 'CPF'])
  documentType: string;
}

