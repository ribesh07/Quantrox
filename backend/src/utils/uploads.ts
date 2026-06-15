import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';
import { uploadFileToStorage } from './storage';

type UploadSubdirectory = 'proofs' | 'qrs' | 'games' | 'reports' | 'merchant-qrs' | 'payout-qrs';

const sanitizeFilename = (filename: string): string =>
  path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '-');

export const ensureUploadDirectory = async (subdirectory?: UploadSubdirectory): Promise<string> => {
  const targetDirectory = subdirectory
    ? path.join(env.uploadDir, subdirectory)
    : env.uploadDir;

  await fs.mkdir(targetDirectory, { recursive: true });
  return targetDirectory;
};

export const getUploadDirectory = (subdirectory?: UploadSubdirectory): string => {
  return subdirectory ? path.join(env.uploadDir, subdirectory) : env.uploadDir;
};

type SaveUploadedFileOptions = {
  tempPath?: string;
  path?: string;
  originalName?: string;
  originalname?: string;
  subdirectory: UploadSubdirectory;
  prefix?: string;
};

const normalizeUploadedFile = (
  fileOrOptions:
    | { originalname: string; path: string }
    | SaveUploadedFileOptions,
  subdirectory?: UploadSubdirectory,
  prefix?: string
): { file: { originalname: string; path: string }; subdirectory: UploadSubdirectory; prefix?: string } => {
  if ('subdirectory' in fileOrOptions) {
    const options = fileOrOptions;
    return {
      file: {
        originalname: options.originalName ?? options.originalname ?? 'upload.bin',
        path: options.tempPath ?? options.path ?? '',
      },
      subdirectory: options.subdirectory,
      prefix: options.prefix,
    };
  }

  return {
    file: fileOrOptions,
    subdirectory: subdirectory!,
    prefix,
  };
};

export const saveUploadedFile = async (
  fileOrOptions:
    | { originalname: string; path: string }
    | SaveUploadedFileOptions,
  subdirectory?: UploadSubdirectory,
  prefix?: string
): Promise<string> => {
  const { file, subdirectory: subdir, prefix: filePrefix } = normalizeUploadedFile(
    fileOrOptions,
    subdirectory,
    prefix
  );
  const safeFilename = sanitizeFilename(file.originalname || 'upload.bin');
  const filenamePrefix = filePrefix ? `${filePrefix}-` : '';
  const filename = `${filenamePrefix}${Date.now()}-${safeFilename}`;
  const key = `${subdir}/${filename}`;

  const result = await uploadFileToStorage({ localPath: file.path, key, contentType: 'application/octet-stream' });
  return result;
};
