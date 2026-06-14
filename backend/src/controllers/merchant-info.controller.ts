import { Request, Response } from "express";
import { MerchantInfoService } from "../services/merchant-info.service";
import { AuditLogService } from "../services/audit-log.service";
import { NotificationService } from "../services/notification.service";

export const createMerchantInfo = async (req: Request, res: Response) => {
  try {
    const { businessName, businessDescription, preferredWalletId, expectedDailyVolume } = req.body;
    const merchantInfo = await MerchantInfoService.create({
      userId: (req as any).user.id,
      businessName,
      businessDescription,
      preferredWalletId,
      expectedDailyVolume: parseFloat(expectedDailyVolume),
    });

    await AuditLogService.log({
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
      action: 'CREATE_MERCHANT_INFO',
      resource: 'MERCHANT_INFO',
      resourceId: merchantInfo.id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: merchantInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create merchant info' });
  }
};

export const getMyMerchantInfo = async (req: Request, res: Response) => {
  try {
    const merchantInfo = await MerchantInfoService.getByUserId((req as any).user.id);
    res.json({ success: true, data: merchantInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get merchant info' });
  }
};

export const getAllMerchants = async (req: Request, res: Response) => {
  try {
    const { approved, limit, offset } = req.query;
    const result = await MerchantInfoService.getAll({
      approved: approved ? approved === 'true' : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get merchants' });
  }
};

export const approveMerchant = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { adminNote } = req.body;
    const merchantInfo = await MerchantInfoService.approve(userId, (req as any).user.id, adminNote);
    
    await NotificationService.create({
      userId,
      title: 'Merchant Approved',
      message: 'Your merchant account has been approved!',
      type: 'SUCCESS',
      referenceType: 'MERCHANT_INFO',
      referenceId: merchantInfo.id,
    });

    await AuditLogService.log({
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
      action: 'APPROVE_MERCHANT',
      resource: 'MERCHANT_INFO',
      resourceId: merchantInfo.id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: merchantInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve merchant' });
  }
};

export const rejectMerchant = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { adminNote } = req.body;
    const merchantInfo = await MerchantInfoService.reject(userId, (req as any).user.id, adminNote);
    
    await NotificationService.create({
      userId,
      title: 'Merchant Rejected',
      message: 'Your merchant application has been rejected.',
      type: 'ERROR',
      referenceType: 'MERCHANT_INFO',
      referenceId: merchantInfo.id,
    });

    await AuditLogService.log({
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
      action: 'REJECT_MERCHANT',
      resource: 'MERCHANT_INFO',
      resourceId: merchantInfo.id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: merchantInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject merchant' });
  }
};

export const updateMyMerchantInfo = async (req: Request, res: Response) => {
  try {
    const { businessName, businessDescription, preferredWalletId, expectedDailyVolume } = req.body;
    const merchantInfo = await MerchantInfoService.update((req as any).user.id, {
      businessName,
      businessDescription,
      preferredWalletId,
      expectedDailyVolume: expectedDailyVolume ? parseFloat(expectedDailyVolume) : undefined,
    });
    res.json({ success: true, data: merchantInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update merchant info' });
  }
};
