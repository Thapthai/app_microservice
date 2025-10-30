import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';

@Injectable()
export class HousekeepingLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const logDir = path.join(process.cwd(), 'logs', 'housekeeping');

    // Transport สำหรับ combined logs (ทุกระดับ)
    const combinedTransport = new DailyRotateFile({
      filename: path.join(logDir, 'housekeeping-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d', // เก็บ 30 วัน
      maxSize: '20m', // แยกไฟล์เมื่อใหญ่กว่า 20MB
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metaStr}`;
        }),
      ),
    });

    // Transport สำหรับ archive operations (เฉพาะ archive logs)
    const archiveTransport = new DailyRotateFile({
      filename: path.join(logDir, 'archive-operations-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '90d', // เก็บนานกว่า (90 วัน)
      maxSize: '50m',
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json(), // JSON format สำหรับ parse ง่าย
      ),
    });

    // Transport สำหรับ errors
    const errorTransport = new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '60d',
      maxSize: '20m',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    });

    // Console transport (development)
    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level}: ${message}`;
        }),
      ),
    });

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      transports: [
        combinedTransport,
        archiveTransport,
        errorTransport,
        ...(process.env.NODE_ENV !== 'production' ? [consoleTransport] : []),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  /**
   * Log archive operation with structured data
   */
  logArchiveOperation(data: {
    operation: string;
    table: string;
    recordsProcessed: number;
    recordsArchived?: number;
    recordsDeleted?: number;
    duration: number;
    startDate: Date;
    endDate: Date;
    status: 'success' | 'failed' | 'partial';
    error?: string;
  }) {
    this.logger.info('Archive Operation', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log statistics
   */
  logStatistics(data: {
    primaryDb: Record<string, number>;
    archiveDb: Record<string, number>;
  }) {
    this.logger.info('Database Statistics', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }
}

