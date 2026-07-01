import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { TransactionReportService } from "../services/transaction-report.service";
import { AuditLogService } from "../services/audit-log.service";
import multer from "multer";
import { getUploadDirectory, saveUploadedFile } from "../utils/uploads";
import { paramString, queryDate, queryInt, queryString } from "../utils/request";

const upload = multer({ dest: getUploadDirectory() });

export const createTransactionReport = async (req: AuthRequest, res: Response) => {
  try {
    const { transactionDate, totalTransactions, totalAmount, notes } = req.body;
    let proofImage;
    
    if (req.file) {
      proofImage = await saveUploadedFile(req.file, 'reports');
    }

    const report = await TransactionReportService.create({
      userId: req.user!.userId,
      transactionDate: new Date(transactionDate),
      totalTransactions: parseInt(totalTransactions, 10),
      totalAmount: parseFloat(totalAmount),
      proofImage,
      notes,
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'CREATE_TRANSACTION_REPORT',
      resource: 'TRANSACTION_REPORT',
      resourceId: report.id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create report' });
  }
};

export const getMyTransactionReports = async (req: AuthRequest, res: Response) => {
  try {
    const { status, fromDate, toDate, limit, offset } = req.query;
    const result = await TransactionReportService.getByUserId(req.user!.userId, {
      status: status as any,
      fromDate: queryDate(fromDate),
      toDate: queryDate(toDate),
      limit: queryInt(limit),
      offset: queryInt(offset),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get reports' });
  }
};

export const getAllTransactionReports = async (req: AuthRequest, res: Response) => {
  try {
    const { status, userId, fromDate, toDate, limit, offset } = req.query;
    const result = await TransactionReportService.getAll({
      status: status as any,
      userId: queryString(userId),
      fromDate: queryDate(fromDate),
      toDate: queryDate(toDate),
      limit: queryInt(limit),
      offset: queryInt(offset),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get reports' });
  }
};

export const approveTransactionReport = async (req: AuthRequest, res: Response) => {
  try {
    const id = paramString(req.params.id);
    const report = await TransactionReportService.approve(id, req.user!.userId);
    
    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'APPROVE_TRANSACTION_REPORT',
      resource: 'TRANSACTION_REPORT',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve report' });
  }
};

export const rejectTransactionReport = async (req: AuthRequest, res: Response) => {
  try {
    const id = paramString(req.params.id);
    const { rejectionReason } = req.body;
    const report = await TransactionReportService.reject(id, req.user!.userId, rejectionReason);
    
    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'REJECT_TRANSACTION_REPORT',
      resource: 'TRANSACTION_REPORT',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject report' });
  }
};

export { upload };
