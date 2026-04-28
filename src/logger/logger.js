import { createLogger, format, transports } from 'winston';
import { env } from '../config/env.js';

const { combine, timestamp, json, colorize, printf, errors } = format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level}: ${message} ${metaStr}`;
  }),
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

// Vercel has an ephemeral read-only filesystem — only use Console transport there
const fileTransports = process.env.VERCEL
  ? []
  : [
      new transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: combine(timestamp(), errors({ stack: true }), json()),
      }),
      new transports.File({
        filename: 'logs/combined.log',
        format: combine(timestamp(), json()),
      }),
    ];

const logger = createLogger({
  level: 'info',
  format: process.env.VERCEL ? prodFormat : devFormat,
  transports: [new transports.Console(), ...fileTransports],
});

/**
 * Structured log helper for flow events
 * @param {'info'|'warn'|'error'} level
 * @param {string} status - flow status code
 * @param {object} meta - { contactId, fileNumber?, orderId?, error? }
 */
export const logEvent = (level, status, meta = {}) => {
  logger[level](status, {
    status,
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

export default logger;
