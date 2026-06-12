import winston from 'winston';
import * as Sentry from '@sentry/node';
import { env } from '../config/env';

const transports: winston.transport[] = [];
transports.push(new winston.transports.Console({ format: winston.format.simple() }));

export const logger = winston.createLogger({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports,
});

if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: env.nodeEnv });
}

export const expressLogger = (req: any, res: any, next: any) => {
  logger.info(`${req.method} ${req.url}`);
  next();
};

export default logger;
