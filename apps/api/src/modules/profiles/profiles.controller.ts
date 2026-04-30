import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto, UpdateProfileDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('profiles')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new profile' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateProfileDto) {
    return this.profilesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all profiles for current user' })
  findAll(@CurrentUser('id') userId: string) {
    return this.profilesService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get profile by id' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.profilesService.findOne(userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update profile' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.update(userId, id, dto);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload profile avatar' })
  uploadAvatar(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @UploadedFile() file: any,
  ) {
    return this.profilesService.uploadAvatar(userId, id, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete profile' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.profilesService.remove(userId, id);
  }

  @Put(':id/default')
  @ApiOperation({ summary: 'Set profile as default' })
  setDefault(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.profilesService.setDefault(userId, id);
  }
}
