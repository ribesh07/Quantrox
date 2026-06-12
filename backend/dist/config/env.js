"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const getRequiredEnv = (name) => {
    const value = process.env[name];
    if (!value || !value.trim()) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};
const parsePort = (rawPort) => {
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
exports.env = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parsePort(process.env.PORT),
    jwtSecret: getRequiredEnv('JWT_SECRET'),
    uploadDir: path_1.default.resolve(process.env.UPLOAD_DIR || path_1.default.join(process.cwd(), 'uploads')),
    corsOrigins,
    frontendUrl: process.env.FRONTEND_URL || process.env.FRONTEND || `http://localhost:3000`,
};
