import { prisma } from "../shared";
import { OrderType, OrderStatus } from "@prisma/client";

export const OrderService = {
  async create(data: {
    userId: string;
    type: OrderType;
    paymentMethodId: string;
    amount: number;
    gameId?: string;
    gameUsername?: string;
    walletAddress?: string;
  }) {
    const { userId, type, paymentMethodId, amount, gameId, gameUsername, walletAddress } = data;

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId }
    });

    if (!paymentMethod) {
      throw new Error("Invalid payment method");
    }

    let fee = 0;
    let total = amount;
    let receivedAmount = 0;

    if (type === OrderType.DEPOSIT) {
      fee = (amount * paymentMethod.feePercentage) / 100;
      total = amount + fee;
      receivedAmount = amount * paymentMethod.rate;
    } else if (type === OrderType.EXCHANGE) {
      fee = (amount * paymentMethod.rate * paymentMethod.feePercentage) / 100;
      receivedAmount = (amount * paymentMethod.rate) - fee;
      total = amount;

      const wallet = await prisma.wallet.findUnique({
        where: {
          userId_paymentMethodId: {
            userId,
            paymentMethodId
          }
        }
      });

      if (!wallet || wallet.balance < amount) {
        throw new Error("Insufficient balance in source wallet");
      }
    }

    const order = await prisma.order.create({
      data: {
        userId,
        type,
        paymentMethodId,
        amount,
        fee,
        total,
        rate: paymentMethod.rate,
        receivedAmount,
        gameId: gameId || null,
        gameUsername: gameUsername || null,
        walletAddress: walletAddress || null,
        status: type === OrderType.DEPOSIT ? OrderStatus.PENDING_PAYMENT : OrderStatus.PENDING_REVIEW,
      },
    });

    if (type === OrderType.EXCHANGE) {
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
    }

    return order;
  },

  async getUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: { 
        game: true,
        paymentMethod: true
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getAll() {
    return prisma.order.findMany({
      include: { 
        user: { select: { username: true, email: true } }, 
        game: true,
        paymentMethod: true 
      },
      orderBy: { createdAt: "desc" },
    });
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
        user: { select: { username: true, email: true } }
      },
    });

    if (!order) return null;

    if (!isAdmin && order.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return order;
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
