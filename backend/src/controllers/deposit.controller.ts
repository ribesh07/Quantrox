import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { DepositService } from "../services/deposit.service";
import { AuditLogService } from "../services/audit-log.service";

export const createDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, type, requiredDeposit, notes } = req.body;
    const deposit = await DepositService.create({
      userId: req.user!.id,
      amount: parseFloat(amount),
      type,
      requiredDeposit: requiredDeposit ? parseFloat(requiredDeposit) : undefined,
      notes,
    });
    res.json({ success: true, data: deposit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create deposit' });
  }
};

export const getMyDeposits = async (req: AuthRequest, res: Response) => {
  try {
    const { status, type, fromDate, toDate, limit, offset } = req.query;
    const result = await DepositService.getByUserId(req.user!.id, {
      status: status as any,
      type: type as any,
      fromDate: fromDate ? new Date(Array.isArray(fromDate) ? fromDate[0] : fromDate) : undefined,
      toDate: toDate ? new Date(Array.isArray(toDate) ? toDate[0] : toDate) : undefined,
      limit: limit ? parseInt(Array.isArray(limit) ? limit[0] : limit) : undefined,
      offset: offset ? parseInt(Array.isArray(offset) ? offset[0] : offset) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get deposits' });
  }
};

export const getAllDeposits = async (req: AuthRequest, res: Response) => {
  try {
    const { status, userId, type, fromDate, toDate, limit, offset } = req.query;
    const result = await DepositService.getAll({
      status: status as any,
      userId: Array.isArray(userId) ? userId[0] : userId,
      type: type as any,
      fromDate: fromDate ? new Date(Array.isArray(fromDate) ? fromDate[0] : fromDate) : undefined,
      toDate: toDate ? new Date(Array.isArray(toDate) ? toDate[0] : toDate) : undefined,
      limit: limit ? parseInt(Array.isArray(limit) ? limit[0] : limit) : undefined,
      offset: offset ? parseInt(Array.isArray(offset) ? offset[0] : offset) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get deposits' });
  }
};

export const approveDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deposit = await DepositService.approve(id, req.user!.id);
    
    await AuditLogService.log({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'APPROVE_DEPOSIT',
      resource: 'DEPOSIT',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: deposit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve deposit' });
  }
};

export const rejectDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deposit = await DepositService.reject(id, req.user!.id);
    
    await AuditLogService.log({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'REJECT_DEPOSIT',
      resource: 'DEPOSIT',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: deposit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject deposit' });
  }
};

export const freezeDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deposit = await DepositService.freeze(id, req.user!.id);
    
    await AuditLogService.log({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'FREEZE_DEPOSIT',
      resource: 'DEPOSIT',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: deposit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to freeze deposit' });
  }
};

export const releaseDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deposit = await DepositService.release(id, req.user!.id);
    
    await AuditLogService.log({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'RELEASE_DEPOSIT',
      resource: 'DEPOSIT',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: deposit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to release deposit' });
  }
};

export const adjustDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;
    const deposit = await DepositService.adjust(id, parseFloat(amount), req.user!.id, notes);
    
    await AuditLogService.log({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'ADJUST_DEPOSIT',
      resource: 'DEPOSIT',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: deposit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to adjust deposit' });
  }
};

export const getMyTotalDeposit = async (req: AuthRequest, res: Response) => {
  try {
    const total = await DepositService.getUserTotalDeposit(req.user!.id);
    res.json({ success: true, data: { total } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get total deposit' });
  }
};
