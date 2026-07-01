import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { MerchantQRCodeService } from "../services/merchant-qr-code.service";
import { AuditLogService } from "../services/audit-log.service";
import multer from "multer";
import { getUploadDirectory, saveUploadedFile } from "../utils/uploads";
import { paramString, queryInt, queryString } from "../utils/request";

const upload = multer({ dest: getUploadDirectory(), limits: { fileSize: 50 * 1024 * 1024 } });
const bulkUpload = multer({ dest: getUploadDirectory(), limits: { fileSize: 50 * 1024 * 1024 } });

export const assignMerchantQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = paramString(req.params.userId);
    if (!req.file) {
      return res.status(400).json({ success: false, message: "QR code image is required" });
    }
    const imageUrl = await saveUploadedFile(req.file, "merchant-qrs");
    const label = req.body.label as string | undefined;
    const qrCode = await MerchantQRCodeService.assign({
      userId,
      imageUrl,
      assignedBy: req.user!.userId,
      label,
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: "ASSIGN_MERCHANT_QR",
      resource: "MERCHANT_QR_CODE",
      resourceId: qrCode.id,
      result: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, qrCode });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to assign QR code" });
  }
};

export const assignMultipleMerchantQRCodes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = paramString(req.params.userId);
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: "At least one QR code image is required" });
    }

    const labels: string[] = req.body.labels
      ? (Array.isArray(req.body.labels) ? req.body.labels : [req.body.labels])
      : [];

    const images = await Promise.all(
      files.map(async (file, i) => ({
        imageUrl: await saveUploadedFile(file, "merchant-qrs"),
        label: labels[i] || undefined,
      }))
    );

    const qrs = await MerchantQRCodeService.assignMultiple({
      userId,
      images,
      assignedBy: req.user!.userId,
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: "ASSIGN_MERCHANT_QR_BULK",
      resource: "MERCHANT_QR_CODE",
      resourceId: userId,
      result: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, qrs, count: qrs.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to assign QR codes" });
  }
};

export const replaceMerchantQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const qrId = paramString(req.params.qrId);
    if (!req.file) {
      return res.status(400).json({ success: false, message: "QR code image is required" });
    }
    const imageUrl = await saveUploadedFile(req.file, "merchant-qrs");
    const label = req.body.label as string | undefined;
    const qrCode = await MerchantQRCodeService.replace(qrId, {
      imageUrl,
      assignedBy: req.user!.userId,
      label,
    });

    res.json({ success: true, qrCode });
  } catch (error: any) {
    res.status(error.message === "QR code not found" ? 404 : 500).json({
      success: false,
      message: error.message || "Failed to replace QR code",
    });
  }
};

export const getMyMerchantQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const qrCodes = await MerchantQRCodeService.getByUserId(req.user!.userId);
    res.json({ success: true, qrCodes, qrCode: qrCodes[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get QR codes" });
  }
};

export const getAllMerchantQRCodes = async (req: AuthRequest, res: Response) => {
  try {
    const { active, userId, limit, offset } = req.query;
    const activeValue = queryString(active);
    const result = await MerchantQRCodeService.getAll({
      active: activeValue !== undefined ? activeValue === "true" : undefined,
      userId: queryString(userId),
      limit: queryInt(limit),
      offset: queryInt(offset),
    });
    const stats = await MerchantQRCodeService.getStats();
    res.json({ success: true, qrs: result.qrs, count: result.count, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get QR codes" });
  }
};

export const disableMerchantQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const qrId = paramString(req.params.qrId);
    const qrCode = await MerchantQRCodeService.disable(qrId);
    res.json({ success: true, qrCode });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to disable QR code" });
  }
};

export const enableMerchantQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const qrId = paramString(req.params.qrId);
    const qrCode = await MerchantQRCodeService.enable(qrId);
    res.json({ success: true, qrCode });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to enable QR code" });
  }
};

export { upload, bulkUpload };
