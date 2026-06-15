import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { MerchantQRCodeService } from "../services/merchant-qr-code.service";
import { AuditLogService } from "../services/audit-log.service";
import multer from "multer";
import { getUploadDirectory, saveUploadedFile } from "../utils/uploads";
import { paramString, queryInt, queryString } from "../utils/request";

const upload = multer({ dest: getUploadDirectory() });

export const assignMerchantQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = paramString(req.params.userId);
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'QR code image is required' });
    }
    const imageUrl = await saveUploadedFile(req.file, 'merchant-qrs');
    const qrCode = await MerchantQRCodeService.assign({
      userId,
      imageUrl,
      assignedBy: req.user!.userId,
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
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

export const getMyMerchantQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const qrCode = await MerchantQRCodeService.getByUserId(req.user!.userId);
    res.json({ success: true, data: qrCode });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get QR code' });
  }
};

export const getAllMerchantQRCodes = async (req: AuthRequest, res: Response) => {
  try {
    const { active, limit, offset } = req.query;
    const activeValue = queryString(active);
    const result = await MerchantQRCodeService.getAll({
      active: activeValue !== undefined ? activeValue === 'true' : undefined,
      limit: queryInt(limit),
      offset: queryInt(offset),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get QR codes' });
  }
};

export const disableMerchantQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = paramString(req.params.userId);
    const qrCode = await MerchantQRCodeService.disable(userId);
    res.json({ success: true, data: qrCode });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to disable QR code' });
  }
};

export const enableMerchantQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = paramString(req.params.userId);
    const qrCode = await MerchantQRCodeService.enable(userId);
    res.json({ success: true, data: qrCode });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to enable QR code' });
  }
};

export { upload };
