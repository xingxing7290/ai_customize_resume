import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { FileLoggerService } from './common/logger/file-logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const fileLogger = app.get(FileLoggerService);
  app.useLogger(fileLogger);

  const uploadRoot = join(process.cwd(), 'uploads');
  if (!existsSync(uploadRoot)) {
    mkdirSync(uploadRoot, { recursive: true });
  }
  app.useStaticAssets(uploadRoot, { prefix: '/uploads/' });

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://113.44.50.108:3000'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AI Resume Platform API')
    .setDescription('API documentation for AI-driven job-tailored resume platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 3001;
  await app.listen(port);
  fileLogger.operation('api_started', { port });
  console.log(`API is running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
