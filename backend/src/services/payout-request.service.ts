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
    paymentMethodId?: string | null;
    uid: string;
    qrCodeImage: string;
    remarks?: string;
    walletAddress?: string;
    walletNetwork?: string;
  }) {
    const payout = await prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.create({
        data: {
          userId: data.userId,
          amount: data.amount,
          paymentMethodId: data.paymentMethodId ?? null,
          uid: data.uid,
          qrCodeImage: data.qrCodeImage,
          remarks: data.remarks,
          walletAddress: data.walletAddress,
          walletNetwork: data.walletNetwork,
          status: "PENDING",
        },
        include: { paymentMethod: true },
      });

      if (data.paymentMethodId && data.amount > 0) {
        const wallet = await tx.wallet.upsert({
          where: {
            userId_paymentMethodId: {
              userId: data.userId,
              paymentMethodId: data.paymentMethodId,
            },
          },
          update: {
            lastActivityAt: new Date(),
          },
          create: {
            userId: data.userId,
            paymentMethodId: data.paymentMethodId,
            balance: 0,
            pendingBalance: 0,
            frozenBalance: 0,
            status: "ACTIVE",
          },
        });

        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            frozenBalance: { increment: data.amount },
            lastActivityAt: new Date(),
          },
        });
        // log freeze as a transfer-style transaction
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'TRANSFER',
            amount: data.amount,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance,
            notes: `Payout freeze #${payout.id}`,
          },
        });
      }

      return payout;
    });

    return withImageUrls(payout);
  },

  async getById(id: string) {
    return prisma.payoutRequest.findUnique({
      where: { id },
      include: { user: true },
    });
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
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.payoutRequest.count({ where }),
    ]);

    return { payouts, count };
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
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: { user: true },
      }),
      prisma.payoutRequest.count({ where }),
    ]);

    return { payouts, count };
  },

  async submitForReview(id: string) {
    return prisma.payoutRequest.update({
      where: { id },
      data: { status: 'UNDER_REVIEW' },
    });
  },

  async approve(id: string, adminId: string) {
    const existingPayout = await prisma.payoutRequest.findUnique({ where: { id } });

    if (!existingPayout) {
      throw new Error('Payout request not found');
    }

    return prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: adminId,
        },
      });

      if (
        existingPayout.status !== 'APPROVED' &&
        existingPayout.status !== 'PAID' &&
        existingPayout.paymentMethodId &&
        existingPayout.amount > 0
      ) {
        const wallet = await tx.wallet.findUnique({
          where: {
            userId_paymentMethodId: {
              userId: existingPayout.userId,
              paymentMethodId: existingPayout.paymentMethodId,
            },
          },
        });

        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: Math.max(0, wallet.balance - existingPayout.amount),
              frozenBalance: Math.max(0, wallet.frozenBalance - existingPayout.amount),
              lastActivityAt: new Date(),
            },
          });
        }
        // create a wallet transaction record for the deduction
        if (wallet) {
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'WITHDRAWAL',
              amount: existingPayout.amount,
              balanceBefore: wallet.balance,
              balanceAfter: Math.max(0, wallet.balance - existingPayout.amount),
              notes: `Payout approved #${existingPayout.id}`,
            },
          });
        }
      }

      return payout;
    });
  },

  async reject(id: string, adminId: string, rejectionReason: string) {
    const existingPayout = await prisma.payoutRequest.findUnique({ where: { id } });

    if (!existingPayout) {
      throw new Error('Payout request not found');
    }

    return prisma.$transaction(async (tx) => {
      const payout = await tx.payoutRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectedBy: adminId,
          rejectionReason,
        },
      });

      if (
        existingPayout.status !== 'REJECTED' &&
        existingPayout.paymentMethodId &&
        existingPayout.amount > 0
      ) {
        const wallet = await tx.wallet.findUnique({
          where: {
            userId_paymentMethodId: {
              userId: existingPayout.userId,
              paymentMethodId: existingPayout.paymentMethodId,
            },
          },
        });

        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              frozenBalance: Math.max(0, wallet.frozenBalance - existingPayout.amount),
              lastActivityAt: new Date(),
            },
          });
        }
        // create an unfreeze wallet transaction record
        if (wallet) {
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'REFUND',
              amount: existingPayout.amount,
              balanceBefore: wallet.balance,
              balanceAfter: wallet.balance,
              notes: `Payout rejected #${existingPayout.id} - funds released`,
            },
          });
        }
      }

      return payout;
    });
  },

  async markPaid(id: string, adminId: string, transactionHash: string) {
    const payout = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paidBy: adminId,
        transactionHash,
      },
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
