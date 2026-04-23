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

class UpdateContentDto {
  summary?: string;
  skills?: string[];
  workExperiences?: any[];
  projectExperiences?: any[];
  certificates?: string[];
  selfEvaluation?: string;
}

class CopyDto {
  name?: string;
}

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

  @Put(':id/content')
  @ApiOperation({ summary: '更新简历内容' })
  updateContent(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
  ) {
    return this.resumesService.updateContent(userId, id, dto);
  }

  @Post(':id/copy')
  @ApiOperation({ summary: '复制简历版本' })
  copy(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto?: CopyDto,
  ) {
    return this.resumesService.copy(userId, id, dto?.name);
  }

  @Post(':id/regenerate')
  @ApiOperation({ summary: '重新生成简历' })
  regenerate(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.resumesService.regenerate(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除简历版本' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.resumesService.remove(userId, id);
  }
}
