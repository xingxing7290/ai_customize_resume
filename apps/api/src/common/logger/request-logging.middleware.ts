import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FileLoggerService } from './file-logger.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly fileLogger: FileLoggerService) {}

  use(req: Request & { user?: any }, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      this.fileLogger.operation('http_request', {
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
    });

    next();
  }
}
