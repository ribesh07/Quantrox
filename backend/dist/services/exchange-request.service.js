"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeRequestService = void 0;
const shared_1 = require("../shared");
const exchange_rate_service_1 = require("./exchange-rate.service");
const fee_setting_service_1 = require("./fee-setting.service");
exports.ExchangeRequestService = {
    async create(data) {
        const rate = await exchange_rate_service_1.ExchangeRateService.getCurrentRate(data.paymentMethodId);
        const fee = await fee_setting_service_1.FeeSettingService.calculateFee(data.amount, 'EXCHANGE_FEE', data.paymentMethodId);
        const total = data.amount + fee;
        const usdtReceived = data.amount * rate;
        return shared_1.prisma.exchangeRequest.create({
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
    async getById(id) {
        return shared_1.prisma.exchangeRequest.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });
    },
    async getByUserId(userId, limit = 50) {
        return shared_1.prisma.exchangeRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    },
    async getAllByStatus(status, limit = 50) {
        return shared_1.prisma.exchangeRequest.findMany({
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
            shared_1.prisma.exchangeRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: filters?.limit || 50,
                skip: filters?.offset || 0,
                include: {
                    user: true,
                },
            }),
            shared_1.prisma.exchangeRequest.count({ where }),
        ]);
        return { requests, count };
    },
    async updateStatus(id, status) {
        return shared_1.prisma.exchangeRequest.update({
            where: { id },
            data: { status },
        });
    },
    async markProofUploaded(id) {
        return shared_1.prisma.exchangeRequest.update({
            where: { id },
            data: {
                proofUploadedAt: new Date(),
                status: 'PAYMENT_RECEIVED',
            },
        });
    },
    async approve(id, notes) {
        return shared_1.prisma.exchangeRequest.update({
            where: { id },
            data: {
                status: 'TRANSFERRED',
                approvedAt: new Date(),
                internalNotes: notes,
            },
        });
    },
    async reject(id, reason, notes) {
        return shared_1.prisma.exchangeRequest.update({
            where: { id },
            data: {
                status: 'REJECTED',
                rejectedAt: new Date(),
                rejectionReason: reason,
                internalNotes: notes,
            },
        });
    },
    async cancel(id, reason) {
        return shared_1.prisma.exchangeRequest.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                rejectionReason: reason,
            },
        });
    },
};
