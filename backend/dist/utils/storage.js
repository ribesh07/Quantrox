"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToStorage = uploadFileToStorage;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const useS3 = !!process.env.AWS_S3_BUCKET;
let s3Client = null;
let S3 = null;
if (useS3) {
    // lazy require to avoid adding hard dependency when not configured
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    s3Client = new S3Client({ region: process.env.AWS_S3_REGION });
    S3 = { PutObjectCommand };
}
async function uploadFileToStorage(opts) {
    if (useS3 && s3Client && S3) {
        const fileContent = await promises_1.default.readFile(opts.localPath);
        const Bucket = process.env.AWS_S3_BUCKET;
        const Key = opts.key;
        await s3Client.send(new S3.PutObjectCommand({ Bucket, Key, Body: fileContent, ContentType: opts.contentType }));
        const region = process.env.AWS_S3_REGION;
        // Public URL (may vary by setup)
        return `https://${Bucket}.s3.${region}.amazonaws.com/${Key}`;
    }
    // fallback to local
    const target = path_1.default.join(env_1.env.uploadDir, opts.key);
    await promises_1.default.mkdir(path_1.default.dirname(target), { recursive: true });
    await promises_1.default.rename(opts.localPath, target);
    return `/uploads/${opts.key}`;
}
