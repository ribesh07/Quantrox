"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToStorage = uploadFileToStorage;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
async function uploadFileToStorage(opts) {
    const target = path_1.default.join(env_1.env.uploadDir, opts.key);
    await promises_1.default.mkdir(path_1.default.dirname(target), { recursive: true });
    await promises_1.default.rename(opts.localPath, target);
    return `/uploads/${opts.key}`;
}
