import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { PrismaModule } from '../../prisma/prisma.module';
import {
  EducationController,
  WorkExperienceController,
  ProjectExperienceController,
  SkillController,
  CertificateController,
} from './sub-controllers/experience.controllers';

@Module({
  imports: [PrismaModule],
  controllers: [
    ProfilesController,
    EducationController,
    WorkExperienceController,
    ProjectExperienceController,
    SkillController,
    CertificateController,
  ],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}