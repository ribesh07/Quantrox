import { prisma } from "../shared/prisma";

export const MerchantInfoService = {
  async create(data: {
    userId: string;
    businessName: string;
    businessDescription?: string;
    preferredWalletId: string;
    expectedDailyVolume: number;
  }) {
    return prisma.merchantInfo.create({
      data: {
        userId: data.userId,
        businessName: data.businessName,
        businessDescription: data.businessDescription,
        preferredWalletId: data.preferredWalletId,
        expectedDailyVolume: data.expectedDailyVolume,
      },
    });
  },

  async getByUserId(userId: string) {
    return prisma.merchantInfo.findUnique({
      where: { userId },
      include: { user: true, preferredWallet: true },
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
    expectedDailyVolume: number;
  }>) {
    return prisma.merchantInfo.update({
      where: { userId },
      data,
    });
  },
};
