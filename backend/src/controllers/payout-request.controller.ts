import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { PayoutRequestService } from "../services/payout-request.service";
import { AuditLogService } from "../services/audit-log.service";
import multer from "multer";
import { getUploadDirectory, saveUploadedFile } from "../utils/uploads";

const upload = multer({ dest: getUploadDirectory() });

export const createPayoutRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, walletAddress, walletNetwork, remarks } = req.body;
    let qrCodeImage;
    
    if (req.file) {
      qrCodeImage = await saveUploadedFile(req.file, 'payout-qrs');
    }

    const payout = await PayoutRequestService.create({
      userId: req.user!.id,
      amount: parseFloat(amount),
      walletAddress,
      walletNetwork,
      qrCodeImage,
      remarks,
    });

    await AuditLogService.log({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'CREATE_PAYOUT_REQUEST',
      resource: 'PAYOUT_REQUEST',
      resourceId: payout.id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: payout });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create payout request' });
  }
};

export const getMyPayoutRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, fromDate, toDate, limit, offset } = req.query;
    const result = await PayoutRequestService.getByUserId(req.user!.id, {
      status: status as any,
      fromDate: fromDate ? new Date(Array.isArray(fromDate) ? fromDate[0] : fromDate) : undefined,
      toDate: toDate ? new Date(Array.isArray(toDate) ? toDate[0] : toDate) : undefined,
      limit: limit ? parseInt(Array.isArray(limit) ? limit[0] : limit) : undefined,
      offset: offset ? parseInt(Array.isArray(offset) ? offset[0] : offset) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get payout requests' });
  }
};

export const getAllPayoutRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, userId, fromDate, toDate, limit, offset } = req.query;
    const result = await PayoutRequestService.getAll({
      status: status as any,
      userId: Array.isArray(userId) ? userId[0] : userId,
      fromDate: fromDate ? new Date(Array.isArray(fromDate) ? fromDate[0] : fromDate) : undefined,
      toDate: toDate ? new Date(Array.isArray(toDate) ? toDate[0] : toDate) : undefined,
      limit: limit ? parseInt(Array.isArray(limit) ? limit[0] : limit) : undefined,
      offset: offset ? parseInt(Array.isArray(offset) ? offset[0] : offset) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get payout requests' });
  }
};

export const submitPayoutForReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const payout = await PayoutRequestService.submitForReview(id);
    res.json({ success: true, data: payout });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit payout for review' });
  }
};

export const approvePayoutRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const payout = await PayoutRequestService.approve(id, req.user!.id);
    
    await AuditLogService.log({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'APPROVE_PAYOUT',
      resource: 'PAYOUT_REQUEST',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: payout });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve payout' });
  }
};

export const rejectPayoutRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const payout = await PayoutRequestService.reject(id, req.user!.id, rejectionReason);
    
    await AuditLogService.log({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'REJECT_PAYOUT',
      resource: 'PAYOUT_REQUEST',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: payout });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject payout' });
  }
};

export const markPayoutPaid = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { transactionHash } = req.body;
    const payout = await PayoutRequestService.markPaid(id, req.user!.id, transactionHash);
    
    await AuditLogService.log({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'MARK_PAYOUT_PAID',
      resource: 'PAYOUT_REQUEST',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, data: payout });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark payout as paid' });
  }
};

export { upload };
