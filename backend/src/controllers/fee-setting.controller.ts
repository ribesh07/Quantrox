import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { FeeSettingService } from '../services/fee-setting.service';
import { AuditLogService } from '../services/audit-log.service';

export const getFeeSettings = async (req: AuthRequest, res: Response) => {
  try {
    const fees = await FeeSettingService.getAll();
    res.json({ success: true, fees });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFeeSettingById = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const fee = await FeeSettingService.getById(id as string);
    if (!fee) {
      return res.status(404).json({ success: false, message: "Fee setting not found" });
    }
    res.json({ success: true, fee });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFeeSetting = async (req: AuthRequest, res: Response) => {
  try {
    const fee = await FeeSettingService.create(req.body);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'CREATE_FEE_SETTING',
      resource: 'FeeSetting',
      resourceId: fee.id,
      result: 'SUCCESS',
    });

    res.status(201).json({ success: true, fee });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateFeeSetting = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const oldFee = await FeeSettingService.getById(id as string);
    const fee = await FeeSettingService.update(id as string, req.body);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'UPDATE_FEE_SETTING',
      resource: 'FeeSetting',
      resourceId: id,
      changes: { before: oldFee, after: fee },
      result: 'SUCCESS',
    });

    res.json({ success: true, fee });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteFeeSetting = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await FeeSettingService.delete(id as string);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'DELETE_FEE_SETTING',
      resource: 'FeeSetting',
      resourceId: id,
      result: 'SUCCESS',
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
