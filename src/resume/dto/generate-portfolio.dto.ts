import { IsIn, IsOptional } from 'class-validator';

export class GeneratePortfolioDto {
  @IsIn(['ko', 'en'])
  @IsOptional()
  language: 'ko' | 'en' = 'ko';
}
