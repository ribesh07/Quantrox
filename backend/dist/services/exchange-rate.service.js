"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeRateService = void 0;
const prisma_1 = require("../shared/prisma");
exports.ExchangeRateService = {
    async getAll() {
        return prisma_1.prisma.exchangeRate.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    },
    async getAllAdmin() {
        return prisma_1.prisma.exchangeRate.findMany({
            orderBy: { createdAt: 'desc' },
        });
    },
    async getById(id) {
        return prisma_1.prisma.exchangeRate.findUnique({
            where: { id },
        });
    },
    async getByPaymentMethodId(paymentMethodId) {
        return prisma_1.prisma.exchangeRate.findFirst({
            where: {
                paymentMethodId,
                isActive: true,
                effectiveFrom: { lte: new Date() },
                OR: [
                    { effectiveTo: null },
                    { effectiveTo: { gte: new Date() } },
                ],
            },
            orderBy: { effectiveFrom: 'desc' },
        });
    },
    async create(data) {
        return prisma_1.prisma.exchangeRate.create({
            data: {
                paymentMethodId: data.paymentMethodId,
                baseCurrency: data.baseCurrency || 'USD',
                targetCurrency: data.targetCurrency || 'USDT',
                rate: parseFloat(data.rate),
                effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : new Date(),
                effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
                isActive: data.isActive !== false,
            },
        });
    },
    async update(id, data) {
        return prisma_1.prisma.exchangeRate.update({
            where: { id },
            data: {
                ...(data.rate !== undefined && { rate: parseFloat(data.rate) }),
                ...(data.baseCurrency !== undefined && { baseCurrency: data.baseCurrency }),
                ...(data.targetCurrency !== undefined && { targetCurrency: data.targetCurrency }),
                ...(data.effectiveFrom !== undefined && { effectiveFrom: new Date(data.effectiveFrom) }),
                ...(data.effectiveTo !== undefined && { effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });
    },
    async deactivate(id) {
        return prisma_1.prisma.exchangeRate.update({
            where: { id },
            data: { isActive: false },
        });
    },
    async delete(id) {
        return prisma_1.prisma.exchangeRate.delete({
            where: { id },
        });
    },
    async getCurrentRate(paymentMethodId) {
        const rate = await this.getByPaymentMethodId(paymentMethodId);
        return rate?.rate || 1;
    },
};
