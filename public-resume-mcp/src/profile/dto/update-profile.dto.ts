import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProjectDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  period?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  techStack: string[];

  @IsString()
  @IsOptional()
  achievements?: string;

  @IsString()
  @IsOptional()
  githubUrl?: string;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  @IsOptional()
  projects?: ProjectDto[];
}
