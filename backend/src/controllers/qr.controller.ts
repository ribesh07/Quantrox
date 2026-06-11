import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { QRCodeService } from '../services/qr.service';
import { saveUploadedFile } from '../utils/uploads';

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

    const imageUrl = await saveUploadedFile({
      tempPath: file.path,
      originalName: file.originalname,
      subdirectory: 'qrs',
    });
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
