import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileLoggerService } from '../../common/logger/file-logger.service';
import { UpdateAiSettingDto } from './dto/update-ai-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private fileLogger: FileLoggerService,
  ) {}

  async getAiSetting(userId: string) {
    const setting = await this.prisma.userAiSetting.findUnique({ where: { userId } });
    return this.toSafeSetting(setting);
  }

  async upsertAiSetting(userId: string, dto: UpdateAiSettingDto) {
    const existing = await this.prisma.userAiSetting.findUnique({ where: { userId } });
    const apiKey = dto.apiKey?.trim();

    if (!existing && !apiKey) {
      throw new BadRequestException('DeepSeek API key is required');
    }

    const baseUrl = (dto.baseUrl || existing?.baseUrl || 'https://api.deepseek.com').trim().replace(/\/+$/, '');
    const model = (dto.model || existing?.model || 'deepseek-v4-flash').trim();
    const provider = dto.provider || existing?.provider || 'deepseek';

    const setting = await this.prisma.userAiSetting.upsert({
      where: { userId },
      create: {
        userId,
        provider,
        apiKey: apiKey || existing?.apiKey || '',
        baseUrl,
        model,
        enabled: dto.enabled ?? true,
      },
      update: {
        provider,
        ...(apiKey ? { apiKey } : {}),
        baseUrl,
        model,
        enabled: dto.enabled ?? existing?.enabled ?? true,
      },
    });

    this.fileLogger.operation('ai_setting_saved', {
      userId,
      provider: setting.provider,
      baseUrl: setting.baseUrl,
      model: setting.model,
      enabled: setting.enabled,
      hasApiKey: Boolean(setting.apiKey),
    });

    return this.toSafeSetting(setting);
  }

  async getRuntimeAiSetting(userId: string) {
    const setting = await this.prisma.userAiSetting.findUnique({ where: { userId } });
    if (!setting?.enabled || !setting.apiKey) return undefined;
    return {
      provider: setting.provider,
      apiKey: setting.apiKey,
      baseUrl: setting.baseUrl,
      model: setting.model,
    };
  }

  private toSafeSetting(setting?: {
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    enabled: boolean;
    updatedAt: Date;
  } | null) {
    if (!setting) {
      return {
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-v4-flash',
        enabled: false,
        hasApiKey: false,
        maskedApiKey: '',
      };
    }

    return {
      provider: setting.provider,
      baseUrl: setting.baseUrl,
      model: setting.model,
      enabled: setting.enabled,
      hasApiKey: Boolean(setting.apiKey),
      maskedApiKey: this.maskApiKey(setting.apiKey),
      updatedAt: setting.updatedAt,
    };
  }

  private maskApiKey(apiKey: string) {
    if (!apiKey) return '';
    if (apiKey.length <= 10) return `${apiKey.slice(0, 2)}****`;
    return `${apiKey.slice(0, 6)}****${apiKey.slice(-4)}`;
  }
}
