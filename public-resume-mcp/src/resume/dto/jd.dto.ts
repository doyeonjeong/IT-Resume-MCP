import { IsString } from 'class-validator';

export class JdDto {
  @IsString()
  jdText: string;
}
