import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+86 138 0000 0000', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Beijing, China', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: '/uploads/avatars/profile.png', required: false })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ example: 'https://example.com', required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ example: 'https://github.com/johndoe', required: false })
  @IsOptional()
  @IsString()
  github?: string;

  @ApiProperty({ example: 'https://linkedin.com/in/johndoe', required: false })
  @IsOptional()
  @IsString()
  linkedin?: string;

  @ApiProperty({ example: 'Experienced software engineer...', required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ example: 'Passionate about building great products...', required: false })
  @IsOptional()
  @IsString()
  selfEvaluation?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
