import { prisma } from "../shared/prisma";
import { DepositService } from "./deposit.service";

export type MerchantWalletInput = {
  walletId: string;
  minLimit?: number;
  maxLimit?: number;
  dailyLimit?: number;
  isPrimary?: boolean;
};

export const MerchantInfoService = {
  async create(data: {
    userId: string;
    businessName: string;
    businessDescription?: string;
    preferredWalletId: string;
    expectedDailyVolume: number;
    merchantWallets?: MerchantWalletInput[];
  }) {
    const primaryWalletId =
      data.merchantWallets?.find((w) => w.isPrimary)?.walletId ||
      data.merchantWallets?.[0]?.walletId ||
      data.preferredWalletId;

    return prisma.merchantInfo.create({
      data: {
        userId: data.userId,
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        preferredWalletId: primaryWalletId,
        expectedDailyVolume: data.expectedDailyVolume,
        merchantWallets: data.merchantWallets?.length
          ? {
              create: data.merchantWallets.map((w) => ({
                walletId: w.walletId,
                minLimit: w.minLimit ?? 0,
                maxLimit: w.maxLimit ?? 1000000,
                dailyLimit: w.dailyLimit,
                isPrimary: w.isPrimary ?? w.walletId === primaryWalletId,
              })),
            }
          : undefined,
      },
      include: {
        user: true,
        preferredWallet: { include: { paymentMethod: true } },
        merchantWallets: { include: { wallet: { include: { paymentMethod: true } } } },
      },
    });
  },

  async getByUserId(userId: string) {
    return prisma.merchantInfo.findUnique({
      where: { userId },
      include: {
        user: true,
        preferredWallet: { include: { paymentMethod: true } },
        merchantWallets: {
          include: { wallet: { include: { paymentMethod: true } } },
          orderBy: { isPrimary: "desc" },
        },
      },
    });
  },

  async getDetails(userId: string) {
    const merchant = await this.getByUserId(userId);
    if (!merchant) return null;

    const [totalDeposit, reportStats, qrCodes, payouts, deposits] = await Promise.all([
      DepositService.getUserTotalDeposit(userId),
      prisma.transactionReport.aggregate({
        where: { userId, status: "APPROVED" },
        _sum: { totalAmount: true, totalTransactions: true },
        _count: true,
      }),
      prisma.merchantQRCode.findMany({
        where: { userId },
        include: { paymentMethod: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payoutRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.deposit.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const wallets = await prisma.wallet.findMany({
      where: { userId },
      include: { paymentMethod: true },
    });

    return {
      ...merchant,
      stats: {
        totalDeposit,
        totalReportAmount: reportStats._sum.totalAmount || 0,
        totalReportTransactions: reportStats._sum.totalTransactions || 0,
        reportCount: reportStats._count,
        qrCount: qrCodes.length,
        activeQrCount: qrCodes.filter((q) => q.active).length,
        walletCount: wallets.length,
        totalWalletBalance: wallets.reduce((sum, w) => sum + w.balance, 0),
      },
      qrCodes,
      recentPayouts: payouts,
      recentDeposits: deposits,
      wallets,
    };
  },

  async getAll(filters?: {
    approved?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.approved !== undefined) {
      where.approvedAt = filters.approved ? { not: null } : null;
    }

    const [merchants, count] = await Promise.all([
      prisma.merchantInfo.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: {
          user: true,
          preferredWallet: { include: { paymentMethod: true } },
          merchantWallets: {
            include: { wallet: { include: { paymentMethod: true } } },
          },
        },
      }),
      prisma.merchantInfo.count({ where }),
    ]);

    const enriched = await Promise.all(
      merchants.map(async (merchant) => {
        const [totalDeposit, qrCount, reportStats] = await Promise.all([
          DepositService.getUserTotalDeposit(merchant.userId),
          prisma.merchantQRCode.count({ where: { userId: merchant.userId } }),
          prisma.transactionReport.aggregate({
            where: { userId: merchant.userId, status: "APPROVED" },
            _sum: { totalAmount: true },
          }),
        ]);
        return {
          ...merchant,
          totalDeposit,
          qrCount,
          totalReportAmount: reportStats._sum.totalAmount || 0,
        };
      })
    );

    return { merchants: enriched, count };
  },

  async approve(userId: string, adminId: string, adminNote?: string) {
    return prisma.merchantInfo.update({
      where: { userId },
      data: {
        approvedAt: new Date(),
        approvedBy: adminId,
        adminNote,
      },
    });
  },

  async reject(userId: string, adminId: string, adminNote?: string) {
    return prisma.merchantInfo.update({
      where: { userId },
      data: {
        approvedAt: null,
        approvedBy: null,
        adminNote,
      },
    });
  },

  async update(
    userId: string,
    data: Partial<{
      businessName: string;
      businessDescription: string;
      preferredWalletId: string;
      expectedDailyVolume: number;
      merchantWallets: MerchantWalletInput[];
    }>
  ) {
    const { merchantWallets, ...rest } = data;

    if (merchantWallets?.length) {
      const primaryWalletId =
        merchantWallets.find((w) => w.isPrimary)?.walletId ||
        merchantWallets[0].walletId;

      const merchant = await prisma.merchantInfo.findUnique({ where: { userId } });
      if (!merchant) throw new Error("Merchant not found");

      await prisma.merchantWallet.deleteMany({ where: { merchantInfoId: merchant.id } });

      return prisma.merchantInfo.update({
        where: { userId },
        data: {
          ...rest,
          preferredWalletId: primaryWalletId,
          merchantWallets: {
            create: merchantWallets.map((w) => ({
              walletId: w.walletId,
              minLimit: w.minLimit ?? 0,
              maxLimit: w.maxLimit ?? 1000000,
              dailyLimit: w.dailyLimit,
              isPrimary: w.isPrimary ?? w.walletId === primaryWalletId,
            })),
          },
        },
        include: {
          user: true,
          preferredWallet: { include: { paymentMethod: true } },
          merchantWallets: {
            include: { wallet: { include: { paymentMethod: true } } },
          },
        },
      });
    }

    return prisma.merchantInfo.update({
      where: { userId },
      data: rest,
      include: {
        user: true,
        preferredWallet: { include: { paymentMethod: true } },
        merchantWallets: {
          include: { wallet: { include: { paymentMethod: true } } },
        },
      },
    });
  },
};
