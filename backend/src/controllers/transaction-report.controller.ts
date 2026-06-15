import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { TransactionReportService } from "../services/transaction-report.service";
import { AuditLogService } from "../services/audit-log.service";
import multer from "multer";
import { getUploadDirectory, saveUploadedFile } from "../utils/uploads";

const upload = multer({ dest: getUploadDirectory() });

export const createTransactionReport = async (req: AuthRequest, res: Response) => {
  try {
    const { transactionDate, totalTransactions, totalAmount, notes } = req.body;
    let proofImage;
    
    if (req.file) {
      proofImage = await saveUploadedFile(req.file, 'reports');
    }

    const report = await TransactionReportService.create({
      userId: req.user!.id,
      transactionDate: new Date(Array.isArray(transactionDate) ? transactionDate[0] : transactionDate),
      totalTransactions: parseInt(Array.isArray(totalTransactions) ? totalTransactions[0] : totalTransactions),
      totalAmount: parseFloat(Array.isArray(totalAmount) ? totalAmount[0] : totalAmount),
      proofImage,
      notes,
    });

    await AuditLogService.log({
      userId: req.user!.id,
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
    const result = await TransactionReportService.getByUserId(req.user!.id, {
      status: status as any,
      fromDate: fromDate ? new Date(Array.isArray(fromDate) ? fromDate[0] : fromDate) : undefined,
      toDate: toDate ? new Date(Array.isArray(toDate) ? toDate[0] : toDate) : undefined,
      limit: limit ? parseInt(Array.isArray(limit) ? limit[0] : limit) : undefined,
      offset: offset ? parseInt(Array.isArray(offset) ? offset[0] : offset) : undefined,
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
      userId: Array.isArray(userId) ? userId[0] : userId,
      fromDate: fromDate ? new Date(Array.isArray(fromDate) ? fromDate[0] : fromDate) : undefined,
      toDate: toDate ? new Date(Array.isArray(toDate) ? toDate[0] : toDate) : undefined,
      limit: limit ? parseInt(Array.isArray(limit) ? limit[0] : limit) : undefined,
      offset: offset ? parseInt(Array.isArray(offset) ? offset[0] : offset) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get reports' });
  }
};

export const approveTransactionReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const report = await TransactionReportService.approve(id, req.user!.id);
    
    await AuditLogService.log({
      userId: req.user!.id,
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
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const report = await TransactionReportService.reject(id, req.user!.id, rejectionReason);
    
    await AuditLogService.log({
      userId: req.user!.id,
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
