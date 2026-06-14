import { prisma } from "../shared/prisma";
import { ReportStatus } from "@prisma/client";

export const TransactionReportService = {
  async create(data: {
    userId: string;
    transactionDate: Date;
    totalTransactions: number;
    totalAmount: number;
    proofImage?: string;
    notes?: string;
  }) {
    return prisma.transactionReport.create({
      data: {
        userId: data.userId,
        transactionDate: data.transactionDate,
        totalTransactions: data.totalTransactions,
        totalAmount: data.totalAmount,
        proofImage: data.proofImage,
        notes: data.notes,
        status: 'PENDING_REVIEW',
      },
    });
  },

  async getById(id: string) {
    return prisma.transactionReport.findUnique({
      where: { id },
      include: { user: true },
    });
  },

  async getByUserId(userId: string, filters?: {
    status?: ReportStatus;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { userId };
    
    if (filters?.status) {
      where.status = filters.status;
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

    const [reports, count] = await Promise.all([
      prisma.transactionReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.transactionReport.count({ where }),
    ]);

    return { reports, count };
  },

  async getAll(filters?: {
    status?: ReportStatus;
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

    const [reports, count] = await Promise.all([
      prisma.transactionReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        include: { user: true },
      }),
      prisma.transactionReport.count({ where }),
    ]);

    return { reports, count };
  },

  async approve(id: string, adminId: string) {
    return prisma.transactionReport.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    });
  },

  async reject(id: string, adminId: string, rejectionReason: string) {
    return prisma.transactionReport.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: adminId,
        rejectionReason,
      },
    });
  },
};
