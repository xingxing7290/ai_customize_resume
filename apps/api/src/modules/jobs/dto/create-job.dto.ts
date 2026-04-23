import { IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum JobTargetStatus {
  INIT = 'INIT',
  FETCHING = 'FETCHING',
  FETCH_SUCCESS = 'FETCH_SUCCESS',
  FETCH_FAILED = 'FETCH_FAILED',
  PARSING = 'PARSING',
  PARSE_SUCCESS = 'PARSE_SUCCESS',
  PARSE_FAILED = 'PARSE_FAILED',
}

export class CreateJobTargetDto {
  @ApiPropertyOptional({ description: '职位来源URL' })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiPropertyOptional({ description: '原始JD文本' })
  @IsOptional()
  @IsString()
  rawJdText?: string;
}
