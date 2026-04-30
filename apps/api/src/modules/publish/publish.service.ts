import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { FileLoggerService } from '../../common/logger/file-logger.service';

@Injectable()
export class PublishService {
  constructor(
    private prisma: PrismaService,
    private fileLogger: FileLoggerService,
  ) {}

  private parseJsonArray<T>(value: unknown): T[] {
    if (!value) return [];
    if (Array.isArray(value)) return value as T[];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? (parsed as T[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private toStringArray(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
      } catch {
        return trimmed
          .split(/\r?\n|,|，|;|；|、/)
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }
    return [String(value).trim()].filter(Boolean);
  }

  private normalizeWorkItem(exp: any) {
    const duration = exp?.duration ? String(exp.duration) : '';
    const [durationStart, durationEnd] = duration.split(/\s*[-–—至]\s*/).map((item) => item.trim()).filter(Boolean);
    return {
      ...exp,
      company: exp?.company || exp?.companyName,
      companyName: exp?.companyName || exp?.company,
      title: exp?.title || exp?.role,
      startDate: exp?.startDate || durationStart,
      endDate: exp?.endDate || durationEnd,
      highlights: this.toStringArray(exp?.highlights),
      techStack: this.toStringArray(exp?.techStack),
    };
  }

  private normalizeProjectItem(proj: any) {
    const duration = proj?.duration ? String(proj.duration) : '';
    const [durationStart, durationEnd] = duration.split(/\s*[-–—至]\s*/).map((item) => item.trim()).filter(Boolean);
    return {
      ...proj,
      name: proj?.name || proj?.projectName,
      projectName: proj?.projectName || proj?.name,
      startDate: proj?.startDate || durationStart,
      endDate: proj?.endDate || durationEnd,
      highlights: this.toStringArray(proj?.highlights),
      techStack: this.toStringArray(proj?.techStack),
    };
  }

  private toPublicPreviewData(version: any) {
    return {
      profile: {
        name: version.profile?.name,
        email: version.profile?.email,
        phone: version.profile?.phone ?? undefined,
        location: version.profile?.location ?? undefined,
        avatarUrl: version.profile?.avatarUrl ?? undefined,
        summary: version.profile?.summary ?? undefined,
      },
      educationRecords: (version.profile?.educationRecords || []).map((education: any) => ({
        school: education.school,
        degree: education.degree,
        major: education.major ?? undefined,
        startDate: education.startDate,
        endDate: education.endDate ?? undefined,
        gpa: education.gpa ?? undefined,
        description: education.description ?? undefined,
      })),
      jobTarget: version.jobTarget
        ? {
            parsedJobTitle: version.jobTarget.parsedJobTitle ?? undefined,
            parsedCompanyName: version.jobTarget.parsedCompanyName ?? undefined,
          }
        : undefined,
      contentSummary: version.contentSummary ?? undefined,
      contentSkills: this.parseJsonArray<string>(version.contentSkills),
      contentWorkExperiences: this.parseJsonArray<any>(version.contentWorkExperiences).map((exp: any) => this.normalizeWorkItem(exp)),
      contentProjectExperiences: this.parseJsonArray<any>(version.contentProjectExperiences).map((proj: any) => this.normalizeProjectItem(proj)),
      contentCertificates: this.toStringArray(version.contentCertificates).map((item) => this.formatCertificate(item)).filter(Boolean),
      contentSelfEvaluation: version.contentSelfEvaluation ?? undefined,
    };
  }

  private formatCertificate(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed.startsWith('{')) return trimmed;
      try {
        return this.formatCertificate(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }
    if (typeof value !== 'object') return String(value).trim();

    const item = value as Record<string, unknown>;
    const name = this.scalarString(item.name || item.title || item.certificate || item.award || item.certName);
    const authority = this.scalarString(item.authority || item.issuer || item.organization || item.org);
    const date = this.scalarString(item.date || item.issueDate || item.time);
    const description = this.scalarString(item.description || item.desc || item.detail);
    const link = this.scalarString(item.link || item.url);
    const main = [name, authority, date].filter(Boolean).join(' · ');
    const detail = [description, link].filter(Boolean).join(' · ');
    if (main && detail) return `${main}：${detail}`;
    if (main) return main;
    return detail || Object.entries(item).map(([key, val]) => `${key}: ${this.scalarString(val)}`).join(' · ');
  }

  private scalarString(value: unknown) {
    if (!value) return '';
    return typeof value === 'string' ? value.trim() : String(value).trim();
  }

  async publish(userId: string, versionId: string, isPublic: boolean = true) {
    const resume = await this.prisma.resumeVersion.findUnique({
      where: { id: versionId },
    });

    if (!resume) {
      throw new NotFoundException('Resume version not found');
    }

    if (resume.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const existingPublish = await this.prisma.resumePublishRecord.findFirst({
      where: { versionId },
    });

    if (existingPublish) {
      return this.prisma.resumePublishRecord.update({
        where: { id: existingPublish.id },
        data: { isPublic },
      });
    }

    const publicToken = randomBytes(16).toString('hex');

    const publishRecord = await this.prisma.resumePublishRecord.create({
      data: {
        versionId,
        publicToken,
        isPublic,
      },
    });

    await this.prisma.resumeVersion.update({
      where: { id: versionId },
      data: { status: 'PUBLISHED' },
    });

    this.fileLogger.operation('resume_published', { userId, versionId, publicToken });
    return publishRecord;
  }

  async unpublish(userId: string, versionId: string) {
    const resume = await this.prisma.resumeVersion.findUnique({
      where: { id: versionId },
    });

    if (!resume) {
      throw new NotFoundException('Resume version not found');
    }

    if (resume.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const publishRecord = await this.prisma.resumePublishRecord.findFirst({
      where: { versionId },
    });

    if (!publishRecord) {
      throw new NotFoundException('Publish record not found');
    }

    await this.prisma.resumePublishRecord.update({
      where: { id: publishRecord.id },
      data: { isPublic: false },
    });

    await this.prisma.resumeVersion.update({
      where: { id: versionId },
      data: { status: 'READY_EDIT' },
    });

    this.fileLogger.operation('resume_unpublished', { userId, versionId });
    return { message: 'Resume unpublished' };
  }

  async regenerateToken(userId: string, versionId: string) {
    const resume = await this.prisma.resumeVersion.findUnique({
      where: { id: versionId },
    });

    if (!resume) {
      throw new NotFoundException('Resume version not found');
    }

    if (resume.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const publishRecord = await this.prisma.resumePublishRecord.findFirst({
      where: { versionId },
    });

    if (!publishRecord) {
      throw new NotFoundException('Publish record not found');
    }

    const publicToken = randomBytes(16).toString('hex');
    const updated = await this.prisma.resumePublishRecord.update({
      where: { id: publishRecord.id },
      data: { publicToken, isPublic: true },
    });

    this.fileLogger.operation('resume_publish_token_regenerated', { userId, versionId, publicToken });
    return updated;
  }

  async getPublicResume(token: string) {
    const publishRecord = await this.prisma.resumePublishRecord.findUnique({
      where: { publicToken: token },
      include: {
        version: {
          include: {
            profile: {
              include: {
                educationRecords: { orderBy: { sortOrder: 'asc' } },
                workExperiences: { orderBy: { sortOrder: 'asc' } },
                projectExperiences: { orderBy: { sortOrder: 'asc' } },
                skillRecords: { orderBy: { sortOrder: 'asc' } },
                certificateRecords: { orderBy: { sortOrder: 'asc' } },
              },
            },
            jobTarget: true,
          },
        },
      },
    });

    if (!publishRecord || !publishRecord.isPublic) {
      throw new NotFoundException('Resume not found or not public');
    }

    await this.prisma.resumePublishRecord.update({
      where: { id: publishRecord.id },
      data: { viewCount: { increment: 1 } },
    });

    this.fileLogger.operation('public_resume_viewed', { token, versionId: publishRecord.versionId });
    return this.toPublicPreviewData(publishRecord.version);
  }

  async getPublishRecord(userId: string, versionId: string) {
    const resume = await this.prisma.resumeVersion.findUnique({
      where: { id: versionId },
    });

    if (!resume) {
      throw new NotFoundException('Resume version not found');
    }

    if (resume.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.resumePublishRecord.findFirst({
      where: { versionId },
    });
  }
}
