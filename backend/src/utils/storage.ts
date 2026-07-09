import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';

export async function uploadFileToStorage(opts: { localPath: string; key: string; contentType?: string }) {
  const target = path.join(env.uploadDir, opts.key);
  await fs.mkdir(path.dirname(target), { recursive: true });

  try {
    await fs.rename(opts.localPath, target);
  } catch (error) {
    try {
      await fs.copyFile(opts.localPath, target);
    } catch (copyError) {
      throw copyError;
    } finally {
      try {
        await fs.unlink(opts.localPath);
      } catch {
        // Ignore cleanup failures for temp uploads.
      }
    }
  }

  return `/uploads/${opts.key}`;
}
