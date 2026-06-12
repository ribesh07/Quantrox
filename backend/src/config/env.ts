import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const parsePort = (rawPort?: string): number => {
  const parsed = Number(rawPort ?? 3001);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid PORT value: ${rawPort}`);
  }
  return parsed;
};

const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parsePort(process.env.PORT),
  jwtSecret: getRequiredEnv('JWT_SECRET'),
  uploadDir: path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')),
  corsOrigins,
  frontendUrl: process.env.FRONTEND_URL || process.env.FRONTEND || `http://localhost:3000`,
};

