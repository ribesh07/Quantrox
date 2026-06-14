import { Request, Response } from "express";
import { MerchantQRCodeService } from "../services/merchant-qr-code.service";
import { AuditLogService } from "../services/audit-log.service";
import multer from "multer";
import { getUploadDirectory, saveUploadedFile } from "../utils/uploads";

const upload = multer({ dest: getUploadDirectory('merchant-qrs') });

export const assignMerchantQRCode = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'QR code image is required' });
    }
    const imageUrl = await saveUploadedFile(req.file, 'merchant-qrs');
    const qrCode = await MerchantQRCodeService.assign({
      userId,
      imageUrl,
      assignedBy: (req as any).user.id,
    });

    await AuditLogService.log({
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
      action: 'ASSIGN_MERCHANT_QR',
      resource: 'MERCHANT_QR_CODE',
      resourceId: qrCode.id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: qrCode });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to assign QR code' });
  }
};

export const getMyMerchantQRCode = async (req: Request, res: Response) => {
  try {
    const qrCode = await MerchantQRCodeService.getByUserId((req as any).user.id);
    res.json({ success: true, data: qrCode });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get QR code' });
  }
};

export const getAllMerchantQRCodes = async (req: Request, res: Response) => {
  try {
    const { active, limit, offset } = req.query;
    const result = await MerchantQRCodeService.getAll({
      active: active !== undefined ? active === 'true' : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get QR codes' });
  }
};

export const disableMerchantQRCode = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const qrCode = await MerchantQRCodeService.disable(userId);
    res.json({ success: true, data: qrCode });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to disable QR code' });
  }
};

export const enableMerchantQRCode = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const qrCode = await MerchantQRCodeService.enable(userId);
    res.json({ success: true, data: qrCode });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to enable QR code' });
  }
};

export { upload };
