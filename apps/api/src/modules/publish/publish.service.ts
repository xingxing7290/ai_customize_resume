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
    return publishRecord.version;
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
