import { Module } from '@nestjs/common';
import { PublishController, PublicController } from './publish.controller';
import { PublishService } from './publish.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PublishController, PublicController],
  providers: [PublishService],
  exports: [PublishService],
})
export class PublishModule {}