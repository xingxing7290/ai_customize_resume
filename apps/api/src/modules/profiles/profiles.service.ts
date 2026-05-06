import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import pdfParse from 'pdf-parse';
import { FileLoggerService } from '../../common/logger/file-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfileDto, UpdateProfileDto } from './dto';
import { AiService } from '../ai/ai.service';
import { SettingsService } from '../settings/settings.service';

type ParsedResumeImport = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  educationRecords?: Array<Record<string, unknown>>;
  workExperiences?: Array<Record<string, unknown>>;
  projectExperiences?: Array<Record<string, unknown>>;
  skillRecords?: Array<Record<string, unknown>>;
  certificateRecords?: Array<Record<string, unknown>>;
};

@Injectable()
export class ProfilesService {
  constructor(
    private prisma: PrismaService,
    private fileLogger: FileLoggerService,
    private aiService: AiService,
    private settingsService: SettingsService,
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

    const parsedData = await this.aiService.parseResumeFromText(
      userId,
      resumeText.slice(0, 30000),
      await this.settingsService.getRuntimeAiSetting(userId),
    );

    this.fileLogger.operation('profile_pdf_import_parsed', {
      userId,
      summary: this.summarizeParsedResume(parsedData),
    });

    const created = await this.createProfileFromParsedResume(userId, parsedData);

    this.fileLogger.operation('profile_pdf_import_created', {
      userId,
      profileId: created.id,
      imported: {
        educationRecords: created.educationRecords.length,
        workExperiences: created.workExperiences.length,
        projectExperiences: created.projectExperiences.length,
        skillRecords: created.skillRecords.length,
        certificateRecords: created.certificateRecords.length,
      },
    });

    return created;
  }

  private async createProfileFromParsedResume(userId: string, parsedData: ParsedResumeImport) {
    const name = this.scalar(parsedData.name) || 'Imported Resume';
    const email = this.scalar(parsedData.email) || `imported-${Date.now()}@local.resume`;
    const profileCount = await this.prisma.resumeProfile.count({ where: { userId } });

    return this.prisma.resumeProfile.create({
      data: {
        userId,
        name,
        email,
        phone: this.scalar(parsedData.phone),
        location: this.scalar(parsedData.location),
        summary: this.scalar(parsedData.summary),
        isDefault: profileCount === 0,
        educationRecords: {
          create: this.normalizeEducation(parsedData.educationRecords),
        },
        workExperiences: {
          create: this.normalizeWork(parsedData.workExperiences),
        },
        projectExperiences: {
          create: this.normalizeProjects(parsedData.projectExperiences),
        },
        skillRecords: {
          create: this.normalizeSkills(parsedData.skillRecords),
        },
        certificateRecords: {
          create: this.normalizeCertificates(parsedData.certificateRecords),
        },
      },
      include: {
        educationRecords: { orderBy: { sortOrder: 'asc' } },
        workExperiences: { orderBy: { sortOrder: 'asc' } },
        projectExperiences: { orderBy: { sortOrder: 'asc' } },
        skillRecords: { orderBy: { sortOrder: 'asc' } },
        certificateRecords: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  private normalizeEducation(records?: Array<Record<string, unknown>>) {
    return (records || [])
      .map((item, index) => ({
        school: this.scalar(item.school) || '',
        degree: this.scalar(item.degree) || '',
        major: this.scalar(item.major),
        startDate: this.scalar(item.startDate) || '',
        endDate: this.scalar(item.endDate),
        gpa: this.scalar(item.gpa),
        description: this.scalar(item.description),
        sortOrder: index,
      }))
      .filter((item) => item.school);
  }

  private normalizeWork(records?: Array<Record<string, unknown>>) {
    return (records || [])
      .map((item, index) => ({
        company: this.scalar(item.company) || '',
        title: this.scalar(item.title) || '',
        location: this.scalar(item.location),
        startDate: this.scalar(item.startDate) || '',
        endDate: this.scalar(item.endDate),
        isCurrent: Boolean(item.isCurrent),
        description: this.scalar(item.description),
        highlights: this.listText(item.highlights),
        techStack: this.listText(item.techStack),
        sortOrder: index,
      }))
      .filter((item) => item.company || item.title);
  }

  private normalizeProjects(records?: Array<Record<string, unknown>>) {
    return (records || [])
      .map((item, index) => ({
        name: this.scalar(item.name) || '',
        role: this.scalar(item.role),
        startDate: this.scalar(item.startDate),
        endDate: this.scalar(item.endDate),
        description: this.scalar(item.description),
        highlights: this.listText(item.highlights),
        techStack: this.listText(item.techStack),
        link: this.scalar(item.link),
        sortOrder: index,
      }))
      .filter((item) => item.name);
  }

  private normalizeSkills(records?: Array<Record<string, unknown>>) {
    return (records || [])
      .map((item, index) => ({
        name: this.scalar(item.name) || '',
        category: this.scalar(item.category),
        level: this.scalar(item.level),
        sortOrder: index,
      }))
      .filter((item) => item.name);
  }

  private normalizeCertificates(records?: Array<Record<string, unknown>>) {
    return (records || [])
      .map((item, index) => ({
        name: this.scalar(item.name) || '',
        issuer: this.scalar(item.issuer),
        date: this.scalar(item.date),
        description: this.scalar(item.description),
        link: this.scalar(item.link),
        sortOrder: index,
      }))
      .filter((item) => item.name);
  }

  private summarizeParsedResume(parsedData: ParsedResumeImport) {
    return {
      hasName: Boolean(parsedData.name),
      hasEmail: Boolean(parsedData.email),
      educationRecords: parsedData.educationRecords?.length || 0,
      workExperiences: parsedData.workExperiences?.length || 0,
      projectExperiences: parsedData.projectExperiences?.length || 0,
      skillRecords: parsedData.skillRecords?.length || 0,
      certificateRecords: parsedData.certificateRecords?.length || 0,
    };
  }

  private scalar(value: unknown) {
    if (value === undefined || value === null) return undefined;
    const text = String(value).replace(/\s+/g, ' ').trim();
    return text || undefined;
  }

  private listText(value: unknown) {
    if (Array.isArray(value)) {
      return value.map((item) => this.scalar(item)).filter(Boolean).join('\n') || undefined;
    }
    return this.scalar(value);
  }
}
