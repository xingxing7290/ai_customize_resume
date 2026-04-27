import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobTargetDto, UpdateJobTargetDto } from './dto';
import { AiService } from '../ai/ai.service';
import { FileLoggerService } from '../../common/logger/file-logger.service';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private fileLogger: FileLoggerService,
  ) {}

  async create(userId: string, dto: CreateJobTargetDto) {
    const job = await this.prisma.jobTarget.create({
      data: {
        userId,
        ...dto,
        status: dto.rawJdText ? 'PARSING' : 'INIT',
      },
    });
    this.fileLogger.operation('job_created', { userId, jobTargetId: job.id, hasJdText: Boolean(dto.rawJdText) });

    if (!dto.rawJdText?.trim()) {
      return job;
    }

    try {
      const parsed = await this.aiService.parseJobDescription(userId, dto.rawJdText, job.id);

      const updated = await this.prisma.jobTarget.update({
        where: { id: job.id },
        data: {
          status: 'PARSE_SUCCESS',
          parsedJobTitle: parsed.jobTitle,
          parsedCompanyName: parsed.companyName,
          parsedLocation: parsed.location,
          parsedResponsibilities: JSON.stringify(parsed.responsibilities || []),
          parsedRequirements: JSON.stringify(parsed.requirements || []),
          parsedTechStack: JSON.stringify(parsed.techStack || []),
        },
      });
      this.fileLogger.operation('job_parsed', { userId, jobTargetId: job.id, status: updated.status });
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.fileLogger.error(message, stack, 'JobsService');
      return this.prisma.jobTarget.update({
        where: { id: job.id },
        data: {
          status: 'PARSE_FAILED',
          parseError: message,
        },
      });
    }
  }

  async findAll(userId: string) {
    return this.prisma.jobTarget.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const job = await this.prisma.jobTarget.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Job target not found');
    }

    if (job.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return job;
  }

  async update(userId: string, id: string, dto: UpdateJobTargetDto) {
    await this.findOne(userId, id);

    return this.prisma.jobTarget.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.jobTarget.delete({
      where: { id },
    });
  }
}
