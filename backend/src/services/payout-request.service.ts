import { prisma } from "../shared/prisma";
import { PayoutStatus } from "@prisma/client";

const baseUrl = process.env.SERVICE_URL_BACKEND || "https://api.settlerpay.com";

const withImageUrls = <T extends { qrCodeImage?: string | null; paymentProofImage?: string | null }>(
  payout: T
): T => ({
  ...payout,
  qrCodeImage: payout.qrCodeImage
    ? payout.qrCodeImage.startsWith("http")
      ? payout.qrCodeImage
      : `${baseUrl}${payout.qrCodeImage}`
    : null,
  paymentProofImage: payout.paymentProofImage
    ? payout.paymentProofImage.startsWith("http")
      ? payout.paymentProofImage
      : `${baseUrl}${payout.paymentProofImage}`
    : null,
});

export const PayoutRequestService = {
  async create(data: {
    userId: string;
    amount: number;
    paymentMethodId: string;
    uid: string;
    qrCodeImage: string;
    remarks?: string;
    walletAddress?: string;
    walletNetwork?: string;
  }) {
    const payout = await prisma.payoutRequest.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        paymentMethodId: data.paymentMethodId,
        uid: data.uid,
        qrCodeImage: data.qrCodeImage,
        remarks: data.remarks,
        walletAddress: data.walletAddress,
        walletNetwork: data.walletNetwork,
        status: "PENDING",
      },
      include: { paymentMethod: true },
    });
    return withImageUrls(payout);
  },

  async getById(id: string) {
    const payout = await prisma.payoutRequest.findUnique({
      where: { id },
      include: { user: true, paymentMethod: true },
    });
    return payout ? withImageUrls(payout) : null;
  },

  async getByUserId(userId: string, filters?: {
    status?: PayoutStatus;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters?.fromDate) {
        where.createdAt.gte = filters.fromDate;
      }
      if (filters?.toDate) {
        where.createdAt.lte = filters.toDate;
      }
    }

    const [payouts, count] = await Promise.all([
      prisma.payoutRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: { paymentMethod: true },
      }),
      prisma.payoutRequest.count({ where }),
    ]);

    return { payouts: payouts.map(withImageUrls), count };
  },

  async getAll(filters?: {
    status?: PayoutStatus;
    userId?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters?.fromDate) {
        where.createdAt.gte = filters.fromDate;
      }
      if (filters?.toDate) {
        where.createdAt.lte = filters.toDate;
      }
    }

    const [payouts, count] = await Promise.all([
      prisma.payoutRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: { user: true, paymentMethod: true },
      }),
      prisma.payoutRequest.count({ where }),
    ]);

    return { payouts: payouts.map(withImageUrls), count };
  },

  async submitForReview(id: string) {
    const payout = await prisma.payoutRequest.update({
      where: { id },
      data: { status: "UNDER_REVIEW" },
      include: { paymentMethod: true },
    });
    return withImageUrls(payout);
  },

  async approve(id: string, adminId: string) {
    const payout = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: adminId,
      },
      include: { paymentMethod: true, user: true },
    });
    return withImageUrls(payout);
  },

  async reject(id: string, adminId: string, rejectionReason: string) {
    const payout = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectedBy: adminId,
        rejectionReason,
      },
      include: { paymentMethod: true, user: true },
    });
    return withImageUrls(payout);
  },

  async markPaid(id: string, adminId: string, transactionHash: string, paymentProofImage?: string) {
    const payout = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paidBy: adminId,
        transactionHash,
        ...(paymentProofImage && { paymentProofImage }),
      },
      include: { paymentMethod: true, user: true },
    });
    return withImageUrls(payout);
  },

  async getStatusCounts() {
    const counts = await prisma.payoutRequest.groupBy({
      by: ["status"],
      _count: { status: true },
    });
    return counts.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<string, number>
    );
  },
};
