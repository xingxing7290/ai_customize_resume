import { Global, Module } from '@nestjs/common';
import { FileLoggerService } from './file-logger.service';
import { RequestLoggingMiddleware } from './request-logging.middleware';

@Global()
@Module({
  providers: [FileLoggerService, RequestLoggingMiddleware],
  exports: [FileLoggerService, RequestLoggingMiddleware],
})
export class LoggerModule {}
