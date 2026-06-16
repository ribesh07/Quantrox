import { prisma } from "../shared/prisma";

export const MerchantQRCodeService = {
  async assign(data: {
    userId: string;
    imageUrl: string;
    assignedBy: string;
    label?: string;
    paymentMethodId?: string;
    replaceQrId?: string;
  }) {
    if (data.replaceQrId) {
      const existing = await prisma.merchantQRCode.findUnique({
        where: { id: data.replaceQrId },
      });
      if (!existing || existing.userId !== data.userId) {
        throw new Error("QR code not found");
      }

      const history = existing.history ? JSON.parse(existing.history) : [];
      history.push({
        imageUrl: existing.imageUrl,
        changedAt: existing.updatedAt,
      });

      return prisma.merchantQRCode.update({
        where: { id: data.replaceQrId },
        data: {
          imageUrl: data.imageUrl,
          assignedBy: data.assignedBy,
          assignedAt: new Date(),
          active: true,
          disabledAt: null,
          label: data.label ?? existing.label,
          paymentMethodId: data.paymentMethodId ?? existing.paymentMethodId,
          history: JSON.stringify(history),
        },
        include: { user: true, paymentMethod: true },
      });
    }

    return prisma.merchantQRCode.create({
      data: {
        userId: data.userId,
        imageUrl: data.imageUrl,
        assignedBy: data.assignedBy,
        label: data.label,
        paymentMethodId: data.paymentMethodId,
      },
      include: { user: true, paymentMethod: true },
    });
  },

  async bulkAssign(
    userId: string,
    assignedBy: string,
    items: { imageUrl: string; label?: string; paymentMethodId?: string }[]
  ) {
    const results = await prisma.$transaction(
      items.map((item) =>
        prisma.merchantQRCode.create({
          data: {
            userId,
            imageUrl: item.imageUrl,
            assignedBy,
            label: item.label,
            paymentMethodId: item.paymentMethodId,
          },
          include: { user: true, paymentMethod: true },
        })
      )
    );
    return results;
  },

  async getByUserId(userId: string) {
    return prisma.merchantQRCode.findMany({
      where: { userId },
      include: { user: true, paymentMethod: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async getAll(filters?: {
    active?: boolean;
    userId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }
    if (filters?.userId) {
      where.userId = filters.userId;
    }

    const [qrs, count] = await Promise.all([
      prisma.merchantQRCode.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
        include: { user: true, paymentMethod: true },
      }),
      prisma.merchantQRCode.count({ where }),
    ]);

    const stats = {
      total: count,
      active: await prisma.merchantQRCode.count({ where: { ...where, active: true } }),
      inactive: await prisma.merchantQRCode.count({ where: { ...where, active: false } }),
      totalUsage: qrs.reduce((sum, qr) => sum + qr.usageCount, 0),
    };

    return { qrs, count, stats };
  },

  async disable(qrId: string) {
    return prisma.merchantQRCode.update({
      where: { id: qrId },
      data: {
        active: false,
        disabledAt: new Date(),
      },
      include: { user: true, paymentMethod: true },
    });
  },

  async enable(qrId: string) {
    return prisma.merchantQRCode.update({
      where: { id: qrId },
      data: {
        active: true,
        disabledAt: null,
      },
      include: { user: true, paymentMethod: true },
    });
  },

  async recordUsage(qrId: string) {
    return prisma.merchantQRCode.update({
      where: { id: qrId },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  },
};
