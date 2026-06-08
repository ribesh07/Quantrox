import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { QRCodeService } from '../services/qr.service';
import path from 'path';
import fs from 'fs/promises';

export const getAllQRCodes = async (req: AuthRequest, res: Response) => {
  try {
    const qrCodes = await QRCodeService.getAll();
    res.json({ success: true, qrCodes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const uploadDir = path.join(process.cwd(), '..', 'frontend', 'public', 'uploads', 'qrs');
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    const targetPath = path.join(uploadDir, filename);

    await fs.rename(file.path, targetPath);

    const imageUrl = `/uploads/qrs/${filename}`;
    const qrCode = await QRCodeService.create(imageUrl);

    res.status(201).json({ success: true, qrCode });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { active } = req.body;
    const qrCode = await QRCodeService.update(id, active);
    res.json({ success: true, qrCode });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await QRCodeService.delete(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
