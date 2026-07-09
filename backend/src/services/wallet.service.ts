import { prisma } from "../shared/prisma";
import { TransactionType, WalletStatus } from "@prisma/client";

export const WalletService = {
  async getApprovedDepositTotals(userId: string) {
    const deposits = await prisma.deposit.groupBy({
      by: ['userId', 'paymentMethodId'],
      where: {
        userId,
        status: { in: ['APPROVED', 'RELEASED'] },
        paymentMethodId: { not: null },
      },
      _sum: { amount: true },
    });

    return new Map(
      deposits
        .filter((deposit) => deposit.paymentMethodId)
        .map((deposit) => [
          `${deposit.userId}:${deposit.paymentMethodId}`,
          deposit._sum.amount ?? 0,
        ])
    );
  },

  async getUserWallets(userId: string) {
    const [wallets, depositTotals] = await Promise.all([
      prisma.wallet.findMany({
        where: { userId },
        include: {
          paymentMethod: true,
        },
      }),
      this.getApprovedDepositTotals(userId),
    ]);

    const walletLookup = new Map(wallets.map((wallet) => [`${wallet.userId}:${wallet.paymentMethodId}`, wallet]));

    for (const [depositKey, depositTotal] of depositTotals.entries()) {
      if (depositTotal <= 0 || walletLookup.has(depositKey)) {
        continue;
      }

      const [, paymentMethodId] = depositKey.split(':');
      if (!paymentMethodId) {
        continue;
      }

      const wallet = await this.getOrCreateWallet(userId, paymentMethodId);
      wallets.push(wallet);
      walletLookup.set(depositKey, wallet);
    }

    return wallets.map((wallet) => {
      const depositTotal = depositTotals.get(`${wallet.userId}:${wallet.paymentMethodId}`) ?? 0;
      return {
        ...wallet,
        balance: Math.max(wallet.balance, depositTotal),
      };
    });
  },

  async getEffectiveBalance(userId: string, paymentMethodId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId_paymentMethodId: {
          userId,
          paymentMethodId
        }
      }
    });

    const depositTotal = await prisma.deposit.aggregate({
      where: {
        userId,
        paymentMethodId,
        status: { in: ['APPROVED', 'RELEASED'] },
      },
      _sum: { amount: true },
    });

    const approvedDepositBalance = depositTotal._sum.amount ?? 0;

    if (!wallet) {
      return approvedDepositBalance;
    }

    return Math.max(wallet.balance, approvedDepositBalance);
  },

  async getBalanceByMethod(userId: string, paymentMethodId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId_paymentMethodId: {
          userId,
          paymentMethodId
        }
      }
    });

    if (!wallet) {
      return null;
    }

    const effectiveBalance = await this.getEffectiveBalance(userId, paymentMethodId);

    return {
      ...wallet,
      balance: effectiveBalance,
    };
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
