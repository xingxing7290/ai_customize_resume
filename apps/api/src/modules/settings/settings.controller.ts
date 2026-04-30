import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateAiSettingDto } from './dto/update-ai-setting.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('ai')
  @ApiOperation({ summary: 'Get current user AI settings' })
  getAiSetting(@CurrentUser('id') userId: string) {
    return this.settingsService.getAiSetting(userId);
  }

  @Put('ai')
  @ApiOperation({ summary: 'Update current user AI settings' })
  updateAiSetting(@CurrentUser('id') userId: string, @Body() dto: UpdateAiSettingDto) {
    return this.settingsService.upsertAiSetting(userId, dto);
  }

  @Post('ai/test')
  @ApiOperation({ summary: 'Test current user AI settings' })
  testAiSetting(@CurrentUser('id') userId: string, @Body() dto: UpdateAiSettingDto) {
    return this.settingsService.testAiSetting(userId, dto);
  }
}
