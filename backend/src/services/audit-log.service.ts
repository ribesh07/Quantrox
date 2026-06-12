import { prisma } from "../shared/prisma";

export const AuditLogService = {
  async log(data: {
    userId: string;
    userEmail?: string;
    action: string;
    resource: string;
    resourceId?: string;
    changes?: any;
    ipAddress?: string;
    userAgent?: string;
    result: 'SUCCESS' | 'FAILED';
    failureReason?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        userEmail: data.userEmail || '',
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        changes: data.changes ? JSON.stringify(data.changes) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        result: data.result,
        failureReason: data.failureReason,
      },
    });
  },

  async getAll(filters?: {
    userId?: string;
    resource?: string;
    action?: string;
    result?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.resource) {
      where.resource = filters.resource;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.result) {
      where.result = filters.result;
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

    const [logs, count] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, count };
  },

  async getByUser(userId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getByResource(resourceId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: { resourceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getByAction(action: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};

