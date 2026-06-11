import { prisma } from "../shared";

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
  }
};
