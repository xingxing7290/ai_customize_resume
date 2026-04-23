import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ResumesService } from './resumes.service';
import { CreateResumeVersionDto, UpdateResumeVersionDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('resumes')
@ApiBearerAuth()
@Controller('resumes')
@UseGuards(JwtAuthGuard)
export class ResumesController {
  constructor(private resumesService: ResumesService) {}

  @Post()
  @ApiOperation({ summary: '创建简历版本' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateResumeVersionDto) {
    return this.resumesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有简历版本' })
  @ApiQuery({ name: 'jobTargetId', required: false })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('jobTargetId') jobTargetId?: string,
  ) {
    if (jobTargetId) {
      return this.resumesService.findByJobTarget(userId, jobTargetId);
    }
    return this.resumesService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取简历版本详情' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.resumesService.findOne(userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新简历版本' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateResumeVersionDto,
  ) {
    return this.resumesService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除简历版本' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.resumesService.remove(userId, id);
  }
}
