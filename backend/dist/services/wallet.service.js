"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const shared_1 = require("../shared");
exports.WalletService = {
    async getUserWallets(userId) {
        return shared_1.prisma.wallet.findMany({
            where: { userId },
            include: {
                paymentMethod: true,
            },
        });
    },
    async getBalanceByMethod(userId, paymentMethodId) {
        return shared_1.prisma.wallet.findUnique({
            where: {
                userId_paymentMethodId: {
                    userId,
                    paymentMethodId
                }
            }
        });
    },
    async getOrCreateWallet(userId, paymentMethodId) {
        return shared_1.prisma.wallet.upsert({
            where: {
                userId_paymentMethodId: {
                    userId,
                    paymentMethodId,
                },
            },
            update: {
                lastActivityAt: new Date(),
            },
            create: {
                userId,
                paymentMethodId,
                balance: 0,
                pendingBalance: 0,
                frozenBalance: 0,
                status: 'ACTIVE',
            },
            include: {
                paymentMethod: true,
            },
        });
    },
    async deposit(userId, paymentMethodId, amount, notes) {
        const wallet = await this.getOrCreateWallet(userId, paymentMethodId);
        return shared_1.prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'DEPOSIT',
                amount,
                balanceBefore: wallet.balance,
                balanceAfter: wallet.balance + amount,
                notes,
            },
        });
    },
    async withdraw(userId, paymentMethodId, amount, notes) {
        const wallet = await this.getOrCreateWallet(userId, paymentMethodId);
        if (wallet.balance < amount) {
            throw new Error('Insufficient balance');
        }
        return shared_1.prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'WITHDRAWAL',
                amount,
                balanceBefore: wallet.balance,
                balanceAfter: wallet.balance - amount,
                notes,
            },
        });
    },
    async transfer(fromUserId, toUserId, paymentMethodId, amount) {
        const fromWallet = await this.getOrCreateWallet(fromUserId, paymentMethodId);
        const toWallet = await this.getOrCreateWallet(toUserId, paymentMethodId);
        if (fromWallet.balance < amount) {
            throw new Error('Insufficient balance');
        }
        return shared_1.prisma.$transaction(async (tx) => {
            const fromTx = await tx.walletTransaction.create({
                data: {
                    walletId: fromWallet.id,
                    type: 'TRANSFER',
                    amount: -amount,
                    balanceBefore: fromWallet.balance,
                    balanceAfter: fromWallet.balance - amount,
                    notes: `Transfer to user ${toUserId}`,
                },
            });
            const toTx = await tx.walletTransaction.create({
                data: {
                    walletId: toWallet.id,
                    type: 'TRANSFER',
                    amount,
                    balanceBefore: toWallet.balance,
                    balanceAfter: toWallet.balance + amount,
                    notes: `Transfer from user ${fromUserId}`,
                },
            });
            return { fromTx, toTx };
        });
    },
    async applyFee(userId, paymentMethodId, feeAmount, notes) {
        const wallet = await this.getOrCreateWallet(userId, paymentMethodId);
        return shared_1.prisma.walletTransaction.create({
            data: {
                walletId: wallet.id,
                type: 'FEE',
                amount: feeAmount,
                balanceBefore: wallet.balance,
                balanceAfter: wallet.balance - feeAmount,
                notes: notes || 'Platform fee',
            },
        });
    },
    async freezeBalance(userId, paymentMethodId, amount) {
        const wallet = await this.getOrCreateWallet(userId, paymentMethodId);
        return shared_1.prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                frozenBalance: wallet.frozenBalance + amount,
                lastActivityAt: new Date(),
            },
        });
    },
    async unfreezeBalance(userId, paymentMethodId, amount) {
        const wallet = await this.getOrCreateWallet(userId, paymentMethodId);
        return shared_1.prisma.wallet.update({
            where: { id: wallet.id },
            data: {
                frozenBalance: Math.max(0, wallet.frozenBalance - amount),
                lastActivityAt: new Date(),
            },
        });
    },
    async updateStatus(walletId, status) {
        return shared_1.prisma.wallet.update({
            where: { id: walletId },
            data: { status, lastActivityAt: new Date() },
        });
    },
    async getWalletTransactions(walletId, limit = 50, offset = 0) {
        const [transactions, count] = await Promise.all([
            shared_1.prisma.walletTransaction.findMany({
                where: { walletId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            shared_1.prisma.walletTransaction.count({ where: { walletId } }),
        ]);
        return { transactions, count };
    },
    async getTotalBalance(userId) {
        const wallets = await shared_1.prisma.wallet.findMany({
            where: { userId },
        });
        return wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    },
};
