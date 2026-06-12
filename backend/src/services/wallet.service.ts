import { prisma } from "../shared";
import { TransactionType, WalletStatus } from "@prisma/client";

export const WalletService = {
  async getUserWallets(userId: string) {
    return prisma.wallet.findMany({
      where: { userId },
      include: {
        paymentMethod: true,
      },
    });
  },

  async getBalanceByMethod(userId: string, paymentMethodId: string) {
    return prisma.wallet.findUnique({
      where: {
        userId_paymentMethodId: {
          userId,
          paymentMethodId
        }
      }
    });
  },

  async getOrCreateWallet(userId: string, paymentMethodId: string) {
    return prisma.wallet.upsert({
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

  async deposit(userId: string, paymentMethodId: string, amount: number, notes?: string) {
    const wallet = await this.getOrCreateWallet(userId, paymentMethodId);

    return prisma.walletTransaction.create({
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

  async withdraw(userId: string, paymentMethodId: string, amount: number, notes?: string) {
    const wallet = await this.getOrCreateWallet(userId, paymentMethodId);

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    return prisma.walletTransaction.create({
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

  async transfer(fromUserId: string, toUserId: string, paymentMethodId: string, amount: number) {
    const fromWallet = await this.getOrCreateWallet(fromUserId, paymentMethodId);
    const toWallet = await this.getOrCreateWallet(toUserId, paymentMethodId);

    if (fromWallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    return prisma.$transaction(async (tx) => {
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

  async applyFee(userId: string, paymentMethodId: string, feeAmount: number, notes?: string) {
    const wallet = await this.getOrCreateWallet(userId, paymentMethodId);

    return prisma.walletTransaction.create({
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

  async freezeBalance(userId: string, paymentMethodId: string, amount: number) {
    const wallet = await this.getOrCreateWallet(userId, paymentMethodId);

    return prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        frozenBalance: wallet.frozenBalance + amount,
        lastActivityAt: new Date(),
      },
    });
  },

  async unfreezeBalance(userId: string, paymentMethodId: string, amount: number) {
    const wallet = await this.getOrCreateWallet(userId, paymentMethodId);

    return prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        frozenBalance: Math.max(0, wallet.frozenBalance - amount),
        lastActivityAt: new Date(),
      },
    });
  },

  async updateStatus(walletId: string, status: WalletStatus) {
    return prisma.wallet.update({
      where: { id: walletId },
      data: { status, lastActivityAt: new Date() },
    });
  },

  async getWalletTransactions(walletId: string, limit = 50, offset = 0) {
    const [transactions, count] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { walletId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.walletTransaction.count({ where: { walletId } }),
    ]);

    return { transactions, count };
  },

  async getTotalBalance(userId: string) {
    const wallets = await prisma.wallet.findMany({
      where: { userId },
    });

    return wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  },
};
