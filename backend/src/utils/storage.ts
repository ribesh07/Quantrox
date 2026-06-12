import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';

export async function uploadFileToStorage(opts: { localPath: string; key: string; contentType?: string }) {
  const target = path.join(env.uploadDir, opts.key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.rename(opts.localPath, target);
  return `/uploads/${opts.key}`;
}
