import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PublishService } from './publish.service';
import { PublishResumeDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('publish')
@Controller('publish')
export class PublishController {
  constructor(private publishService: PublishService) {}

  @Post(':versionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '发布简历' })
  publish(
    @CurrentUser('id') userId: string,
    @Param('versionId') versionId: string,
    @Body() dto: PublishResumeDto,
  ) {
    return this.publishService.publish(userId, versionId, dto.isPublic);
  }

  @Delete(':versionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取消发布' })
  unpublish(
    @CurrentUser('id') userId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.publishService.unpublish(userId, versionId);
  }

  @Get(':versionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取发布记录' })
  getPublishRecord(
    @CurrentUser('id') userId: string,
    @Param('versionId') versionId: string,
  ) {
    return this.publishService.getPublishRecord(userId, versionId);
  }
}

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private publishService: PublishService) {}

  @Get('r/:token')
  @Public()
  @ApiOperation({ summary: '公开访问简历' })
  getPublicResume(@Param('token') token: string) {
    return this.publishService.getPublicResume(token);
  }
}