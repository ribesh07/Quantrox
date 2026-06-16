import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { MerchantQRCodeService } from "../services/merchant-qr-code.service";
import { AuditLogService } from "../services/audit-log.service";
import multer from "multer";
import { getUploadDirectory, saveUploadedFile } from "../utils/uploads";
import { paramString, queryInt, queryString } from "../utils/request";

const upload = multer({ dest: getUploadDirectory() });
const bulkUpload = multer({ dest: getUploadDirectory() }).array("images", 20);

export const assignMerchantQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = paramString(req.params.userId);
    if (!req.file) {
      return res.status(400).json({ success: false, message: "QR code image is required" });
    }
    const imageUrl = await saveUploadedFile(req.file, "merchant-qrs");
    const { label, paymentMethodId, replaceQrId } = req.body;

    const qrCode = await MerchantQRCodeService.assign({
      userId,
      imageUrl,
      assignedBy: req.user!.userId,
      label: label || undefined,
      paymentMethodId: paymentMethodId || undefined,
      replaceQrId: replaceQrId || undefined,
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
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to assign QR code" });
  }
};

export const bulkAssignMerchantQRCodes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = paramString(req.params.userId);
    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      return res.status(400).json({ success: false, message: "At least one QR image is required" });
    }

    const labels: string[] = req.body.labels
      ? typeof req.body.labels === "string"
        ? JSON.parse(req.body.labels)
        : req.body.labels
      : [];
    const paymentMethodIds: string[] = req.body.paymentMethodIds
      ? typeof req.body.paymentMethodIds === "string"
        ? JSON.parse(req.body.paymentMethodIds)
        : req.body.paymentMethodIds
      : [];

    const items = await Promise.all(
      files.map(async (file, index) => ({
        imageUrl: await saveUploadedFile(file, "merchant-qrs"),
        label: labels[index] || undefined,
        paymentMethodId: paymentMethodIds[index] || undefined,
      }))
    );

    const qrCodes = await MerchantQRCodeService.bulkAssign(
      userId,
      req.user!.userId,
      items
    );

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: "BULK_ASSIGN_MERCHANT_QR",
      resource: "MERCHANT_QR_CODE",
      resourceId: userId,
      changes: { count: qrCodes.length },
      result: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, qrCodes, count: qrCodes.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to bulk assign QR codes" });
  }
};

export const getMyMerchantQRCodes = async (req: AuthRequest, res: Response) => {
  try {
    const qrCodes = await MerchantQRCodeService.getByUserId(req.user!.userId);
    res.json({ success: true, qrCodes });
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
    res.json({ success: true, ...result });
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
