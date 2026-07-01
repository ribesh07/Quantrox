import { prisma } from "../shared/prisma";

export const MerchantQRCodeService = {
  async assign(data: {
    userId: string;
    imageUrl: string;
    assignedBy: string;
    label?: string;
  }) {
    return prisma.merchantQRCode.create({
      data: {
        userId: data.userId,
        imageUrl: data.imageUrl,
        assignedBy: data.assignedBy,
        label: data.label,
      },
      include: { user: true },
    });
  },

  async assignMultiple(data: {
    userId: string;
    images: { imageUrl: string; label?: string }[];
    assignedBy: string;
  }) {
    const qrs = await prisma.$transaction(
      data.images.map((img) =>
        prisma.merchantQRCode.create({
          data: {
            userId: data.userId,
            imageUrl: img.imageUrl,
            label: img.label,
            assignedBy: data.assignedBy,
          },
          include: { user: true },
        })
      )
    );
    return qrs;
  },

  async replace(qrId: string, data: {
    imageUrl: string;
    assignedBy: string;
    label?: string;
  }) {
    const existing = await prisma.merchantQRCode.findUnique({ where: { id: qrId } });
    if (!existing) throw new Error("QR code not found");

    const history = existing.history ? JSON.parse(existing.history) : [];
    history.push({
      imageUrl: existing.imageUrl,
      label: existing.label,
      changedAt: existing.updatedAt,
    });

    return prisma.merchantQRCode.update({
      where: { id: qrId },
      data: {
        imageUrl: data.imageUrl,
        label: data.label ?? existing.label,
        assignedBy: data.assignedBy,
        assignedAt: new Date(),
        active: true,
        disabledAt: null,
        history: JSON.stringify(history),
      },
      include: { user: true },
    });
  },

  async getByUserId(userId: string) {
    return prisma.merchantQRCode.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { user: true },
    });
  },

  async getById(qrId: string) {
    return prisma.merchantQRCode.findUnique({
      where: { id: qrId },
      include: { user: true },
    });
  },

  async getAll(filters?: {
    active?: boolean;
    userId?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, unknown> = {};

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
        include: {
          user: {
            include: { merchantInfo: true },
          },
        },
      }),
      prisma.merchantQRCode.count({ where }),
    ]);

    return { qrs, count };
  },

  async getStats() {
    const [total, active, disabled, merchantsWithQR] = await Promise.all([
      prisma.merchantQRCode.count(),
      prisma.merchantQRCode.count({ where: { active: true } }),
      prisma.merchantQRCode.count({ where: { active: false } }),
      prisma.merchantQRCode.groupBy({
        by: ["userId"],
        _count: { id: true },
      }),
    ]);

    return {
      total,
      active,
      disabled,
      merchantsWithQR: merchantsWithQR.length,
    };
  },

  async disable(qrId: string) {
    return prisma.merchantQRCode.update({
      where: { id: qrId },
      data: {
        active: false,
        disabledAt: new Date(),
      },
      include: { user: true },
    });
  },

  async enable(qrId: string) {
    return prisma.merchantQRCode.update({
      where: { id: qrId },
      data: {
        active: true,
        disabledAt: null,
      },
      include: { user: true },
    });
  },
};
