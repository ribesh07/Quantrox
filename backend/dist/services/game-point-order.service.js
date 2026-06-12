"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamePointOrderService = void 0;
const shared_1 = require("../shared");
const fee_setting_service_1 = require("./fee-setting.service");
exports.GamePointOrderService = {
    async create(data) {
        const totalPrice = data.points * data.pricePerPoint;
        const fee = await fee_setting_service_1.FeeSettingService.calculateFee(totalPrice, 'EXCHANGE_FEE', data.paymentMethodId);
        const finalPrice = totalPrice + fee;
        return shared_1.prisma.gamePointOrder.create({
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
    async getById(id) {
        return shared_1.prisma.gamePointOrder.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });
    },
    async getByUserId(userId, limit = 50) {
        return shared_1.prisma.gamePointOrder.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    },
    async getByStatus(status, limit = 50) {
        return shared_1.prisma.gamePointOrder.findMany({
            where: { status },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: true,
            },
        });
    },
    async getAll(filters) {
        const where = {};
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
            shared_1.prisma.gamePointOrder.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: filters?.limit || 50,
                skip: filters?.offset || 0,
                include: {
                    user: true,
                },
            }),
            shared_1.prisma.gamePointOrder.count({ where }),
        ]);
        return { orders, count };
    },
    async updateStatus(id, status) {
        return shared_1.prisma.gamePointOrder.update({
            where: { id },
            data: { status },
        });
    },
    async markPaymentReceived(id) {
        return shared_1.prisma.gamePointOrder.update({
            where: { id },
            data: {
                proofUploadedAt: new Date(),
                status: 'PAYMENT_RECEIVED',
            },
        });
    },
    async markFulfilled(id, notes) {
        return shared_1.prisma.gamePointOrder.update({
            where: { id },
            data: {
                status: 'FULFILLED',
                fulfilledAt: new Date(),
                internalNotes: notes,
            },
        });
    },
    async markFailed(id, reason) {
        return shared_1.prisma.gamePointOrder.update({
            where: { id },
            data: {
                status: 'FAILED',
                internalNotes: reason,
            },
        });
    },
    async cancel(id, reason) {
        return shared_1.prisma.gamePointOrder.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                internalNotes: reason,
            },
        });
    },
};
