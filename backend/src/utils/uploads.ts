import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';
import { uploadFileToStorage } from './storage';

type UploadSubdirectory = 'proofs' | 'qrs';

interface SaveUploadedFileInput {
  originalName: string;
  prefix?: string;
  subdirectory: UploadSubdirectory;
  tempPath: string;
}

const sanitizeFilename = (filename: string): string =>
  path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '-');

export const ensureUploadDirectory = async (subdirectory?: UploadSubdirectory): Promise<string> => {
  const targetDirectory = subdirectory
    ? path.join(env.uploadDir, subdirectory)
    : env.uploadDir;

  await fs.mkdir(targetDirectory, { recursive: true });
  return targetDirectory;
};

export const getUploadDirectory = (): string => env.uploadDir;

export const saveUploadedFile = async ({
  originalName,
  prefix,
  subdirectory,
  tempPath,
}: SaveUploadedFileInput): Promise<string> => {
  const safeFilename = sanitizeFilename(originalName || 'upload.bin');
  const filenamePrefix = prefix ? `${prefix}-` : '';
  const filename = `${filenamePrefix}${Date.now()}-${safeFilename}`;
  const key = `${subdirectory}/${filename}`;

  const result = await uploadFileToStorage({ localPath: tempPath, key, contentType: 'application/octet-stream' });
  return result;
};
