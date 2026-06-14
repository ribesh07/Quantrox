import { Request, Response } from "express";
import { TransactionReportService } from "../services/transaction-report.service";
import { AuditLogService } from "../services/audit-log.service";
import multer from "multer";
import { getUploadDirectory, saveUploadedFile } from "../utils/uploads";

const upload = multer({ dest: getUploadDirectory('reports') });

export const createTransactionReport = async (req: Request, res: Response) => {
  try {
    const { transactionDate, totalTransactions, totalAmount, notes } = req.body;
    let proofImage;
    
    if (req.file) {
      proofImage = await saveUploadedFile(req.file, 'reports');
    }

    const report = await TransactionReportService.create({
      userId: (req as any).user.id,
      transactionDate: new Date(transactionDate),
      totalTransactions: parseInt(totalTransactions),
      totalAmount: parseFloat(totalAmount),
      proofImage,
      notes,
    });

    await AuditLogService.log({
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
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

export const getMyTransactionReports = async (req: Request, res: Response) => {
  try {
    const { status, fromDate, toDate, limit, offset } = req.query;
    const result = await TransactionReportService.getByUserId((req as any).user.id, {
      status: status as any,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get reports' });
  }
};

export const getAllTransactionReports = async (req: Request, res: Response) => {
  try {
    const { status, userId, fromDate, toDate, limit, offset } = req.query;
    const result = await TransactionReportService.getAll({
      status: status as any,
      userId: userId as string,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get reports' });
  }
};

export const approveTransactionReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const report = await TransactionReportService.approve(id, (req as any).user.id);
    
    await AuditLogService.log({
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
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

export const rejectTransactionReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const report = await TransactionReportService.reject(id, (req as any).user.id, rejectionReason);
    
    await AuditLogService.log({
      userId: (req as any).user.id,
      userEmail: (req as any).user.email,
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
