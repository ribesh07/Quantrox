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
      // prefer the stored wallet balance when present; fallback to approved deposit totals only if wallet is missing
      const baseBalance = wallet.balance ?? depositTotal;
      const availableBalance = Math.max(baseBalance - (wallet.frozenBalance ?? 0), 0);

      return {
        ...wallet,
        // expose both available and raw values to the frontend
        availableBalance,
        balance: availableBalance,
        rawBalance: wallet.balance ?? 0,
        approvedDeposits: depositTotal,
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
      return Math.max(approvedDepositBalance, 0);
    }

    const baseBalance = wallet.balance ?? approvedDepositBalance;
    return Math.max(baseBalance - (wallet.frozenBalance ?? 0), 0);
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
    const wallets = await this.getUserWallets(userId);

    return wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  },

  async freezeCombinedBalance(userId: string, amount: number, note?: string) {
    const wallets = (await this.getUserWallets(userId))
      .filter((wallet) => (wallet.availableBalance ?? 0) > 0)
      .sort((a, b) => (b.availableBalance ?? 0) - (a.availableBalance ?? 0));

    let remaining = amount;
    const actions: any[] = [];

    for (const wallet of wallets) {
      if (remaining <= 0) break;
      const available = wallet.availableBalance ?? wallet.balance ?? 0;
      const freezeAmount = Math.min(available, remaining);
      if (freezeAmount <= 0) continue;

      actions.push(
        prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            frozenBalance: { increment: freezeAmount },
            lastActivityAt: new Date(),
          },
        })
      );
      actions.push(
        prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'TRANSFER',
            amount: freezeAmount,
            balanceBefore: wallet.balance ?? 0,
            balanceAfter: Math.max(0, (wallet.balance ?? 0) - freezeAmount),
            notes: note || `Payout freeze`,
          },
        })
      );

      remaining -= freezeAmount;
    }

    if (remaining > 0) {
      throw new Error('Insufficient available balance');
    }

    await prisma.$transaction(actions);
  },

  async deductCombinedBalance(userId: string, amount: number, note?: string) {
    const wallets = (await this.getUserWallets(userId))
      .filter((wallet) => (wallet.frozenBalance ?? 0) > 0)
      .sort((a, b) => (b.frozenBalance ?? 0) - (a.frozenBalance ?? 0));

    let remaining = amount;
    const actions: any[] = [];

    for (const wallet of wallets) {
      if (remaining <= 0) break;
      const frozen = wallet.frozenBalance ?? 0;
      const deduction = Math.min(frozen, remaining);
      if (deduction <= 0) continue;

      actions.push(
        prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: deduction },
            frozenBalance: { decrement: deduction },
            lastActivityAt: new Date(),
          },
        })
      );
      actions.push(
        prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'WITHDRAWAL',
            amount: deduction,
            balanceBefore: wallet.balance ?? 0,
            balanceAfter: Math.max(0, (wallet.balance ?? 0) - deduction),
            notes: note || `Payout approved`,
          },
        })
      );

      remaining -= deduction;
    }

    if (remaining > 0) {
      throw new Error('Insufficient frozen balance');
    }

    await prisma.$transaction(actions);
  },

  async releaseCombinedBalance(userId: string, amount: number, note?: string) {
    const wallets = (await this.getUserWallets(userId))
      .filter((wallet) => (wallet.frozenBalance ?? 0) > 0)
      .sort((a, b) => (b.frozenBalance ?? 0) - (a.frozenBalance ?? 0));

    let remaining = amount;
    const actions: any[] = [];

    for (const wallet of wallets) {
      if (remaining <= 0) break;
      const frozen = wallet.frozenBalance ?? 0;
      const releaseAmount = Math.min(frozen, remaining);
      if (releaseAmount <= 0) continue;

      actions.push(
        prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            frozenBalance: { decrement: releaseAmount },
            lastActivityAt: new Date(),
          },
        })
      );
      actions.push(
        prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'REFUND',
            amount: releaseAmount,
            balanceBefore: wallet.balance ?? 0,
            balanceAfter: wallet.balance ?? 0,
            notes: note || `Payout release`,
          },
        })
      );

      remaining -= releaseAmount;
    }

    if (remaining > 0) {
      throw new Error('Insufficient frozen balance to release');
    }

    await prisma.$transaction(actions);
  },
};

