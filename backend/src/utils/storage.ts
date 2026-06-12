import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';

const useS3 = !!process.env.AWS_S3_BUCKET;

let s3Client: any = null;
let S3: any = null;
if (useS3) {
  // lazy require to avoid adding hard dependency when not configured
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  s3Client = new S3Client({ region: process.env.AWS_S3_REGION });
  S3 = { PutObjectCommand };
}

export async function uploadFileToStorage(opts: { localPath: string; key: string; contentType?: string }) {
  if (useS3 && s3Client && S3) {
    const fileContent = await fs.readFile(opts.localPath);
    const Bucket = process.env.AWS_S3_BUCKET as string;
    const Key = opts.key;
    await s3Client.send(new S3.PutObjectCommand({ Bucket, Key, Body: fileContent, ContentType: opts.contentType }));
    const region = process.env.AWS_S3_REGION;
    // Public URL (may vary by setup)
    return `https://${Bucket}.s3.${region}.amazonaws.com/${Key}`;
  }

  // fallback to local
  const target = path.join(env.uploadDir, opts.key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.rename(opts.localPath, target);
  return `/uploads/${opts.key}`;
}
