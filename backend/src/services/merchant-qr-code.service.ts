import { prisma } from "../shared/prisma";

export const MerchantQRCodeService = {
  async assign(data: {
    userId: string;
    imageUrl: string;
    assignedBy: string;
  }) {
    const existing = await prisma.merchantQRCode.findUnique({
      where: { userId: data.userId },
    });

    if (existing) {
      const history = existing.history ? JSON.parse(existing.history) : [];
      history.push({
        imageUrl: existing.imageUrl,
        changedAt: existing.updatedAt,
      });

      return prisma.merchantQRCode.update({
        where: { userId: data.userId },
        data: {
          imageUrl: data.imageUrl,
          assignedBy: data.assignedBy,
          assignedAt: new Date(),
          active: true,
          history: JSON.stringify(history),
        },
      });
    }

    return prisma.merchantQRCode.create({
      data: {
        userId: data.userId,
        imageUrl: data.imageUrl,
        assignedBy: data.assignedBy,
      },
    });
  },

  async getByUserId(userId: string) {
    return prisma.merchantQRCode.findUnique({
      where: { userId },
      include: { user: true },
    });
  },

  async getAll(filters?: {
    active?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    const [qrs, count] = await Promise.all([
      prisma.merchantQRCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: { user: true },
      }),
      prisma.merchantQRCode.count({ where }),
    ]);

    return { qrs, count };
  },

  async disable(userId: string) {
    return prisma.merchantQRCode.update({
      where: { userId },
      data: {
        active: false,
        disabledAt: new Date(),
      },
    });
  },

  async enable(userId: string) {
    return prisma.merchantQRCode.update({
      where: { userId },
      data: {
        active: true,
        disabledAt: null,
      },
    });
  },
};
