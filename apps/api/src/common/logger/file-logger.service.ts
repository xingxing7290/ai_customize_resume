import { Injectable, LoggerService } from '@nestjs/common';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FileLoggerService implements LoggerService {
  private readonly logDir = process.env.LOG_DIR || join(process.cwd(), 'logs');

  constructor() {
    mkdirSync(this.logDir, { recursive: true });
  }

  log(message: any, context?: string) {
    this.write('info', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.write('error', message, context, { trace });
  }

  warn(message: any, context?: string) {
    this.write('warn', message, context);
  }

  debug(message: any, context?: string) {
    this.write('debug', message, context);
  }

  verbose(message: any, context?: string) {
    this.write('verbose', message, context);
  }

  operation(action: string, payload: Record<string, unknown>) {
    this.write('operation', action, 'Operation', payload);
  }

  private write(
    level: string,
    message: any,
    context?: string,
    extra?: Record<string, unknown>,
  ) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      ...extra,
      message: typeof message === 'string' ? message : JSON.stringify(message),
    };
    const line = `${JSON.stringify(entry)}\n`;
    appendFileSync(join(this.logDir, 'app.log'), line, 'utf8');

    if (level === 'operation') {
      appendFileSync(join(this.logDir, 'operations.log'), line, 'utf8');
    }

    if (level === 'error') {
      appendFileSync(join(this.logDir, 'error.log'), line, 'utf8');
    }
  }
}
