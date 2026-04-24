import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { PdfService } from './pdf.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('pdf')
@Controller('pdf')
export class PdfController {
  constructor(
    private pdfService: PdfService,
    private prisma: PrismaService,
  ) {}

  @Get(':versionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取简历打印页面' })
  async getPrintPage(
    @CurrentUser('id') userId: string,
    @Param('versionId') versionId: string,
    @Res() res: Response,
  ) {
    const resume = await this.prisma.resumeVersion.findUnique({
      where: { id: versionId },
      include: {
        profile: {
          include: {
            educationRecords: true,
            workExperiences: true,
            projectExperiences: true,
            skillRecords: true,
            certificateRecords: true,
          },
        },
        jobTarget: true,
      },
    });

    if (!resume || resume.userId !== userId) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }

    const resumeData = {
      profile: {
        name: resume.profile.name,
        email: resume.profile.email,
        phone: resume.profile.phone ?? undefined,
        location: resume.profile.location ?? undefined,
        summary: resume.profile.summary ?? undefined,
      },
      contentSummary: resume.contentSummary ?? undefined,
      contentSkills: resume.contentSkills,
      contentWorkExperiences: resume.contentWorkExperiences,
      contentProjectExperiences: resume.contentProjectExperiences,
      contentCertificates: resume.contentCertificates,
      contentSelfEvaluation: resume.contentSelfEvaluation ?? undefined,
      jobTarget: resume.jobTarget ? {
        parsedJobTitle: resume.jobTarget.parsedJobTitle ?? undefined,
        parsedCompanyName: resume.jobTarget.parsedCompanyName ?? undefined,
      } : undefined,
    };

    const html = this.pdfService.generateHtml(resumeData);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('public/:token')
  @Public()
  @ApiOperation({ summary: '获取公开简历打印页面' })
  async getPublicPrintPage(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const publishRecord = await this.prisma.resumePublishRecord.findUnique({
      where: { publicToken: token },
      include: {
        version: {
          include: {
            profile: {
              include: {
                educationRecords: true,
                workExperiences: true,
                projectExperiences: true,
                skillRecords: true,
                certificateRecords: true,
              },
            },
            jobTarget: true,
          },
        },
      },
    });

    if (!publishRecord || !publishRecord.isPublic) {
      res.status(404).json({ message: 'Resume not found' });
      return;
    }

    const resume = publishRecord.version;

    const resumeData = {
      profile: {
        name: resume.profile.name,
        email: resume.profile.email,
        phone: resume.profile.phone ?? undefined,
        location: resume.profile.location ?? undefined,
        summary: resume.profile.summary ?? undefined,
      },
      contentSummary: resume.contentSummary ?? undefined,
      contentSkills: resume.contentSkills,
      contentWorkExperiences: resume.contentWorkExperiences,
      contentProjectExperiences: resume.contentProjectExperiences,
      contentCertificates: resume.contentCertificates,
      contentSelfEvaluation: resume.contentSelfEvaluation ?? undefined,
      jobTarget: resume.jobTarget ? {
        parsedJobTitle: resume.jobTarget.parsedJobTitle ?? undefined,
        parsedCompanyName: resume.jobTarget.parsedCompanyName ?? undefined,
      } : undefined,
    };

    const html = this.pdfService.generateHtml(resumeData);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}