import { prisma } from "../shared";

export const ExchangeRateService = {
  async getAll() {
    return prisma.exchangeRate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getAllAdmin() {
    return prisma.exchangeRate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  async getById(id: string) {
    return prisma.exchangeRate.findUnique({
      where: { id },
    });
  },

  async getByPaymentMethodId(paymentMethodId: string) {
    return prisma.exchangeRate.findFirst({
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

  async create(data: any) {
    return prisma.exchangeRate.create({
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

  async update(id: string, data: any) {
    return prisma.exchangeRate.update({
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

  async deactivate(id: string) {
    return prisma.exchangeRate.update({
      where: { id },
      data: { isActive: false },
    });
  },

  async delete(id: string) {
    return prisma.exchangeRate.delete({
      where: { id },
    });
  },

  async getCurrentRate(paymentMethodId: string) {
    const rate = await this.getByPaymentMethodId(paymentMethodId);
    return rate?.rate || 1;
  },
};
