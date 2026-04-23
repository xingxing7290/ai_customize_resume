import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ResumeVersionStatus {
  DRAFT = 'DRAFT',
  GENERATING = 'GENERATING',
  GENERATE_FAILED = 'GENERATE_FAILED',
  READY_EDIT = 'READY_EDIT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateResumeVersionDto {
  @ApiProperty({ description: '简历名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '关联的主档案ID' })
  @IsString()
  profileId: string;

  @ApiPropertyOptional({ description: '关联的求职目标ID' })
  @IsOptional()
  @IsString()
  jobTargetId?: string;

  @ApiPropertyOptional({ description: '源版本ID' })
  @IsOptional()
  @IsString()
  sourceVersionId?: string;
}
