import { Request, Response } from "express";
import { DepositService } from "../services/deposit.service";
import { AuditLogService } from "../services/audit-log.service";

export const createDeposit = async (req: Request, res: Response) => {
  try {
    const { amount, type, requiredDeposit, notes } = req.body;
    const deposit = await DepositService.create({
      userId: (req as any).user.id,
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

export const getMyDeposits = async (req: Request, res: Response) => {
  try {
    const { status, type, fromDate, toDate, limit, offset } = req.query;
    const result = await DepositService.getByUserId((req as any).user.id, {
      status: status as any,
      type: type as any,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get deposits' });
  }
};

export const getAllDeposits = async (req: Request, res: Response) => {
  try {
    const { status, userId, type, fromDate, toDate, limit, offset } = req.query;
    const result = await DepositService.getAll({
      status: status as any,
      userId: userId as string,
      type: type as any,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get deposits' });
  }
};

export const approveDeposit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deposit = await DepositService.approve(id, (req as any).user.id);
    
    await AuditLogService.log({
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
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

export const rejectDeposit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deposit = await DepositService.reject(id, (req as any).user.id);
    
    await AuditLogService.log({
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
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

export const freezeDeposit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deposit = await DepositService.freeze(id, (req as any).user.id);
    
    await AuditLogService.log({
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
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

export const releaseDeposit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deposit = await DepositService.release(id, (req as any).user.id);
    
    await AuditLogService.log({
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
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

export const adjustDeposit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;
    const deposit = await DepositService.adjust(id, parseFloat(amount), (req as any).user.id, notes);
    
    await AuditLogService.log({
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
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

export const getMyTotalDeposit = async (req: Request, res: Response) => {
  try {
    const total = await DepositService.getUserTotalDeposit((req as any).user.id);
    res.json({ success: true, data: { total } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get total deposit' });
  }
};
