import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { FileLoggerService } from '../../common/logger/file-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfileDto, UpdateProfileDto } from './dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ProfilesService {
  constructor(
    private prisma: PrismaService,
    private fileLogger: FileLoggerService,
    private aiService: AiService,
  ) {}

  async create(userId: string, dto: CreateProfileDto) {
    return this.prisma.resumeProfile.create({
      data: {
        userId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        location: dto.location,
        avatarUrl: dto.avatarUrl,
        website: dto.website,
        github: dto.github,
        linkedin: dto.linkedin,
        summary: dto.summary,
        selfEvaluation: dto.selfEvaluation,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.resumeProfile.findMany({
      where: { userId },
      include: {
        educationRecords: { orderBy: { sortOrder: 'asc' } },
        workExperiences: { orderBy: { sortOrder: 'asc' } },
        projectExperiences: { orderBy: { sortOrder: 'asc' } },
        skillRecords: { orderBy: { sortOrder: 'asc' } },
        certificateRecords: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async findOne(userId: string, id: string) {
    const profile = await this.prisma.resumeProfile.findFirst({
      where: { id, userId },
      include: {
        educationRecords: { orderBy: { sortOrder: 'asc' } },
        workExperiences: { orderBy: { sortOrder: 'asc' } },
        projectExperiences: { orderBy: { sortOrder: 'asc' } },
        skillRecords: { orderBy: { sortOrder: 'asc' } },
        certificateRecords: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async update(userId: string, id: string, dto: UpdateProfileDto) {
    await this.findOne(userId, id);

    return this.prisma.resumeProfile.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        location: dto.location,
        avatarUrl: dto.avatarUrl,
        website: dto.website,
        github: dto.github,
        linkedin: dto.linkedin,
        summary: dto.summary,
        selfEvaluation: dto.selfEvaluation,
        isDefault: dto.isDefault,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.resumeProfile.delete({
      where: { id },
    });
  }

  async setDefault(userId: string, id: string) {
    await this.findOne(userId, id);

    await this.prisma.resumeProfile.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    return this.prisma.resumeProfile.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async uploadAvatar(userId: string, id: string, file: any) {
    await this.findOne(userId, id);

    if (!file?.buffer) {
      throw new BadRequestException('Avatar file is required');
    }

    const allowedMimeTypes: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
    };
    const extension = allowedMimeTypes[file.mimetype] || extname(file.originalname || '').toLowerCase();

    if (!Object.values(allowedMimeTypes).includes(extension)) {
      throw new BadRequestException('Only JPG, PNG, WEBP, or SVG images are supported');
    }

    const uploadDir = join(process.cwd(), 'uploads', 'avatars');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${id}-${Date.now()}-${randomBytes(4).toString('hex')}${extension}`;
    const filePath = join(uploadDir, filename);
    writeFileSync(filePath, file.buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;
    const updated = await this.prisma.resumeProfile.update({
      where: { id },
      data: { avatarUrl },
    });

    this.fileLogger.operation('profile_avatar_uploaded', {
      userId,
      profileId: id,
      avatarUrl,
      bytes: file.size,
      mimetype: file.mimetype,
    });

    return updated;
  }

  async importFromPdf(userId: string, file: any) {
    if (!file?.buffer) {
      throw new BadRequestException('PDF file is required');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are supported');
    }

    // 动态导入 pdf-parse
    const pdfParse = (await import('pdf-parse')).default;
    const pdfData = await pdfParse(file.buffer);
    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim().length < 50) {
      throw new BadRequestException('PDF content is too short or empty');
    }

    this.fileLogger.operation('profile_pdf_import_started', {
      userId,
      textLength: resumeText.length,
      bytes: file.size,
    });

    // 使用 AI 解析简历文本
    const parsedData = await this.aiService.parseResumeFromText(userId, resumeText);

    this.fileLogger.operation('profile_pdf_import_parsed', {
      userId,
      parsedData,
    });

    return {
      code: 200,
      message: 'Success',
      data: parsedData,
    };
  }
}
