import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { MerchantInfoService } from "../services/merchant-info.service";
import { AuditLogService } from "../services/audit-log.service";
import { NotificationService } from "../services/notification.service";
import { paramString, queryInt, queryString } from "../utils/request";

export const createMerchantInfo = async (req: AuthRequest, res: Response) => {
  try {
    const {
      businessName,
      businessDescription,
      preferredWalletId,
      expectedDailyVolume,
      merchantWallets,
    } = req.body;

    const merchantInfo = await MerchantInfoService.create({
      userId: req.user!.userId,
      businessName,
      businessDescription,
      preferredWalletId,
      expectedDailyVolume: parseFloat(expectedDailyVolume),
      merchantWallets,
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: "CREATE_MERCHANT_INFO",
      resource: "MERCHANT_INFO",
      resourceId: merchantInfo.id,
      result: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, info: merchantInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create merchant info" });
  }
};

export const getMyMerchantInfo = async (req: AuthRequest, res: Response) => {
  try {
    const merchantInfo = await MerchantInfoService.getByUserId(req.user!.userId);
    res.json({ success: true, info: merchantInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get merchant info" });
  }
};

export const getAllMerchants = async (req: AuthRequest, res: Response) => {
  try {
    const { approved, limit, offset } = req.query;
    const result = await MerchantInfoService.getAll({
      approved: queryString(approved) ? queryString(approved) === "true" : undefined,
      limit: queryInt(limit),
      offset: queryInt(offset),
    });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get merchants" });
  }
};

export const getMerchantDetails = async (req: AuthRequest, res: Response) => {
  try {
    const userId = paramString(req.params.userId);
    const details = await MerchantInfoService.getDetails(userId);
    if (!details) {
      return res.status(404).json({ success: false, message: "Merchant not found" });
    }
    res.json({ success: true, merchant: details });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get merchant details" });
  }
};

export const approveMerchant = async (req: AuthRequest, res: Response) => {
  try {
    const userId = paramString(req.params.userId);
    const { adminNote } = req.body;
    const merchantInfo = await MerchantInfoService.approve(userId, req.user!.userId, adminNote);

    await NotificationService.send({
      userId,
      title: "Merchant Approved",
      message: "Your merchant account has been approved!",
      type: "SUCCESS",
      referenceType: "MERCHANT_INFO",
      referenceId: merchantInfo.id,
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: "APPROVE_MERCHANT",
      resource: "MERCHANT_INFO",
      resourceId: merchantInfo.id,
      result: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, merchant: merchantInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to approve merchant" });
  }
};

export const rejectMerchant = async (req: AuthRequest, res: Response) => {
  try {
    const userId = paramString(req.params.userId);
    const { adminNote } = req.body;
    const merchantInfo = await MerchantInfoService.reject(userId, req.user!.userId, adminNote);

    await NotificationService.send({
      userId,
      title: "Merchant Rejected",
      message: "Your merchant application has been rejected.",
      type: "ERROR",
      referenceType: "MERCHANT_INFO",
      referenceId: merchantInfo.id,
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: "REJECT_MERCHANT",
      resource: "MERCHANT_INFO",
      resourceId: merchantInfo.id,
      result: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, merchant: merchantInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reject merchant" });
  }
};

export const updateMyMerchantInfo = async (req: AuthRequest, res: Response) => {
  try {
    const {
      businessName,
      businessDescription,
      preferredWalletId,
      expectedDailyVolume,
      merchantWallets,
    } = req.body;

    const merchantInfo = await MerchantInfoService.update(req.user!.userId, {
      businessName,
      businessDescription,
      preferredWalletId,
      expectedDailyVolume: expectedDailyVolume ? parseFloat(expectedDailyVolume) : undefined,
      merchantWallets,
    });
    res.json({ success: true, info: merchantInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update merchant info" });
  }
};
