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
  @ApiOperation({ summary: '创建求职目标' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateJobTargetDto) {
    return this.jobsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有求职目标' })
  findAll(@CurrentUser('userId') userId: string) {
    return this.jobsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取求职目标详情' })
  findOne(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.jobsService.findOne(userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新求职目标' })
  update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJobTargetDto,
  ) {
    return this.jobsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除求职目标' })
  remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.jobsService.remove(userId, id);
  }
}
