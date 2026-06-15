import { prisma } from "../shared/prisma";
import { WalletService } from "./wallet.service";

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

  async create(data: {
    userId: string;
    businessName: string;
    businessDescription?: string;
    preferredWalletId?: string;
    preferredPaymentMethodId?: string;
    expectedDailyVolume: number;
    approvedAt?: Date | null;
    approvedBy?: string | null;
  }) {
    const preferredWalletId = await this.resolvePreferredWalletId(
      data.userId,
      data.preferredWalletId,
      data.preferredPaymentMethodId
    );

    return prisma.merchantInfo.create({
      data: {
        userId: data.userId,
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        preferredWalletId,
        expectedDailyVolume: data.expectedDailyVolume,
        approvedAt: data.approvedAt ?? null,
        approvedBy: data.approvedBy ?? null,
      },
      include: { user: true, preferredWallet: { include: { paymentMethod: true } } },
    });
  },

  async getByUserId(userId: string) {
    return prisma.merchantInfo.findUnique({
      where: { userId },
      include: { user: true, preferredWallet: { include: { paymentMethod: true } } },
    });
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
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: { user: true, preferredWallet: true },
      }),
      prisma.merchantInfo.count({ where }),
    ]);

    return { merchants, count };
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
  }>) {
    const updateData: Partial<{
      businessName: string;
      businessDescription: string;
      preferredWalletId: string;
      expectedDailyVolume: number;
    }> = {};

    if (data.businessName !== undefined) updateData.businessName = data.businessName;
    if (data.businessDescription !== undefined) updateData.businessDescription = data.businessDescription;
    if (data.expectedDailyVolume !== undefined) updateData.expectedDailyVolume = data.expectedDailyVolume;

    if (data.preferredPaymentMethodId || data.preferredWalletId) {
      updateData.preferredWalletId = await this.resolvePreferredWalletId(
        userId,
        data.preferredWalletId,
        data.preferredPaymentMethodId
      );
    }

    return prisma.merchantInfo.update({
      where: { userId },
      data: updateData,
      include: { user: true, preferredWallet: { include: { paymentMethod: true } } },
    });
  },

  async createForUser(data: {
    userId: string;
    businessName: string;
    businessDescription?: string;
    preferredPaymentMethodId: string;
    expectedDailyVolume: number;
    autoApprove?: boolean;
    adminId?: string;
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
    });
  },
};
