import { PartialType } from '@nestjs/swagger';
import { CreateJobTargetDto } from './create-job.dto';

export class UpdateJobTargetDto extends PartialType(CreateJobTargetDto) {}
