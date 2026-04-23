import { ApiProperty } from '@nestjs/swagger';

class EducationRecordDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  school: string;

  @ApiProperty()
  degree: string;

  @ApiProperty({ required: false })
  major?: string;

  @ApiProperty()
  startDate: string;

  @ApiProperty({ required: false })
  endDate?: string;
}

class WorkExperienceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  company: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  startDate: string;

  @ApiProperty({ required: false })
  endDate?: string;

  @ApiProperty()
  highlights: string[];

  @ApiProperty()
  techStack: string[];
}

class ProjectExperienceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  role?: string;

  @ApiProperty()
  highlights: string[];

  @ApiProperty()
  techStack: string[];
}

class SkillRecordDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  category?: string;
}

class CertificateRecordDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  issuer?: string;
}

export class ProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty({ required: false })
  website?: string;

  @ApiProperty({ required: false })
  github?: string;

  @ApiProperty({ required: false })
  linkedin?: string;

  @ApiProperty({ required: false })
  summary?: string;

  @ApiProperty({ required: false })
  selfEvaluation?: string;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty({ type: [EducationRecordDto] })
  educationRecords: EducationRecordDto[];

  @ApiProperty({ type: [WorkExperienceDto] })
  workExperiences: WorkExperienceDto[];

  @ApiProperty({ type: [ProjectExperienceDto] })
  projectExperiences: ProjectExperienceDto[];

  @ApiProperty({ type: [SkillRecordDto] })
  skillRecords: SkillRecordDto[];

  @ApiProperty({ type: [CertificateRecordDto] })
  certificateRecords: CertificateRecordDto[];
}
