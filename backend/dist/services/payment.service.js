"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const shared_1 = require("@quantrox/shared");
exports.PaymentService = {
    async getAllActive(category) {
        const where = { active: true };
        if (category) {
            where.OR = [
                { category: category },
                { category: "BOTH" }
            ];
        }
        return shared_1.prisma.paymentMethod.findMany({
            where,
            orderBy: { name: 'asc' }
        });
    },
    async getAllAdmin() {
        return shared_1.prisma.paymentMethod.findMany({
            orderBy: { name: 'asc' }
        });
    },
    async getById(id) {
        return shared_1.prisma.paymentMethod.findUnique({
            where: { id }
        });
    },
    async create(data, adminId) {
        const paymentMethod = await shared_1.prisma.paymentMethod.create({
            data: {
                ...data,
                feePercentage: parseFloat(data.feePercentage),
                rate: parseFloat(data.rate),
                minAmount: parseFloat(data.minAmount || 0),
                maxAmount: parseFloat(data.maxAmount || 1000000),
            },
        });
        await shared_1.prisma.adminLog.create({
            data: {
                adminId,
                action: "CREATE_PAYMENT_METHOD",
                details: `Created payment method: ${paymentMethod.name}`,
            },
        });
        return paymentMethod;
    },
    async update(id, data, adminId) {
        const paymentMethod = await shared_1.prisma.paymentMethod.update({
            where: { id },
            data: {
                ...data,
                ...(data.feePercentage !== undefined && { feePercentage: parseFloat(data.feePercentage) }),
                ...(data.rate !== undefined && { rate: parseFloat(data.rate) }),
                ...(data.minAmount !== undefined && { minAmount: parseFloat(data.minAmount) }),
                ...(data.maxAmount !== undefined && { maxAmount: parseFloat(data.maxAmount) }),
            },
        });
        await shared_1.prisma.adminLog.create({
            data: {
                adminId,
                action: "UPDATE_PAYMENT_METHOD",
                details: `Updated payment method: ${paymentMethod.name}`,
            },
        });
        return paymentMethod;
    },
    async delete(id, adminId) {
        const paymentMethod = await shared_1.prisma.paymentMethod.delete({
            where: { id },
        });
        await shared_1.prisma.adminLog.create({
            data: {
                adminId,
                action: "DELETE_PAYMENT_METHOD",
                details: `Deleted payment method: ${paymentMethod.name}`,
            },
        });
        return paymentMethod;
    }
};
