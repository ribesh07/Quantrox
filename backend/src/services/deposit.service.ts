import { prisma } from "../shared/prisma";
import { DepositType, DepositStatus } from "@prisma/client";

export const DepositService = {
  async create(data: {
    userId: string;
    amount: number;
    type: DepositType;
    requiredDeposit?: number;
    notes?: string;
    paymentMethodId?: string;
    paymentMethodName?: string;
    instant?: boolean;
    proofImage?: string;
  }) {
    const isInstant = data.instant !== false;
    return prisma.deposit.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        type: data.type,
        status: isInstant ? 'APPROVED' : 'PENDING',
        requiredDeposit: data.requiredDeposit ?? data.amount,
        paymentMethodId: data.paymentMethodId,
        paymentMethodName: data.paymentMethodName,
        notes: data.notes || (data.paymentMethodName ? `Payment method: ${data.paymentMethodName}` : undefined),
        proofImage: data.proofImage,
      },
    });
  },

  async uploadProof(id: string, userId: string, proofImage: string) {
    const existingDeposit = await prisma.deposit.findFirst({ where: { id, userId } });
    if (!existingDeposit) {
      throw new Error('Deposit not found');
    }

    return prisma.deposit.update({
      where: { id },
      data: {
        proofImage,
        status: 'PENDING',
      },
    });
  },

  async getById(id: string) {
    return prisma.deposit.findUnique({
      where: { id },
      include: { user: true },
    });
  },

  async getByUserId(userId: string, filters?: {
    status?: DepositStatus;
    type?: DepositType;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
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

    const [deposits, count] = await Promise.all([
      prisma.deposit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.deposit.count({ where }),
    ]);

    return { deposits, count };
  },

  async getAll(filters?: {
    status?: DepositStatus;
    userId?: string;
    type?: DepositType;
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

    if (filters?.type) {
      where.type = filters.type;
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

    const [deposits, count] = await Promise.all([
      prisma.deposit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: { user: true },
      }),
      prisma.deposit.count({ where }),
    ]);

    return { deposits, count };
  },

  async approve(id: string, adminId: string) {
    return prisma.deposit.update({
      where: { id },
      data: {
        status: 'APPROVED',
        adjustedAt: new Date(),
        adjustedBy: adminId,
      },
    });
  },

  async reject(id: string, adminId: string) {
    return prisma.deposit.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adjustedAt: new Date(),
        adjustedBy: adminId,
      },
    });
  },

  async freeze(id: string, adminId: string) {
    return prisma.deposit.update({
      where: { id },
      data: {
        status: 'FROZEN',
        frozenAt: new Date(),
        frozenBy: adminId,
      },
    });
  },

  async release(id: string, adminId: string) {
    return prisma.deposit.update({
      where: { id },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
        releasedBy: adminId,
      },
    });
  },

  async adjust(id: string, amount: number, adminId: string, notes?: string) {
    return prisma.deposit.update({
      where: { id },
      data: {
        amount,
        notes,
        adjustedAt: new Date(),
        adjustedBy: adminId,
      },
    });
  },

  async getUserTotalDeposit(userId: string) {
    const deposits = await prisma.deposit.findMany({
      where: {
        userId,
        status: { in: ['APPROVED', 'RELEASED'] },
      },
    });

    return deposits.reduce((sum, d) => sum + d.amount, 0);
  },
};
