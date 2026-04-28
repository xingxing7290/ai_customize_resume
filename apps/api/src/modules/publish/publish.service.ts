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

  private toPublicPreviewData(version: any) {
    return {
      profile: {
        name: version.profile?.name,
        email: version.profile?.email,
        phone: version.profile?.phone ?? undefined,
        location: version.profile?.location ?? undefined,
        summary: version.profile?.summary ?? undefined,
      },
      jobTarget: version.jobTarget
        ? {
            parsedJobTitle: version.jobTarget.parsedJobTitle ?? undefined,
            parsedCompanyName: version.jobTarget.parsedCompanyName ?? undefined,
          }
        : undefined,
      contentSummary: version.contentSummary ?? undefined,
      contentSkills: this.parseJsonArray<string>(version.contentSkills),
      contentWorkExperiences: this.parseJsonArray<any>(version.contentWorkExperiences).map((exp: any) => ({
        ...exp,
        highlights: this.parseJsonArray<string>(exp?.highlights),
        techStack: this.parseJsonArray<string>(exp?.techStack),
      })),
      contentProjectExperiences: this.parseJsonArray<any>(version.contentProjectExperiences).map((proj: any) => ({
        ...proj,
        highlights: this.parseJsonArray<string>(proj?.highlights),
        techStack: this.parseJsonArray<string>(proj?.techStack),
      })),
      contentCertificates: this.parseJsonArray<string>(version.contentCertificates),
      contentSelfEvaluation: version.contentSelfEvaluation ?? undefined,
    };
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
