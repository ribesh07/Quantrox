import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ExchangeRequestService } from '../services/exchange-request.service';
import { prisma } from '../shared';
import { AuditLogService } from '../services/audit-log.service';
import { NotificationService } from '../services/notification.service';

export const createExchangeRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, walletAddress, paymentMethodId } = req.body;

    if (!amount || !walletAddress || !paymentMethodId) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const exchangeRequest = await ExchangeRequestService.create({
      userId: req.user!.userId,
      amount: parseFloat(amount),
      walletAddress,
      paymentMethodId,
    });

    await NotificationService.send({
      userId: req.user!.userId,
      title: 'Exchange Request Created',
      message: `Exchange request for $${amount} created successfully.`,
      type: 'SUCCESS',
      referenceType: 'EXCHANGE',
      referenceId: exchangeRequest.id,
    });

    res.status(201).json({ success: true, exchangeRequest });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyExchangeRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const requests = await ExchangeRequestService.getByUserId(req.user!.userId, parseInt(limit as string));

    res.json({ success: true, requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExchangeRequestById = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const isAdmin = req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'STAFF_ADMIN';

    const exchangeRequest = await ExchangeRequestService.getById(id);
    if (!exchangeRequest) {
      return res.status(404).json({ success: false, message: "Exchange request not found" });
    }

    if (!isAdmin && exchangeRequest.userId !== req.user!.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    res.json({ success: true, exchangeRequest });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin endpoints
export const getAllExchangeRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const filters: any = { limit: parseInt(limit as string), offset: parseInt(offset as string) };
    if (status) {
      filters.status = status;
    }

    const result = await ExchangeRequestService.getAll(filters);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingExchangeRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await ExchangeRequestService.getAllByStatus('PENDING_PAYMENT');
    res.json({ success: true, requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveExchangeRequest = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { notes } = req.body;

    const exchangeRequest = await ExchangeRequestService.approve(id, notes);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'APPROVE_EXCHANGE_REQUEST',
      resource: 'ExchangeRequest',
      resourceId: id,
      result: 'SUCCESS',
    });

    await NotificationService.send({
      userId: exchangeRequest.userId,
      title: 'Exchange Request Approved',
      message: `Your exchange request for $${exchangeRequest.amount} has been approved. USDT ${exchangeRequest.usdtReceived} will be transferred to your wallet.`,
      type: 'SUCCESS',
      referenceType: 'EXCHANGE',
      referenceId: exchangeRequest.id,
    });

    res.json({ success: true, exchangeRequest });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rejectExchangeRequest = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason, notes } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: "Rejection reason required" });
    }

    const exchangeRequest = await ExchangeRequestService.reject(id, reason, notes);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'REJECT_EXCHANGE_REQUEST',
      resource: 'ExchangeRequest',
      resourceId: id,
      result: 'SUCCESS',
    });

    await NotificationService.send({
      userId: exchangeRequest.userId,
      title: 'Exchange Request Rejected',
      message: `Your exchange request has been rejected. Reason: ${reason}`,
      type: 'ERROR',
      referenceType: 'EXCHANGE',
      referenceId: exchangeRequest.id,
    });

    res.json({ success: true, exchangeRequest });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const cancelExchangeRequest = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reason } = req.body;

    const exchangeRequest = await ExchangeRequestService.cancel(id, reason);

    res.json({ success: true, exchangeRequest });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const uploadProof = async (req: AuthRequest, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'Proof file required' });

    const savedPath = await import('../utils/uploads').then(m => m.saveUploadedFile({
      originalName: file.originalname,
      tempPath: file.path,
      subdirectory: 'proofs',
      prefix: id,
    }));

    const proof = await ExchangeRequestService.getById(id as string);
    if (!proof) return res.status(404).json({ success: false, message: 'Exchange request not found' });

    const created = await prisma.proofUpload.create({
      data: {
        userId: req.user!.userId,
        orderId: id as string,
        fileUrl: savedPath,
        fileType: file.mimetype,
        referenceNo: req.body.referenceNo || null,
        notes: req.body.notes || null,
      }
    });

    await ExchangeRequestService.markProofUploaded(id as string);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: (req.user as any).email || '',
      action: 'UPLOAD_EXCHANGE_PROOF',
      resource: 'ExchangeRequest',
      resourceId: id,
      result: 'SUCCESS',
    });

    await NotificationService.send({
      userId: req.user!.userId,
      title: 'Proof Uploaded',
      message: 'Your payment proof has been uploaded and is pending review.',
      type: 'INFO',
      referenceType: 'EXCHANGE',
      referenceId: id,
    });

    res.json({ success: true, proof: created });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
