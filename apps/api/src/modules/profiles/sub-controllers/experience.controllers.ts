import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

// Education DTOs
class CreateEducationDto {
  @IsString() school: string;
  @IsString() degree: string;
  @IsOptional() @IsString() major?: string;
  @IsString() startDate: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsString() gpa?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

class UpdateEducationDto {
  @IsOptional() @IsString() school?: string;
  @IsOptional() @IsString() degree?: string;
  @IsOptional() @IsString() major?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsString() gpa?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

// Work Experience DTOs
class CreateWorkExperienceDto {
  @IsString() company: string;
  @IsString() title: string;
  @IsOptional() @IsString() location?: string;
  @IsString() startDate: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsBoolean() isCurrent?: boolean;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() highlights?: string;
  @IsOptional() @IsString() techStack?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

class UpdateWorkExperienceDto {
  @IsOptional() @IsString() company?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsBoolean() isCurrent?: boolean;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() highlights?: string;
  @IsOptional() @IsString() techStack?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

// Project Experience DTOs
class CreateProjectExperienceDto {
  @IsString() name: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() highlights?: string;
  @IsOptional() @IsString() techStack?: string;
  @IsOptional() @IsString() link?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

class UpdateProjectExperienceDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() highlights?: string;
  @IsOptional() @IsString() techStack?: string;
  @IsOptional() @IsString() link?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

// Skill DTOs
class CreateSkillDto {
  @IsString() name: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

class UpdateSkillDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

// Certificate DTOs
class CreateCertificateDto {
  @IsString() name: string;
  @IsOptional() @IsString() issuer?: string;
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() link?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

class UpdateCertificateDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() issuer?: string;
  @IsOptional() @IsString() date?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() link?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

// Education Controller
@ApiTags('profiles/education')
@ApiBearerAuth()
@Controller('profiles/:profileId/education')
@UseGuards(JwtAuthGuard)
export class EducationController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: '添加教育经历' })
  async create(@CurrentUser('id') userId: string, @Param('profileId') profileId: string, @Body() dto: CreateEducationDto) {
    return this.prisma.educationRecord.create({ data: { profileId, ...dto } });
  }

  @Get()
  @ApiOperation({ summary: '获取教育经历列表' })
  async findAll(@Param('profileId') profileId: string) {
    return this.prisma.educationRecord.findMany({ where: { profileId }, orderBy: { sortOrder: 'asc' } });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取教育经历详情' })
  async findOne(@Param('id') id: string) {
    return this.prisma.educationRecord.findUnique({ where: { id } });
  }

  @Put(':id')
  @ApiOperation({ summary: '更新教育经历' })
  async update(@Param('id') id: string, @Body() dto: UpdateEducationDto) {
    return this.prisma.educationRecord.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除教育经历' })
  async remove(@Param('id') id: string) {
    return this.prisma.educationRecord.delete({ where: { id } });
  }
}

// Work Experience Controller
@ApiTags('profiles/work')
@ApiBearerAuth()
@Controller('profiles/:profileId/work')
@UseGuards(JwtAuthGuard)
export class WorkExperienceController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: '添加工作经历' })
  async create(@CurrentUser('id') userId: string, @Param('profileId') profileId: string, @Body() dto: CreateWorkExperienceDto) {
    return this.prisma.workExperience.create({ data: { profileId, ...dto } });
  }

  @Get()
  @ApiOperation({ summary: '获取工作经历列表' })
  async findAll(@Param('profileId') profileId: string) {
    return this.prisma.workExperience.findMany({ where: { profileId }, orderBy: { sortOrder: 'asc' } });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取工作经历详情' })
  async findOne(@Param('id') id: string) {
    return this.prisma.workExperience.findUnique({ where: { id } });
  }

  @Put(':id')
  @ApiOperation({ summary: '更新工作经历' })
  async update(@Param('id') id: string, @Body() dto: UpdateWorkExperienceDto) {
    return this.prisma.workExperience.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除工作经历' })
  async remove(@Param('id') id: string) {
    return this.prisma.workExperience.delete({ where: { id } });
  }
}

// Project Experience Controller
@ApiTags('profiles/project')
@ApiBearerAuth()
@Controller('profiles/:profileId/project')
@UseGuards(JwtAuthGuard)
export class ProjectExperienceController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: '添加项目经历' })
  async create(@CurrentUser('id') userId: string, @Param('profileId') profileId: string, @Body() dto: CreateProjectExperienceDto) {
    return this.prisma.projectExperience.create({ data: { profileId, ...dto } });
  }

  @Get()
  @ApiOperation({ summary: '获取项目经历列表' })
  async findAll(@Param('profileId') profileId: string) {
    return this.prisma.projectExperience.findMany({ where: { profileId }, orderBy: { sortOrder: 'asc' } });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取项目经历详情' })
  async findOne(@Param('id') id: string) {
    return this.prisma.projectExperience.findUnique({ where: { id } });
  }

  @Put(':id')
  @ApiOperation({ summary: '更新项目经历' })
  async update(@Param('id') id: string, @Body() dto: UpdateProjectExperienceDto) {
    return this.prisma.projectExperience.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除项目经历' })
  async remove(@Param('id') id: string) {
    return this.prisma.projectExperience.delete({ where: { id } });
  }
}

// Skill Controller
@ApiTags('profiles/skill')
@ApiBearerAuth()
@Controller('profiles/:profileId/skill')
@UseGuards(JwtAuthGuard)
export class SkillController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: '添加技能' })
  async create(@CurrentUser('id') userId: string, @Param('profileId') profileId: string, @Body() dto: CreateSkillDto) {
    return this.prisma.skillRecord.create({ data: { profileId, ...dto } });
  }

  @Get()
  @ApiOperation({ summary: '获取技能列表' })
  async findAll(@Param('profileId') profileId: string) {
    return this.prisma.skillRecord.findMany({ where: { profileId }, orderBy: { sortOrder: 'asc' } });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取技能详情' })
  async findOne(@Param('id') id: string) {
    return this.prisma.skillRecord.findUnique({ where: { id } });
  }

  @Put(':id')
  @ApiOperation({ summary: '更新技能' })
  async update(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.prisma.skillRecord.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除技能' })
  async remove(@Param('id') id: string) {
    return this.prisma.skillRecord.delete({ where: { id } });
  }
}

// Certificate Controller
@ApiTags('profiles/certificate')
@ApiBearerAuth()
@Controller('profiles/:profileId/certificate')
@UseGuards(JwtAuthGuard)
export class CertificateController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: '添加证书' })
  async create(@CurrentUser('id') userId: string, @Param('profileId') profileId: string, @Body() dto: CreateCertificateDto) {
    return this.prisma.certificateRecord.create({ data: { profileId, ...dto } });
  }

  @Get()
  @ApiOperation({ summary: '获取证书列表' })
  async findAll(@Param('profileId') profileId: string) {
    return this.prisma.certificateRecord.findMany({ where: { profileId }, orderBy: { sortOrder: 'asc' } });
  }

  @Get(':id')
  @ApiOperation({ summary: '获取证书详情' })
  async findOne(@Param('id') id: string) {
    return this.prisma.certificateRecord.findUnique({ where: { id } });
  }

  @Put(':id')
  @ApiOperation({ summary: '更新证书' })
  async update(@Param('id') id: string, @Body() dto: UpdateCertificateDto) {
    return this.prisma.certificateRecord.update({ where: { id }, data: dto });
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除证书' })
  async remove(@Param('id') id: string) {
    return this.prisma.certificateRecord.delete({ where: { id } });
  }
}