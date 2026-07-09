import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { PayoutRequestService } from "../services/payout-request.service";
import { AuditLogService } from "../services/audit-log.service";
import { PaymentService } from "../services/payment.service";
import multer from "multer";
import { getUploadDirectory, saveUploadedFile } from "../utils/uploads";
import { paramString, queryDate, queryInt, queryString } from "../utils/request";

const upload = multer({ dest: getUploadDirectory(), limits: { fileSize: 50 * 1024 * 1024 } });

export const createPayoutRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, paymentMethodId, uid, remarks, walletAddress, walletNetwork } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    let qrCodeImage: string | undefined;
    if (req.file) {
      qrCodeImage = await saveUploadedFile(req.file, "payout-qrs");
    }

    const payout = await PayoutRequestService.create({
      userId: req.user!.userId,
      amount: parsedAmount,
      paymentMethodId: paymentMethodId?.trim() || null,
      uid: uid?.trim() || undefined,
      qrCodeImage: qrCodeImage || null,
      remarks: remarks?.trim() || undefined,
      walletAddress: walletAddress?.trim() || undefined,
      walletNetwork: walletNetwork?.trim() || undefined,
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: "CREATE_PAYOUT_REQUEST",
      resource: "PAYOUT_REQUEST",
      resourceId: payout.id,
      result: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, payout });
  } catch (error) {
    console.error("Create payout error:", error);
    res.status(500).json({ success: false, message: "Failed to create payout request" });
  }
};

export const getMyPayoutRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, fromDate, toDate, limit, offset } = req.query;
    const result = await PayoutRequestService.getByUserId(req.user!.userId, {
      status: status as any,
      fromDate: queryDate(fromDate),
      toDate: queryDate(toDate),
      limit: queryInt(limit),
      offset: queryInt(offset),
    });
    res.json({ success: true, payouts: result.payouts, count: result.count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get payout requests" });
  }
};

export const getAllPayoutRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, userId, fromDate, toDate, limit, offset } = req.query;
    const result = await PayoutRequestService.getAll({
      status: status as any,
      userId: queryString(userId),
      fromDate: queryDate(fromDate),
      toDate: queryDate(toDate),
      limit: queryInt(limit),
      offset: queryInt(offset),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get payout requests" });
  }
};

export const getPayoutStatusCounts = async (_req: AuthRequest, res: Response) => {
  try {
    const counts = await PayoutRequestService.getStatusCounts();
    res.json({ success: true, counts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get payout counts" });
  }
};

export const submitPayoutForReview = async (req: AuthRequest, res: Response) => {
  try {
    const id = paramString(req.params.id);
    const payout = await PayoutRequestService.submitForReview(id);
    res.json({ success: true, data: payout });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit payout for review' });
  }
};

export const approvePayoutRequest = async (req: AuthRequest, res: Response) => {
  try {
    const id = paramString(req.params.id);
    const payout = await PayoutRequestService.approve(id, req.user!.userId);
    
    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'APPROVE_PAYOUT',
      resource: 'PAYOUT_REQUEST',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, payout });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve payout' });
  }
};

export const rejectPayoutRequest = async (req: AuthRequest, res: Response) => {
  try {
    const id = paramString(req.params.id);
    const { rejectionReason } = req.body;
    const payout = await PayoutRequestService.reject(id, req.user!.userId, rejectionReason);
    
    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'REJECT_PAYOUT',
      resource: 'PAYOUT_REQUEST',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, payout });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject payout' });
  }
};

export const markPayoutPaid = async (req: AuthRequest, res: Response) => {
  try {
    const id = paramString(req.params.id);
    const { transactionHash } = req.body;

    // If a file was uploaded, save it and attach to the payout after marking paid
    let savedProof: string | undefined;
    if (req.file) {
      try {
        // save under generic 'proofs' directory supported by uploader
        savedProof = await saveUploadedFile(req.file, 'proofs');
      } catch (err) {
        console.error('Failed to save payment proof:', err);
      }
    }

    const payout = await PayoutRequestService.markPaid(id, req.user!.userId, transactionHash);

    // Persist payment proof image if provided
    if (savedProof) {
      // update the payout record with the proof path
      try {
        // lazy-import prisma to avoid circular imports
        const { prisma } = await import('../shared/prisma');
        await prisma.payoutRequest.update({
          where: { id },
          data: { paymentProofImage: savedProof },
        });
        // refresh payout object
        const refreshed = await prisma.payoutRequest.findUnique({ where: { id } });
        return res.json({ success: true, payout: refreshed });
      } catch (err) {
        console.error('Failed to attach payment proof to payout:', err);
      }
    }
    
    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'MARK_PAYOUT_PAID',
      resource: 'PAYOUT_REQUEST',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ success: true, payout });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark payout as paid' });
  }
};

export { upload };
