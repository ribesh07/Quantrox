import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { MerchantInfoService } from "../services/merchant-info.service";
import { AuditLogService } from "../services/audit-log.service";
import { NotificationService } from "../services/notification.service";
import { paramString, queryInt, queryString } from "../utils/request";

export const createMerchantInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { businessName, businessDescription, preferredWalletId, preferredPaymentMethodId, expectedDailyVolume } = req.body;
    const merchantInfo = await MerchantInfoService.create({
      userId: req.user!.userId,
      businessName,
      businessDescription,
      preferredWalletId,
      preferredPaymentMethodId,
      expectedDailyVolume: parseFloat(expectedDailyVolume),
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'CREATE_MERCHANT_INFO',
      resource: 'MERCHANT_INFO',
      resourceId: merchantInfo.id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, info: merchantInfo });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create merchant info' });
  }
};

export const getMyMerchantInfo = async (req: AuthRequest, res: Response) => {
  try {
    const merchantInfo = await MerchantInfoService.getByUserId(req.user!.userId);
    res.json({ success: true, info: merchantInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get merchant info' });
  }
};

export const getAllMerchants = async (req: AuthRequest, res: Response) => {
  try {
    const { approved, limit, offset } = req.query;
    const result = await MerchantInfoService.getAll({
      approved: queryString(approved) ? queryString(approved) === 'true' : undefined,
      limit: queryInt(limit),
      offset: queryInt(offset),
    });
    res.json({ success: true, merchants: result.merchants, count: result.count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get merchants' });
  }
};

export const createMerchant = async (req: AuthRequest, res: Response) => {
  try {
    const {
      userId,
      businessName,
      businessDescription,
      preferredPaymentMethodId,
      expectedDailyVolume,
      autoApprove = true,
    } = req.body;

    const merchantInfo = await MerchantInfoService.createForUser({
      userId,
      businessName,
      businessDescription,
      preferredPaymentMethodId,
      expectedDailyVolume: parseFloat(expectedDailyVolume),
      autoApprove: autoApprove !== false,
      adminId: req.user!.userId,
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'CREATE_MERCHANT',
      resource: 'MERCHANT_INFO',
      resourceId: merchantInfo.id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, merchant: merchantInfo });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to create merchant' });
  }
};

export const approveMerchant = async (req: AuthRequest, res: Response) => {
  try {
    const userId = paramString(req.params.userId);
    const { adminNote } = req.body;
    const merchantInfo = await MerchantInfoService.approve(userId, req.user!.userId, adminNote);
    
    await NotificationService.send({
      userId,
      title: 'Merchant Approved',
      message: 'Your merchant account has been approved!',
      type: 'SUCCESS',
      referenceType: 'MERCHANT_INFO',
      referenceId: merchantInfo.id,
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'APPROVE_MERCHANT',
      resource: 'MERCHANT_INFO',
      resourceId: merchantInfo.id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, merchant: merchantInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve merchant' });
  }
};

export const rejectMerchant = async (req: AuthRequest, res: Response) => {
  try {
    const userId = paramString(req.params.userId);
    const { adminNote } = req.body;
    const merchantInfo = await MerchantInfoService.reject(userId, req.user!.userId, adminNote);
    
    await NotificationService.send({
      userId,
      title: 'Merchant Rejected',
      message: 'Your merchant application has been rejected.',
      type: 'ERROR',
      referenceType: 'MERCHANT_INFO',
      referenceId: merchantInfo.id,
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'REJECT_MERCHANT',
      resource: 'MERCHANT_INFO',
      resourceId: merchantInfo.id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, merchant: merchantInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject merchant' });
  }
};

export const updateMyMerchantInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { businessName, businessDescription, preferredWalletId, preferredPaymentMethodId, expectedDailyVolume } = req.body;
    const merchantInfo = await MerchantInfoService.update(req.user!.userId, {
      businessName,
      businessDescription,
      preferredWalletId,
      preferredPaymentMethodId,
      expectedDailyVolume: expectedDailyVolume ? parseFloat(expectedDailyVolume) : undefined,
    });
    res.json({ success: true, info: merchantInfo });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update merchant info' });
  }
};
