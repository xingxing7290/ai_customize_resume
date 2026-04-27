import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobTargetDto, UpdateJobTargetDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('jobs')
@ApiBearerAuth()
@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a job target from URL or JD text' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateJobTargetDto) {
    return this.jobsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List job targets' })
  findAll(@CurrentUser('id') userId: string) {
    return this.jobsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job target detail' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.jobsService.findOne(userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update job target' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJobTargetDto,
  ) {
    return this.jobsService.update(userId, id, dto);
  }

  @Post(':id/reparse')
  @ApiOperation({ summary: 'Reparse a job target' })
  reparse(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.jobsService.reparse(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete job target' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.jobsService.remove(userId, id);
  }
}
