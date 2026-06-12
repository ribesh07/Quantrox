import { prisma } from "../shared";

export const PaymentAccountService = {
  async getAll() {
    return prisma.paymentAccount.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  async getActive() {
    return prisma.paymentAccount.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: string) {
    return prisma.paymentAccount.findUnique({
      where: { id },
    });
  },

  async getByPaymentMethodId(paymentMethodId: string) {
    return prisma.paymentAccount.findUnique({
      where: { paymentMethodId },
    });
  },

  async create(data: any) {
    return prisma.paymentAccount.create({
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

  async update(id: string, data: any) {
    return prisma.paymentAccount.update({
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

  async delete(id: string) {
    return prisma.paymentAccount.delete({
      where: { id },
    });
  },

  async deactivate(id: string) {
    return prisma.paymentAccount.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async activate(id: string) {
    return prisma.paymentAccount.update({
      where: { id },
      data: { isActive: true },
    });
  },
};
