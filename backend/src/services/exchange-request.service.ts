import { prisma } from "../shared";
import { ExchangeStatus } from "@prisma/client";
import { ExchangeRateService } from "./exchange-rate.service";
import { FeeSettingService } from "./fee-setting.service";

export const ExchangeRequestService = {
  async create(data: {
    userId: string;
    amount: number;
    walletAddress: string;
    paymentMethodId: string;
  }) {
    const rate = await ExchangeRateService.getCurrentRate(data.paymentMethodId);
    const fee = await FeeSettingService.calculateFee(data.amount, 'EXCHANGE_FEE', data.paymentMethodId);

    const total = data.amount + fee;
    const usdtReceived = data.amount * rate;

    return prisma.exchangeRequest.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        fee,
        total,
        rate,
        usdtReceived,
        walletAddress: data.walletAddress,
        paymentMethodId: data.paymentMethodId,
        status: 'PENDING_PAYMENT',
      },
    });
  },

  async getById(id: string) {
    return prisma.exchangeRequest.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  },

  async getByUserId(userId: string, limit = 50) {
    return prisma.exchangeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getAllByStatus(status: ExchangeStatus, limit = 50) {
    return prisma.exchangeRequest.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: true,
      },
    });
  },

  async getAll(filters?: {
    status?: ExchangeStatus;
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

    const [requests, count] = await Promise.all([
      prisma.exchangeRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: {
          user: true,
        },
      }),
      prisma.exchangeRequest.count({ where }),
    ]);

    return { requests, count };
  },

  async updateStatus(id: string, status: ExchangeStatus) {
    return prisma.exchangeRequest.update({
      where: { id },
      data: { status },
    });
  },

  async markProofUploaded(id: string) {
    return prisma.exchangeRequest.update({
      where: { id },
      data: {
        proofUploadedAt: new Date(),
        status: 'PAYMENT_RECEIVED',
      },
    });
  },

  async approve(id: string, notes?: string) {
    return prisma.exchangeRequest.update({
      where: { id },
      data: {
        status: 'TRANSFERRED',
        approvedAt: new Date(),
        internalNotes: notes,
      },
    });
  },

  async reject(id: string, reason: string, notes?: string) {
    return prisma.exchangeRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason,
        internalNotes: notes,
      },
    });
  },

  async cancel(id: string, reason?: string) {
    return prisma.exchangeRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        rejectionReason: reason,
      },
    });
  },
};
