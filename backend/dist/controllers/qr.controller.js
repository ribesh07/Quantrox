"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQRCode = exports.updateQRCode = exports.createQRCode = exports.getAllQRCodes = void 0;
const qr_service_1 = require("../services/qr.service");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const getAllQRCodes = async (req, res) => {
    try {
        const qrCodes = await qr_service_1.QRCodeService.getAll();
        res.json({ success: true, qrCodes });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllQRCodes = getAllQRCodes;
const createQRCode = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        const uploadDir = path_1.default.join(process.cwd(), '..', 'frontend', 'public', 'uploads', 'qrs');
        await promises_1.default.mkdir(uploadDir, { recursive: true });
        const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
        const targetPath = path_1.default.join(uploadDir, filename);
        await promises_1.default.rename(file.path, targetPath);
        const imageUrl = `/uploads/qrs/${filename}`;
        const qrCode = await qr_service_1.QRCodeService.create(imageUrl);
        res.status(201).json({ success: true, qrCode });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createQRCode = createQRCode;
const updateQRCode = async (req, res) => {
    try {
        const id = req.params.id;
        const { active } = req.body;
        const qrCode = await qr_service_1.QRCodeService.update(id, active);
        res.json({ success: true, qrCode });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateQRCode = updateQRCode;
const deleteQRCode = async (req, res) => {
    try {
        const id = req.params.id;
        await qr_service_1.QRCodeService.delete(id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.deleteQRCode = deleteQRCode;
