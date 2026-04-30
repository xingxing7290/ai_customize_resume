import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { FileLoggerService } from '../../common/logger/file-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PdfService } from './pdf.service';

@ApiTags('pdf')
@Controller('pdf')
export class PdfController {
  constructor(
    private pdfService: PdfService,
    private prisma: PrismaService,
    private fileLogger: FileLoggerService,
  ) {}

  @Get(':versionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download resume PDF' })
  async getPrintPage(
    @CurrentUser('id') userId: string,
    @Param('versionId') versionId: string,
    @Query('style') style: string | undefined,
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

    const normalizedStyle = this.pdfService.normalizeTemplate(style);
    try {
      const pdf = await this.pdfService.generatePdf(this.toResumeData(resume), normalizedStyle);
      this.fileLogger.operation('resume_pdf_downloaded', {
        userId,
        versionId,
        style: normalizedStyle,
        bytes: pdf.length,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="resume-${versionId}-${normalizedStyle}.pdf"`);
      res.send(pdf);
    } catch (error) {
      this.fileLogger.error(
        'resume_pdf_download_failed',
        error instanceof Error ? error.stack : undefined,
        'PdfController',
      );
      res.status(500).json({
        message: 'PDF 生成失败，请稍后重试',
        style: normalizedStyle,
      });
    }
  }

  @Get('public/:token')
  @Public()
  @ApiOperation({ summary: 'Download public resume PDF' })
  async getPublicPrintPage(
    @Param('token') token: string,
    @Query('style') style: string | undefined,
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
    const normalizedStyle = this.pdfService.normalizeTemplate(style);
    try {
      const pdf = await this.pdfService.generatePdf(this.toResumeData(resume), normalizedStyle);
      this.fileLogger.operation('public_resume_pdf_downloaded', {
        token,
        versionId: resume.id,
        style: normalizedStyle,
        bytes: pdf.length,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="resume-${token}-${normalizedStyle}.pdf"`);
      res.send(pdf);
    } catch (error) {
      this.fileLogger.error(
        'public_resume_pdf_download_failed',
        error instanceof Error ? error.stack : undefined,
        'PdfController',
      );
      res.status(500).json({
        message: 'PDF 生成失败，请稍后重试',
        style: normalizedStyle,
      });
    }
  }

  private toResumeData(resume: any) {
    return {
      profile: {
        name: resume.profile.name,
        email: resume.profile.email,
        phone: resume.profile.phone ?? undefined,
        location: resume.profile.location ?? undefined,
        avatarUrl: resume.profile.avatarUrl ?? undefined,
        summary: resume.profile.summary ?? undefined,
      },
      educationRecords: (resume.profile.educationRecords || []).map((education: any) => ({
        school: education.school,
        degree: education.degree,
        major: education.major ?? undefined,
        startDate: education.startDate,
        endDate: education.endDate ?? undefined,
        gpa: education.gpa ?? undefined,
        description: education.description ?? undefined,
      })),
      contentSummary: resume.contentSummary ?? undefined,
      contentSkills: resume.contentSkills,
      contentWorkExperiences: resume.contentWorkExperiences,
      contentProjectExperiences: resume.contentProjectExperiences,
      contentCertificates: resume.contentCertificates,
      contentSelfEvaluation: resume.contentSelfEvaluation ?? undefined,
      jobTarget: resume.jobTarget
        ? {
            parsedJobTitle: resume.jobTarget.parsedJobTitle ?? undefined,
            parsedCompanyName: resume.jobTarget.parsedCompanyName ?? undefined,
          }
        : undefined,
    };
  }
}
