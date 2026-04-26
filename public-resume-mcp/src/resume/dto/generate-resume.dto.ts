import { IsString, IsIn, IsOptional } from 'class-validator';

export class GenerateResumeDto {
  @IsString()
  jdText: string;

  @IsString()
  position: string;

  @IsIn(['ko', 'en'])
  @IsOptional()
  language: 'ko' | 'en' = 'ko';

  @IsString()
  @IsOptional()
  companyName?: string;
}
