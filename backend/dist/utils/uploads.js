"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveUploadedFile = exports.getUploadDirectory = exports.ensureUploadDirectory = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const storage_1 = require("./storage");
const sanitizeFilename = (filename) => path_1.default.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '-');
const ensureUploadDirectory = async (subdirectory) => {
    const targetDirectory = subdirectory
        ? path_1.default.join(env_1.env.uploadDir, subdirectory)
        : env_1.env.uploadDir;
    await promises_1.default.mkdir(targetDirectory, { recursive: true });
    return targetDirectory;
};
exports.ensureUploadDirectory = ensureUploadDirectory;
const getUploadDirectory = () => env_1.env.uploadDir;
exports.getUploadDirectory = getUploadDirectory;
const saveUploadedFile = async ({ originalName, prefix, subdirectory, tempPath, }) => {
    const safeFilename = sanitizeFilename(originalName || 'upload.bin');
    const filenamePrefix = prefix ? `${prefix}-` : '';
    const filename = `${filenamePrefix}${Date.now()}-${safeFilename}`;
    const key = `${subdirectory}/${filename}`;
    // Use S3 when configured, otherwise move to local upload dir
    const result = await (0, storage_1.uploadFileToStorage)({ localPath: tempPath, key, contentType: 'application/octet-stream' });
    return result;
};
exports.saveUploadedFile = saveUploadedFile;
