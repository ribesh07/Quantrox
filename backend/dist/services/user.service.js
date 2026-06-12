"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const prisma_1 = require("../shared/prisma");
exports.UserService = {
    async getAll() {
        return prisma_1.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });
    },
    async getById(id) {
        return prisma_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });
    },
    async updateRole(id, role, adminId) {
        const user = await prisma_1.prisma.user.update({
            where: { id },
            data: { role }
        });
        await prisma_1.prisma.adminLog.create({
            data: {
                adminId,
                action: "UPDATE_USER_ROLE",
                details: `Updated user ${user.username} role to ${role}`,
            }
        });
        return user;
    },
    async delete(id, adminId) {
        const user = await prisma_1.prisma.user.delete({
            where: { id }
        });
        await prisma_1.prisma.adminLog.create({
            data: {
                adminId,
                action: "DELETE_USER",
                details: `Deleted user ${user.username}`,
            }
        });
        return user;
    },
    async getDashboardStats() {
        const [totalUsers, totalDeposits, totalExchanges, totalRevenue, pendingRequests, completedRequests] = await Promise.all([
            prisma_1.prisma.user.count(),
            prisma_1.prisma.order.count({ where: { type: "DEPOSIT" } }),
            prisma_1.prisma.order.count({ where: { type: "EXCHANGE" } }),
            prisma_1.prisma.order.aggregate({
                where: { status: "COMPLETED" },
                _sum: { fee: true },
            }),
            prisma_1.prisma.order.count({
                where: {
                    status: { in: ["PENDING_REVIEW", "PENDING_PAYMENT"] }
                }
            }),
            prisma_1.prisma.order.count({ where: { status: "COMPLETED" } }),
        ]);
        return {
            totalUsers,
            totalDeposits,
            totalExchanges,
            totalRevenue: totalRevenue._sum.fee || 0,
            pendingRequests,
            completedRequests,
        };
    }
};
