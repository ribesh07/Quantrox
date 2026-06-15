import { AuthRequest } from "../middleware/auth.middleware";
import { Response } from "express";
import { PayoutRequestService } from "../services/payout-request.service";
import { PaymentService } from "../services/payment.service";
import { AuditLogService } from "../services/audit-log.service";
import multer from "multer";
import { getUploadDirectory, saveUploadedFile } from "../utils/uploads";
import { paramString, queryDate, queryInt, queryString } from "../utils/request";
import { PayoutType } from "@prisma/client";

const upload = multer({ dest: getUploadDirectory() });

export const createMerchantPayoutRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, walletAddress, walletNetwork, remarks } = req.body;

    if (!walletAddress?.trim()) {
      return res.status(400).json({ success: false, message: "Wallet address is required" });
    }

    if (!walletNetwork?.trim()) {
      return res.status(400).json({ success: false, message: "Wallet network is required" });
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    let qrCodeImage: string | undefined;
    if (req.file) {
      qrCodeImage = await saveUploadedFile(req.file, "payout-qrs");
    }

    const payout = await PayoutRequestService.createMerchant({
      userId: req.user!.userId,
      amount: parsedAmount,
      walletAddress: walletAddress.trim(),
      walletNetwork: walletNetwork.trim(),
      qrCodeImage,
      remarks: remarks?.trim() || undefined,
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: "CREATE_MERCHANT_PAYOUT",
      resource: "PAYOUT_REQUEST",
      resourceId: payout.id,
      result: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, payout });
  } catch (error) {
    console.error("Create merchant payout error:", error);
    res.status(500).json({ success: false, message: "Failed to create merchant payout request" });
  }
};

export const createUserPayoutRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, paymentMethodId, uid, remarks } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({ success: false, message: "Payment method is required" });
    }

    if (!uid?.trim()) {
      return res.status(400).json({ success: false, message: "UID / account ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Receiving QR code image is required" });
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    const paymentMethod = await PaymentService.getById(paymentMethodId);
    if (!paymentMethod || !paymentMethod.active) {
      return res.status(400).json({ success: false, message: "Invalid or inactive payment method" });
    }

    if (parsedAmount < paymentMethod.minAmount || parsedAmount > paymentMethod.maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Amount must be between ${paymentMethod.minAmount} and ${paymentMethod.maxAmount}`,
      });
    }

    const qrCodeImage = await saveUploadedFile(req.file, "payout-qrs");

    const payout = await PayoutRequestService.createUser({
      userId: req.user!.userId,
      amount: parsedAmount,
      paymentMethodId,
      uid: uid.trim(),
      qrCodeImage,
      remarks: remarks?.trim() || undefined,
    });

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: "CREATE_USER_PAYOUT",
      resource: "PAYOUT_REQUEST",
      resourceId: payout.id,
      result: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, payout });
  } catch (error) {
    console.error("Create user payout error:", error);
    res.status(500).json({ success: false, message: "Failed to create payout request" });
  }
};

export const getMyMerchantPayoutRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, fromDate, toDate, limit, offset } = req.query;
    const result = await PayoutRequestService.getByUserId(req.user!.userId, {
      type: "MERCHANT",
      status: status as any,
      fromDate: queryDate(fromDate),
      toDate: queryDate(toDate),
      limit: queryInt(limit),
      offset: queryInt(offset),
    });
    res.json({ success: true, payouts: result.payouts, count: result.count });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get merchant payout requests" });
  }
};

export const getMyUserPayoutRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status, fromDate, toDate, limit, offset } = req.query;
    const result = await PayoutRequestService.getByUserId(req.user!.userId, {
      type: "USER",
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
    const { status, type, userId, fromDate, toDate, limit, offset } = req.query;
    const payoutType = queryString(type) as PayoutType | undefined;
    const result = await PayoutRequestService.getAll({
      type: payoutType && (payoutType === "MERCHANT" || payoutType === "USER") ? payoutType : undefined,
      status: status as any,
      userId: queryString(userId),
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

export const getPayoutStatusCounts = async (req: AuthRequest, res: Response) => {
  try {
    const payoutType = queryString(req.query.type) as PayoutType | undefined;
    const counts = await PayoutRequestService.getStatusCounts(
      payoutType && (payoutType === "MERCHANT" || payoutType === "USER") ? payoutType : undefined
    );
    res.json({ success: true, counts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get payout counts" });
  }
};

export const submitPayoutForReview = async (req: AuthRequest, res: Response) => {
  try {
    const id = paramString(req.params.id);
    const payout = await PayoutRequestService.submitForReview(id);
    res.json({ success: true, payout });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to submit payout for review" });
  }
};

export const approvePayoutRequest = async (req: AuthRequest, res: Response) => {
  try {
    const id = paramString(req.params.id);
    const payout = await PayoutRequestService.approve(id, req.user!.userId);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: "APPROVE_PAYOUT",
      resource: "PAYOUT_REQUEST",
      resourceId: id,
      result: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, payout });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to approve payout" });
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
      action: "REJECT_PAYOUT",
      resource: "PAYOUT_REQUEST",
      resourceId: id,
      result: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, payout });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reject payout" });
  }
};

export const markPayoutPaid = async (req: AuthRequest, res: Response) => {
  try {
    const id = paramString(req.params.id);
    const { transactionHash } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Payment proof image is required" });
    }

    const paymentProofImage = await saveUploadedFile(req.file, "payout-proofs");

    const payout = await PayoutRequestService.markPaid(
      id,
      req.user!.userId,
      transactionHash?.trim() || "N/A",
      paymentProofImage
    );

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: "MARK_PAYOUT_PAID",
      resource: "PAYOUT_REQUEST",
      resourceId: id,
      result: "SUCCESS",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json({ success: true, payout });
  } catch (error) {
    console.error("Mark payout paid error:", error);
    res.status(500).json({ success: false, message: "Failed to mark payout as paid" });
  }
};

export { upload };
