"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentAccountService = void 0;
const shared_1 = require("../shared");
exports.PaymentAccountService = {
    async getAll() {
        return shared_1.prisma.paymentAccount.findMany({
            orderBy: { createdAt: 'desc' },
        });
    },
    async getActive() {
        return shared_1.prisma.paymentAccount.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    },
    async getById(id) {
        return shared_1.prisma.paymentAccount.findUnique({
            where: { id },
        });
    },
    async getByPaymentMethodId(paymentMethodId) {
        return shared_1.prisma.paymentAccount.findUnique({
            where: { paymentMethodId },
        });
    },
    async create(data) {
        return shared_1.prisma.paymentAccount.create({
            data: {
                paymentMethodId: data.paymentMethodId,
                accountName: data.accountName,
                accountNumber: data.accountNumber,
                walletAddress: data.walletAddress,
                email: data.email,
                instructions: data.instructions,
                qrCodeUrl: data.qrCodeUrl,
                isActive: data.isActive !== false,
            },
        });
    },
    async update(id, data) {
        return shared_1.prisma.paymentAccount.update({
            where: { id },
            data: {
                ...(data.accountName !== undefined && { accountName: data.accountName }),
                ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber }),
                ...(data.walletAddress !== undefined && { walletAddress: data.walletAddress }),
                ...(data.email !== undefined && { email: data.email }),
                ...(data.instructions !== undefined && { instructions: data.instructions }),
                ...(data.qrCodeUrl !== undefined && { qrCodeUrl: data.qrCodeUrl }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });
    },
    async delete(id) {
        return shared_1.prisma.paymentAccount.delete({
            where: { id },
        });
    },
    async deactivate(id) {
        return shared_1.prisma.paymentAccount.update({
            where: { id },
            data: { isActive: false },
        });
    },
    async activate(id) {
        return shared_1.prisma.paymentAccount.update({
            where: { id },
            data: { isActive: true },
        });
    },
};
