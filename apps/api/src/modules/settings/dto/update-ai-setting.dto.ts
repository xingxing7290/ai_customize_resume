import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAiSettingDto {
  @IsOptional()
  @IsIn(['deepseek'])
  provider?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  apiKey?: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
