import { prisma } from "../shared/prisma";
import { PaymentMethodCategory } from "@prisma/client";

export const PaymentService = {
  async getAllActive(category?: PaymentMethodCategory) {
    const where: any = { active: true };
    if (category) {
      where.OR = [
        { category: category },
        { category: "BOTH" }
      ];
    }
    return prisma.paymentMethod.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  },

  async getAllAdmin() {
    return prisma.paymentMethod.findMany({
      orderBy: { name: 'asc' }
    });
  },

  async getById(id: string) {
    return prisma.paymentMethod.findUnique({
      where: { id }
    });
  },

  async create(data: any, adminId: string) {
    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        ...data,
        feePercentage: parseFloat(data.feePercentage),
        rate: parseFloat(data.rate),
        minAmount: parseFloat(data.minAmount || 0),
        maxAmount: parseFloat(data.maxAmount || 1000000),
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: "CREATE_PAYMENT_METHOD",
        details: `Created payment method: ${paymentMethod.name}`,
      },
    });

    return paymentMethod;
  },

  async update(id: string, data: any, adminId: string) {
    const paymentMethod = await prisma.paymentMethod.update({
      where: { id },
      data: {
        ...data,
        ...(data.feePercentage !== undefined && { feePercentage: parseFloat(data.feePercentage) }),
        ...(data.rate !== undefined && { rate: parseFloat(data.rate) }),
        ...(data.minAmount !== undefined && { minAmount: parseFloat(data.minAmount) }),
        ...(data.maxAmount !== undefined && { maxAmount: parseFloat(data.maxAmount) }),
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: "UPDATE_PAYMENT_METHOD",
        details: `Updated payment method: ${paymentMethod.name}`,
      },
    });

    return paymentMethod;
  },

  async delete(id: string, adminId: string) {
    const paymentMethod = await prisma.paymentMethod.delete({
      where: { id },
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: "DELETE_PAYMENT_METHOD",
        details: `Deleted payment method: ${paymentMethod.name}`,
      },
    });

    return paymentMethod;
  }
};

