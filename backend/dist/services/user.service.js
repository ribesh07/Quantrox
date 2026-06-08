"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const shared_1 = require("@quantrox/shared");
exports.UserService = {
    async getAll() {
        return shared_1.prisma.user.findMany({
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
        return shared_1.prisma.user.findUnique({
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
        const user = await shared_1.prisma.user.update({
            where: { id },
            data: { role }
        });
        await shared_1.prisma.adminLog.create({
            data: {
                adminId,
                action: "UPDATE_USER_ROLE",
                details: `Updated user ${user.username} role to ${role}`,
            }
        });
        return user;
    },
    async delete(id, adminId) {
        const user = await shared_1.prisma.user.delete({
            where: { id }
        });
        await shared_1.prisma.adminLog.create({
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
            shared_1.prisma.user.count(),
            shared_1.prisma.order.count({ where: { type: "DEPOSIT" } }),
            shared_1.prisma.order.count({ where: { type: "EXCHANGE" } }),
            shared_1.prisma.order.aggregate({
                where: { status: "COMPLETED" },
                _sum: { fee: true },
            }),
            shared_1.prisma.order.count({
                where: {
                    status: { in: ["PENDING_REVIEW", "PENDING_PAYMENT"] }
                }
            }),
            shared_1.prisma.order.count({ where: { status: "COMPLETED" } }),
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
