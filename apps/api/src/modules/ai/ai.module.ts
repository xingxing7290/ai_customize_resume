import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { OpenAiProvider } from './providers/openai.provider';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [AiService, OpenAiProvider],
  exports: [AiService],
})
export class AiModule {}
