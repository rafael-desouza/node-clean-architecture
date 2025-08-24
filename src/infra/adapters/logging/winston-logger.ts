import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import TransportStream from 'winston-transport';

import { LoggerPort } from '@/core/application/ports/logger.port';

export class WinstonLooger implements LoggerPort {
  private logger: winston.Logger;

  constructor() {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const isProduction = process.env.NODE_ENV === 'production';

    const transports: TransportStream[] = [
      new DailyRotateFile({
        filename: 'logs/app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'info',
        zippedArchive: true,
        maxSize: '5m',
        maxFiles: '14d',
      }),
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        zippedArchive: true,
        maxSize: '5m',
        maxFiles: '14d',
      }),
    ];

    if (!isProduction) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp, ...meta }) => {
              let logMessage = `[${timestamp}] ${level}: ${message}`;
              if (meta && Object.keys(meta).length) {
                logMessage += ` ${JSON.stringify(meta, null, 2)}`;
              }
              return logMessage;
            })
          ),
        })
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
      ),
      transports: transports,
    });

    if (!isProduction) {
      this.logger.info('Logger rodando em modo de desenvolvimento.');
    }
  }

  info(message: string, meta?: unknown): void {
    this.logger.info(message, meta);
  }

  error(message: string, meta?: unknown): void {
    this.logger.error(message, meta);
  }
}
