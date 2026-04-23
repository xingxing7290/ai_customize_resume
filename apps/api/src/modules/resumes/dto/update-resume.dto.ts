import { PartialType } from '@nestjs/swagger';
import { CreateResumeVersionDto } from './create-resume.dto';

export class UpdateResumeVersionDto extends PartialType(CreateResumeVersionDto) {}
