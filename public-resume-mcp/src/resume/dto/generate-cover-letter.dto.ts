import { IsString, IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class GenerateCoverLetterDto {
  @IsString()
  @IsNotEmpty()
  jdText: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsIn(['ko', 'en'])
  @IsOptional()
  language: 'ko' | 'en' = 'ko';
}
