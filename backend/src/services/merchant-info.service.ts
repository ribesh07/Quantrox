import { prisma } from "../shared/prisma";
import { WalletService } from "./wallet.service";
import { DepositService } from "./deposit.service";

export const MerchantInfoService = {
  async resolvePreferredWalletId(userId: string, preferredWalletId?: string, preferredPaymentMethodId?: string) {
    if (preferredPaymentMethodId) {
      const wallet = await WalletService.getOrCreateWallet(userId, preferredPaymentMethodId);
      return wallet.id;
    }

    if (preferredWalletId) {
      return preferredWalletId;
    }

    throw new Error("Preferred payment method is required");
  },

  async syncMerchantWallets(
    merchantInfoId: string,
    userId: string,
    wallets: { paymentMethodId: string; dailyLimit: number; active?: boolean }[]
  ) {
    await prisma.merchantWallet.deleteMany({ where: { merchantInfoId } });

    if (wallets.length === 0) return [];

    const created = await prisma.$transaction(
      wallets.map((w) =>
        prisma.merchantWallet.create({
          data: {
            merchantInfoId,
            paymentMethodId: w.paymentMethodId,
            dailyLimit: w.dailyLimit,
            active: w.active !== false,
          },
          include: { paymentMethod: true },
        })
      )
    );

    // Ensure wallet records exist for each payment method
    for (const w of wallets) {
      await WalletService.getOrCreateWallet(userId, w.paymentMethodId);
    }

    return created;
  },

  async create(data: {
    userId: string;
    businessName: string;
    businessDescription?: string;
    preferredWalletId?: string;
    preferredPaymentMethodId?: string;
    expectedDailyVolume: number;
    approvedAt?: Date | null;
    approvedBy?: string | null;
    wallets?: { paymentMethodId: string; dailyLimit: number; active?: boolean }[];
  }) {
    const preferredPaymentMethodId =
      data.preferredPaymentMethodId || data.wallets?.[0]?.paymentMethodId;

    const preferredWalletId = await this.resolvePreferredWalletId(
      data.userId,
      data.preferredWalletId,
      preferredPaymentMethodId
    );

    const merchantInfo = await prisma.merchantInfo.create({
      data: {
        userId: data.userId,
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        preferredWalletId,
        expectedDailyVolume: data.expectedDailyVolume,
        approvedAt: data.approvedAt ?? null,
        approvedBy: data.approvedBy ?? null,
      },
      include: {
        user: true,
        preferredWallet: { include: { paymentMethod: true } },
        merchantWallets: { include: { paymentMethod: true } },
      },
    });

    if (data.wallets && data.wallets.length > 0) {
      await this.syncMerchantWallets(merchantInfo.id, data.userId, data.wallets);
    } else if (preferredPaymentMethodId) {
      await this.syncMerchantWallets(merchantInfo.id, data.userId, [
        { paymentMethodId: preferredPaymentMethodId, dailyLimit: data.expectedDailyVolume },
      ]);
    }

    return this.getByUserId(data.userId);
  },

  async getByUserId(userId: string) {
    return prisma.merchantInfo.findUnique({
      where: { userId },
      include: {
        user: true,
        preferredWallet: { include: { paymentMethod: true } },
        merchantWallets: { include: { paymentMethod: true }, orderBy: { createdAt: "asc" } },
      },
    });
  },

  async getMerchantStats(userId: string) {
    const [totalDeposit, reportAgg, qrCount, activeQrCount, wallets] = await Promise.all([
      DepositService.getUserTotalDeposit(userId),
      prisma.transactionReport.aggregate({
        where: { userId, status: "APPROVED" },
        _sum: { totalAmount: true, totalTransactions: true },
        _count: { id: true },
      }),
      prisma.merchantQRCode.count({ where: { userId } }),
      prisma.merchantQRCode.count({ where: { userId, active: true } }),
      prisma.wallet.findMany({
        where: { userId },
        include: { paymentMethod: true },
      }),
    ]);

    const totalWalletBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

    return {
      totalDeposit,
      totalReportAmount: reportAgg._sum.totalAmount || 0,
      totalReportTransactions: reportAgg._sum.totalTransactions || 0,
      approvedReportsCount: reportAgg._count.id,
      qrCount,
      activeQrCount,
      totalWalletBalance,
      wallets,
    };
  },

  async getDetail(userId: string) {
    const merchantInfo = await this.getByUserId(userId);
    if (!merchantInfo) return null;

    const [stats, qrs, reports, deposits] = await Promise.all([
      this.getMerchantStats(userId),
      prisma.merchantQRCode.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.transactionReport.findMany({
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

    return { merchantInfo, stats, qrs, reports, deposits };
  },

  async getAll(filters?: {
    approved?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {};

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
          merchantWallets: { include: { paymentMethod: true } },
        },
      }),
      prisma.merchantInfo.count({ where }),
    ]);

    const enriched = await Promise.all(
      merchants.map(async (m) => {
        const stats = await this.getMerchantStats(m.userId);
        const qrCount = stats.qrCount;
        return { ...m, stats, qrCount };
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
        adminNote,
      },
    });
  },

  async update(userId: string, data: Partial<{
    businessName: string;
    businessDescription: string;
    preferredWalletId: string;
    preferredPaymentMethodId: string;
    expectedDailyVolume: number;
    wallets: { paymentMethodId: string; dailyLimit: number; active?: boolean }[];
  }>) {
    const existing = await prisma.merchantInfo.findUnique({ where: { userId } });
    if (!existing) throw new Error("Merchant profile not found");

    const updateData: Partial<{
      businessName: string;
      businessDescription: string;
      preferredWalletId: string;
      expectedDailyVolume: number;
    }> = {};

    if (data.businessName !== undefined) updateData.businessName = data.businessName;
    if (data.businessDescription !== undefined) updateData.businessDescription = data.businessDescription;
    if (data.expectedDailyVolume !== undefined) updateData.expectedDailyVolume = data.expectedDailyVolume;

    if (data.wallets && data.wallets.length > 0) {
      const firstPaymentMethodId = data.wallets[0].paymentMethodId;
      updateData.preferredWalletId = await this.resolvePreferredWalletId(
        userId,
        undefined,
        firstPaymentMethodId
      );
      await this.syncMerchantWallets(existing.id, userId, data.wallets);
    } else if (data.preferredPaymentMethodId || data.preferredWalletId) {
      updateData.preferredWalletId = await this.resolvePreferredWalletId(
        userId,
        data.preferredWalletId,
        data.preferredPaymentMethodId
      );
    }

    await prisma.merchantInfo.update({
      where: { userId },
      data: updateData,
    });

    return this.getByUserId(userId);
  },

  async createForUser(data: {
    userId: string;
    businessName: string;
    businessDescription?: string;
    preferredPaymentMethodId: string;
    expectedDailyVolume: number;
    autoApprove?: boolean;
    adminId?: string;
    wallets?: { paymentMethodId: string; dailyLimit: number; active?: boolean }[];
  }) {
    const existing = await prisma.merchantInfo.findUnique({ where: { userId: data.userId } });
    if (existing) {
      throw new Error("User already has a merchant profile");
    }

    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new Error("User not found");
    }

    return this.create({
      userId: data.userId,
      businessName: data.businessName,
      businessDescription: data.businessDescription,
      preferredPaymentMethodId: data.preferredPaymentMethodId,
      expectedDailyVolume: data.expectedDailyVolume,
      approvedAt: data.autoApprove ? new Date() : null,
      approvedBy: data.autoApprove ? data.adminId ?? null : null,
      wallets: data.wallets,
    });
  },
};
