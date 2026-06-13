import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env } from '../config/env';

const logDir = 'logs';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

const createRotatingTransport = (filename: string, level?: string) =>
  new DailyRotateFile({
    filename: path.join(logDir, `${filename}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level,
    format: logFormat,
  });

export const logger = winston.createLogger({
  level: env.isDev ? 'debug' : 'info',
  transports: [
    createRotatingTransport('app'),
    createRotatingTransport('error', 'error'),
    ...(env.isDev ? [new winston.transports.Console({ format: consoleFormat })] : []),
  ],
});

export const auditLogger = winston.createLogger({
  level: 'info',
  transports: [
    createRotatingTransport('audit'),
    ...(env.isDev ? [new winston.transports.Console({ format: consoleFormat })] : []),
  ],
});

export const securityLogger = winston.createLogger({
  level: 'warn',
  transports: [
    createRotatingTransport('security'),
    ...(env.isDev ? [new winston.transports.Console({ format: consoleFormat })] : []),
  ],
});
