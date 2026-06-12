import { prisma } from "../shared";
import { GamePointOrderStatus } from "@prisma/client";
import { FeeSettingService } from "./fee-setting.service";

export const GamePointOrderService = {
  async create(data: {
    userId: string;
    gameId: string;
    points: number;
    pricePerPoint: number;
    paymentMethodId: string;
    gameUsername: string;
  }) {
    const totalPrice = data.points * data.pricePerPoint;
    const fee = await FeeSettingService.calculateFee(totalPrice, 'EXCHANGE_FEE', data.paymentMethodId);
    const finalPrice = totalPrice + fee;

    return prisma.gamePointOrder.create({
      data: {
        userId: data.userId,
        gameId: data.gameId,
        points: data.points,
        pricePerPoint: data.pricePerPoint,
        totalPrice,
        fee,
        finalPrice,
        paymentMethodId: data.paymentMethodId,
        gameUsername: data.gameUsername,
        status: 'PENDING',
      },
    });
  },

  async getById(id: string) {
    return prisma.gamePointOrder.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  },

  async getByUserId(userId: string, limit = 50) {
    return prisma.gamePointOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getByStatus(status: GamePointOrderStatus, limit = 50) {
    return prisma.gamePointOrder.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: true,
      },
    });
  },

  async getAll(filters?: {
    status?: GamePointOrderStatus;
    userId?: string;
    gameId?: string;
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

    if (filters?.gameId) {
      where.gameId = filters.gameId;
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

    const [orders, count] = await Promise.all([
      prisma.gamePointOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: {
          user: true,
        },
      }),
      prisma.gamePointOrder.count({ where }),
    ]);

    return { orders, count };
  },

  async updateStatus(id: string, status: GamePointOrderStatus) {
    return prisma.gamePointOrder.update({
      where: { id },
      data: { status },
    });
  },

  async markPaymentReceived(id: string) {
    return prisma.gamePointOrder.update({
      where: { id },
      data: {
        proofUploadedAt: new Date(),
        status: 'PAYMENT_RECEIVED',
      },
    });
  },

  async markFulfilled(id: string, notes?: string) {
    return prisma.gamePointOrder.update({
      where: { id },
      data: {
        status: 'FULFILLED',
        fulfilledAt: new Date(),
        internalNotes: notes,
      },
    });
  },

  async markFailed(id: string, reason?: string) {
    return prisma.gamePointOrder.update({
      where: { id },
      data: {
        status: 'FAILED',
        internalNotes: reason,
      },
    });
  },

  async cancel(id: string, reason?: string) {
    return prisma.gamePointOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        internalNotes: reason,
      },
    });
  },
};
