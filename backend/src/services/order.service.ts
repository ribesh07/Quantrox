import { prisma } from "../shared/prisma";
import { OrderType, OrderStatus } from "@prisma/client";

const baseUrl = process.env.SERVICE_URL_BACKEND || "https://api.settlerpay.com";

export const OrderService = {
  async create(data: {
    userId: string;
    type: OrderType;
    paymentMethodId: string;
    amount: number;
    gameId?: string;
    gameUsername?: string;
    walletAddress?: string;
    fromWalletId?: string;
    toWalletId?: string;
    fee?: number;
    receiveAmount?: number;
    total?: number;
    rate?: number;
    receiveUsername?: string;
    receiveWalletLabel?: string;
    receiveWalletNumber?: string;
    receiveEmail?: string;
    receivePhone?: string;
    transactionReference?: string;
  }) {
    const {
      userId,
      type,
      paymentMethodId,
      amount,
      gameId,
      gameUsername,
      walletAddress,
      fromWalletId,
      toWalletId,
      fee: incomingFee,
      receiveAmount: incomingReceiveAmount,
      total: incomingTotal,
      rate: incomingRate,
      receiveUsername,
      receiveWalletLabel,
      receiveWalletNumber,
      receiveEmail,
      receivePhone,
      transactionReference,
    } = data;

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId }
    });

    if (!paymentMethod) {
      throw new Error("Invalid payment method");
    }

    let fee = incomingFee ?? 0;
    let total = incomingTotal ?? amount;
    let receivedAmount = incomingReceiveAmount ?? 0;
    let orderRate = incomingRate ?? paymentMethod.rate;

    if (type === OrderType.DEPOSIT) {
      fee = incomingFee ?? (amount * paymentMethod.feePercentage) / 100;
      total = incomingTotal ?? amount + fee;
      receivedAmount = incomingReceiveAmount ?? amount * paymentMethod.rate;
    } else if (type === OrderType.EXCHANGE) {
      fee = (amount * paymentMethod.rate * paymentMethod.feePercentage) / 100;
      receivedAmount = (amount * paymentMethod.rate) - fee;
      total = amount;
    } else if (type === OrderType.GAME_TOPUP) {
      // No fees for game top-up
      fee = 0;
      total = amount;
      receivedAmount = 0;
    }

    const order = await prisma.order.create({
      data: {
        userId,
        type,
        paymentMethodId,
        amount,
        fee,
        total,
        rate: orderRate,
        receivedAmount,
        gameId: gameId || null,
        gameUsername: gameUsername?.trim() || null,
        walletAddress: walletAddress || null,
        fromWalletId: fromWalletId || null,
        toWalletId: toWalletId || null,
        receiveUsername: receiveUsername?.trim() || null,
        receiveWalletLabel: receiveWalletLabel?.trim() || null,
        receiveWalletNumber: receiveWalletNumber?.trim() || null,
        receiveEmail: receiveEmail?.trim() || null,
        receivePhone: receivePhone?.trim() || null,
        transactionReference: transactionReference?.trim() || null,
        status:
          type === OrderType.DEPOSIT || type === OrderType.GAME_TOPUP
            ? OrderStatus.PENDING_PAYMENT
            : OrderStatus.PENDING_REVIEW,
      },
    });

    if (type === OrderType.EXCHANGE) {
      try {
        await prisma.wallet.update({
          where: {
            userId_paymentMethodId: {
              userId,
              paymentMethodId
            }
          },
          data: {
            balance: { decrement: amount }
          }
        });
      } catch (error) {
        console.error('Exchange wallet update failed:', error);
      }
    }

    return order;
  },

  async getUserOrders(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { 
        game: true,
        paymentMethod: true
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map(order => ({
      ...order,
      proofImage: order.screenshot ? `${baseUrl}${order.screenshot}` : null,
      receiveQrCode: order.receiveQrCode ? `${baseUrl}${order.receiveQrCode}` : null,
    }));
  },

  async getAll() {
    const orders = await prisma.order.findMany({
      include: { 
        user: { select: { username: true, email: true } }, 
        game: true,
        paymentMethod: true 
      },
      orderBy: { createdAt: "desc" },
    });

    return orders.map(order => ({
      ...order,
      proofImage: order.screenshot ? `${baseUrl}${order.screenshot}` : null,
      receiveQrCode: order.receiveQrCode ? `${baseUrl}${order.receiveQrCode}` : null,
    }));
  },

  async getUserStats(userId: string) {
    return prisma.order.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    });
  },

  async getRecentOrders(limit: number = 6) {
    return prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { 
        user: { select: { username: true } }, 
        game: true,
        paymentMethod: true 
      },
    });
  },

  async getOrderById(id: string, userId?: string, isAdmin: boolean = false) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { 
        game: true, 
        paymentMethod: true,
        user: { select: { username: true, email: true } },
        proofUploads: true,
      },
    });

    if (!order) return null;

    if (!isAdmin && order.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return {
      ...order,
      proofImage: order.screenshot
    ? `${baseUrl}${order.screenshot}`
    : null,
      receiveQrCode: order.receiveQrCode ? `${baseUrl}${order.receiveQrCode}` : null,
      proofUploads: order.proofUploads?.map(p => ({
        ...p,
        fileUrl: p.fileUrl ? `${baseUrl}${p.fileUrl}` : null,
      })) || [],
    };
  },

  async updateStatus(id: string, status: OrderStatus, adminId: string, adminNote?: string) {
    const oldOrder = await prisma.order.findUnique({
      where: { id },
      include: { paymentMethod: true }
    });

    if (!oldOrder) {
      throw new Error("Order not found");
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote || undefined,
      },
    });

    if (status === OrderStatus.COMPLETED || status === OrderStatus.APPROVED) {
      if (oldOrder.type === OrderType.DEPOSIT) {
        await prisma.wallet.upsert({
          where: {
            userId_paymentMethodId: {
              userId: order.userId,
              paymentMethodId: order.paymentMethodId
            }
          },
          update: {
            balance: { increment: order.receivedAmount }
          },
          create: {
            userId: order.userId,
            paymentMethodId: order.paymentMethodId,
            balance: order.receivedAmount
          }
        });
      }

      await prisma.transaction.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          amount: order.receivedAmount,
          type: order.type,
          status: "SUCCESS",
        },
      });

      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: `${order.type} Approved`,
          message: `Your ${order.type.toLowerCase()} request #${order.id.slice(-6)} has been approved.`,
        },
      });
    } else if (status === OrderStatus.REJECTED) {
      if (oldOrder.type === OrderType.EXCHANGE) {
        await prisma.wallet.update({
          where: {
            userId_paymentMethodId: {
              userId: order.userId,
              paymentMethodId: order.paymentMethodId
            }
          },
          data: {
            balance: { increment: order.amount }
          }
        });
      }

      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: `${order.type} Rejected`,
          message: `Your ${order.type.toLowerCase()} request #${order.id.slice(-6)} was rejected. Reason: ${adminNote || "No reason provided."}`,
        },
      });
    }

    await prisma.adminLog.create({
      data: {
        adminId,
        action: `REVIEW_ORDER_${status}`,
        details: `Reviewed order #${id} as ${status}`,
      },
    });

    return order;
  },

  async getByStatus(status: OrderStatus, limit = 50, offset = 0) {
    const [orders, count] = await Promise.all([
      prisma.order.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: { select: { username: true, email: true } },
          game: true,
          paymentMethod: true,
        },
      }),
      prisma.order.count({ where: { status } }),
    ]);

    return { orders, count };
  },

  async getPendingReviewOrders(limit = 50) {
    return prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_REVIEW,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        user: { select: { username: true, email: true } },
        game: true,
        paymentMethod: true,
      },
    });
  },

  async getOrdersByDateRange(fromDate: Date, toDate: Date, limit = 100) {
    return prisma.order.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { username: true, email: true } },
        game: true,
        paymentMethod: true,
      },
    });
  },

  async getTotalAmountByStatus(status: OrderStatus) {
    const result = await prisma.order.aggregate({
      where: { status },
      _sum: {
        amount: true,
        fee: true,
        receivedAmount: true,
      },
    });

    return result._sum;
  },

  async getOrdersByType(type: OrderType, limit = 50) {
    return prisma.order.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { username: true, email: true } },
        game: true,
        paymentMethod: true,
      },
    });
  },

  async bulkUpdateStatus(orderIds: string[], newStatus: OrderStatus, adminId: string) {
    const orders = await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status: newStatus },
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: 'BULK_UPDATE_ORDERS',
        details: `Updated ${orderIds.length} orders to ${newStatus}`,
      },
    });

    return orders;
  }
};

