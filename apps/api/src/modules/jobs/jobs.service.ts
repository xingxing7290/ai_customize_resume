import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobTargetDto, UpdateJobTargetDto } from './dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async create(userId: string, dto: CreateJobTargetDto) {
    const job = await this.prisma.jobTarget.create({
      data: {
        userId,
        ...dto,
        status: dto.rawJdText ? 'PARSING' : 'INIT',
      },
    });

    if (!dto.rawJdText?.trim()) {
      return job;
    }

    try {
      const parsed = await this.aiService.parseJobDescription(userId, dto.rawJdText, job.id);

      return this.prisma.jobTarget.update({
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
    } catch (error) {
      return this.prisma.jobTarget.update({
        where: { id: job.id },
        data: {
          status: 'PARSE_FAILED',
          parseError: error.message || String(error),
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
