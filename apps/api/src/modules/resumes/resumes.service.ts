import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResumeVersionDto, UpdateResumeVersionDto } from './dto';

@Injectable()
export class ResumesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateResumeVersionDto) {
    const profile = await this.prisma.resumeProfile.findUnique({
      where: { id: dto.profileId },
    });

    if (!profile || profile.userId !== userId) {
      throw new ForbiddenException('Profile not found or access denied');
    }

    if (dto.jobTargetId) {
      const jobTarget = await this.prisma.jobTarget.findUnique({
        where: { id: dto.jobTargetId },
      });

      if (!jobTarget || jobTarget.userId !== userId) {
        throw new ForbiddenException('Job target not found or access denied');
      }
    }

    return this.prisma.resumeVersion.create({
      data: {
        userId,
        ...dto,
      },
      include: {
        jobTarget: true,
        profile: true,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.resumeVersion.findMany({
      where: { userId },
      include: {
        jobTarget: true,
        profile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByJobTarget(userId: string, jobTargetId: string) {
    return this.prisma.resumeVersion.findMany({
      where: { userId, jobTargetId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const resume = await this.prisma.resumeVersion.findUnique({
      where: { id },
      include: {
        jobTarget: true,
        profile: true,
      },
    });

    if (!resume) {
      throw new NotFoundException('Resume version not found');
    }

    if (resume.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return resume;
  }

  async update(userId: string, id: string, dto: UpdateResumeVersionDto) {
    await this.findOne(userId, id);

    return this.prisma.resumeVersion.update({
      where: { id },
      data: dto,
      include: {
        jobTarget: true,
        profile: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.resumeVersion.delete({
      where: { id },
    });
  }
}
