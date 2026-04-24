import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResumeVersionDto, UpdateResumeVersionDto } from './dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ResumesService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async create(userId: string, dto: CreateResumeVersionDto) {
    const profile = await this.prisma.resumeProfile.findUnique({
      where: { id: dto.profileId },
      include: {
        educationRecords: true,
        workExperiences: true,
        projectExperiences: true,
        skillRecords: true,
        certificateRecords: true,
      },
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
        profile: {
          include: {
            educationRecords: { orderBy: { sortOrder: 'asc' } },
            workExperiences: { orderBy: { sortOrder: 'asc' } },
            projectExperiences: { orderBy: { sortOrder: 'asc' } },
            skillRecords: { orderBy: { sortOrder: 'asc' } },
            certificateRecords: { orderBy: { sortOrder: 'asc' } },
          },
        },
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

  async copy(userId: string, id: string, name?: string) {
    const original = await this.findOne(userId, id);

    return this.prisma.resumeVersion.create({
      data: {
        userId,
        profileId: original.profileId,
        jobTargetId: original.jobTargetId,
        sourceVersionId: id,
        name: name || `${original.name} (副本)`,
        status: 'DRAFT',
        contentSummary: original.contentSummary,
        contentSkills: original.contentSkills,
        contentWorkExperiences: original.contentWorkExperiences ? JSON.stringify(original.contentWorkExperiences) : null,
        contentProjectExperiences: original.contentProjectExperiences ? JSON.stringify(original.contentProjectExperiences) : null,
        contentCertificates: original.contentCertificates,
        contentSelfEvaluation: original.contentSelfEvaluation,
      },
      include: {
        jobTarget: true,
        profile: true,
      },
    });
  }

  async regenerate(userId: string, id: string) {
    const resume = await this.findOne(userId, id);

    if (!resume.jobTargetId) {
      throw new BadRequestException('Resume must have a job target to regenerate');
    }

    await this.prisma.resumeVersion.update({
      where: { id },
      data: { status: 'GENERATING' },
    });

    try {
      const jobTarget = await this.prisma.jobTarget.findUnique({
        where: { id: resume.jobTargetId },
      });

      if (!jobTarget) {
        throw new NotFoundException('Job target not found');
      }

      const generatedContent = await this.aiService.generateTailoredResume(
        userId,
        resume.profile,
        {
          jobTitle: jobTarget.parsedJobTitle,
          companyName: jobTarget.parsedCompanyName,
          responsibilities: jobTarget.parsedResponsibilities,
          requirements: jobTarget.parsedRequirements,
          techStack: jobTarget.parsedTechStack,
        },
        id,
      );

      const updated = await this.prisma.resumeVersion.update({
        where: { id },
        data: {
          status: 'READY_EDIT',
          contentSummary: generatedContent.summary,
          contentSkills: generatedContent.skills ? JSON.stringify(generatedContent.skills) : null,
          contentWorkExperiences: generatedContent.workExperiences ? JSON.stringify(generatedContent.workExperiences) : null,
          contentProjectExperiences: generatedContent.projectExperiences ? JSON.stringify(generatedContent.projectExperiences) : null,
          contentCertificates: generatedContent.certificates ? JSON.stringify(generatedContent.certificates) : null,
          contentSelfEvaluation: generatedContent.selfEvaluation,
          aiOptimizationNotes: generatedContent.optimizationNotes ? JSON.stringify(generatedContent.optimizationNotes) : null,
          aiGapAnalysis: generatedContent.gapAnalysis ? JSON.stringify(generatedContent.gapAnalysis) : null,
        },
        include: {
          jobTarget: true,
          profile: true,
        },
      });

      return updated;
    } catch (error) {
      await this.prisma.resumeVersion.update({
        where: { id },
        data: { status: 'GENERATE_FAILED' },
      });
      throw error;
    }
  }

  async updateContent(userId: string, id: string, content: {
    summary?: string;
    skills?: string[];
    workExperiences?: any[];
    projectExperiences?: any[];
    certificates?: string[];
    selfEvaluation?: string;
  }) {
    await this.findOne(userId, id);

    return this.prisma.resumeVersion.update({
      where: { id },
      data: {
        contentSummary: content.summary,
        contentSkills: content.skills ? JSON.stringify(content.skills) : null,
        contentWorkExperiences: content.workExperiences ? JSON.stringify(content.workExperiences) : null,
        contentProjectExperiences: content.projectExperiences ? JSON.stringify(content.projectExperiences) : null,
        contentCertificates: content.certificates ? JSON.stringify(content.certificates) : null,
        contentSelfEvaluation: content.selfEvaluation,
      },
      include: {
        jobTarget: true,
        profile: true,
      },
    });
  }
}