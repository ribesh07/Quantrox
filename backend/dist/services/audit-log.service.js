"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const prisma_1 = require("../shared/prisma");
exports.AuditLogService = {
    async log(data) {
        return prisma_1.prisma.auditLog.create({
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
    async getAll(filters) {
        const where = {};
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
            prisma_1.prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: filters?.limit || 50,
                skip: filters?.offset || 0,
            }),
            prisma_1.prisma.auditLog.count({ where }),
        ]);
        return { logs, count };
    },
    async getByUser(userId, limit = 50) {
        return prisma_1.prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    },
    async getByResource(resourceId, limit = 50) {
        return prisma_1.prisma.auditLog.findMany({
            where: { resourceId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    },
    async getByAction(action, limit = 50) {
        return prisma_1.prisma.auditLog.findMany({
            where: { action },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    },
};
