"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeSettingService = void 0;
const prisma_1 = require("../shared/prisma");
exports.FeeSettingService = {
    async getAll() {
        return prisma_1.prisma.feeSetting.findMany({
            orderBy: [{ feeType: 'asc' }, { createdAt: 'desc' }],
        });
    },
    async getActive() {
        return prisma_1.prisma.feeSetting.findMany({
            where: { isActive: true },
            orderBy: [{ feeType: 'asc' }, { createdAt: 'desc' }],
        });
    },
    async getById(id) {
        return prisma_1.prisma.feeSetting.findUnique({
            where: { id },
        });
    },
    async getByType(feeType, paymentMethodId) {
        const where = { feeType, isActive: true };
        if (paymentMethodId) {
            where.OR = [
                { paymentMethodId },
                { paymentMethodId: null },
            ];
        }
        else {
            where.paymentMethodId = null;
        }
        return prisma_1.prisma.feeSetting.findFirst({
            where,
            orderBy: { createdAt: 'desc' },
        });
    },
    async calculateFee(amount, feeType, paymentMethodId) {
        const feeSetting = await this.getByType(feeType, paymentMethodId);
        if (!feeSetting)
            return 0;
        const percentage = (amount * feeSetting.percentage) / 100;
        let totalFee = percentage + feeSetting.fixedAmount;
        if (feeSetting.minAmount && totalFee < feeSetting.minAmount) {
            totalFee = feeSetting.minAmount;
        }
        if (feeSetting.maxAmount && totalFee > feeSetting.maxAmount) {
            totalFee = feeSetting.maxAmount;
        }
        return totalFee;
    },
    async create(data) {
        return prisma_1.prisma.feeSetting.create({
            data: {
                feeType: data.feeType,
                paymentMethodId: data.paymentMethodId || null,
                percentage: parseFloat(data.percentage || 0),
                fixedAmount: parseFloat(data.fixedAmount || 0),
                minAmount: parseFloat(data.minAmount || 0),
                maxAmount: parseFloat(data.maxAmount || 999999),
                description: data.description,
                isActive: data.isActive !== false,
            },
        });
    },
    async update(id, data) {
        return prisma_1.prisma.feeSetting.update({
            where: { id },
            data: {
                ...(data.percentage !== undefined && { percentage: parseFloat(data.percentage) }),
                ...(data.fixedAmount !== undefined && { fixedAmount: parseFloat(data.fixedAmount) }),
                ...(data.minAmount !== undefined && { minAmount: parseFloat(data.minAmount) }),
                ...(data.maxAmount !== undefined && { maxAmount: parseFloat(data.maxAmount) }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });
    },
    async delete(id) {
        return prisma_1.prisma.feeSetting.delete({
            where: { id },
        });
    },
};
