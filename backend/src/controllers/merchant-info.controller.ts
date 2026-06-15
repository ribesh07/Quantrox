import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { MerchantInfoService } from "../services/merchant-info.service";
import { AuditLogService } from "../services/audit-log.service";
import { NotificationService } from "../services/notification.service";

export const createMerchantInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { businessName, businessDescription, preferredWalletId, expectedDailyVolume } = req.body;
    const merchantInfo = await MerchantInfoService.create({
      userId: req.user!.id,
      businessName,
      businessDescription,
      preferredWalletId,
      expectedDailyVolume: parseFloat(expectedDailyVolume),
    });

    await AuditLogService.log({
      userId: req.user!.id,
      userEmail: req.user!.email,
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

export const getMyMerchantInfo = async (req: AuthRequest, res: Response) => {
  try {
    const merchantInfo = await MerchantInfoService.getByUserId(req.user!.id);
    res.json({ success: true, data: merchantInfo });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get merchant info' });
  }
};

export const getAllMerchants = async (req: AuthRequest, res: Response) => {
  try {
    const { approved, limit, offset } = req.query;
    const result = await MerchantInfoService.getAll({
      approved: approved ? approved === 'true' : undefined,
      limit: limit ? parseInt(Array.isArray(limit) ? limit[0] : limit) : undefined,
      offset: offset ? parseInt(Array.isArray(offset) ? offset[0] : offset) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get merchants' });
  }
};

export const approveMerchant = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { adminNote } = req.body;
    const merchantInfo = await MerchantInfoService.approve(userId, req.user!.id, adminNote);
    
    await NotificationService.send({
      userId,
      title: 'Merchant Approved',
      message: 'Your merchant account has been approved!',
      type: 'SUCCESS',
      referenceType: 'MERCHANT_INFO',
      referenceId: merchantInfo.id,
    });

    await AuditLogService.log({
      userId: req.user!.id,
      userEmail: req.user!.email,
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

export const rejectMerchant = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { adminNote } = req.body;
    const merchantInfo = await MerchantInfoService.reject(userId, req.user!.id, adminNote);
    
    await NotificationService.send({
      userId,
      title: 'Merchant Rejected',
      message: 'Your merchant application has been rejected.',
      type: 'ERROR',
      referenceType: 'MERCHANT_INFO',
      referenceId: merchantInfo.id,
    });

    await AuditLogService.log({
      userId: req.user!.id,
      userEmail: req.user!.email,
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

export const updateMyMerchantInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { businessName, businessDescription, preferredWalletId, expectedDailyVolume } = req.body;
    const merchantInfo = await MerchantInfoService.update(req.user!.id, {
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
