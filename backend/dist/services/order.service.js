"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const shared_1 = require("@quantrox/shared");
const client_1 = require("@prisma/client");
exports.OrderService = {
    async create(data) {
        const { userId, type, paymentMethodId, amount, gameId, gameUsername, walletAddress } = data;
        const paymentMethod = await shared_1.prisma.paymentMethod.findUnique({
            where: { id: paymentMethodId }
        });
        if (!paymentMethod) {
            throw new Error("Invalid payment method");
        }
        let fee = 0;
        let total = amount;
        let receivedAmount = 0;
        if (type === client_1.OrderType.DEPOSIT) {
            fee = (amount * paymentMethod.feePercentage) / 100;
            total = amount + fee;
            receivedAmount = amount * paymentMethod.rate;
        }
        else if (type === client_1.OrderType.EXCHANGE) {
            fee = (amount * paymentMethod.rate * paymentMethod.feePercentage) / 100;
            receivedAmount = (amount * paymentMethod.rate) - fee;
            total = amount;
            const wallet = await shared_1.prisma.wallet.findUnique({
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
        const order = await shared_1.prisma.order.create({
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
                status: type === client_1.OrderType.DEPOSIT ? client_1.OrderStatus.PENDING_PAYMENT : client_1.OrderStatus.PENDING_REVIEW,
            },
        });
        if (type === client_1.OrderType.EXCHANGE) {
            await shared_1.prisma.wallet.update({
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
    async getUserOrders(userId) {
        return shared_1.prisma.order.findMany({
            where: { userId },
            include: {
                game: true,
                paymentMethod: true
            },
            orderBy: { createdAt: "desc" },
        });
    },
    async getAll() {
        return shared_1.prisma.order.findMany({
            include: {
                user: { select: { username: true, email: true } },
                game: true,
                paymentMethod: true
            },
            orderBy: { createdAt: "desc" },
        });
    },
    async getUserStats(userId) {
        return shared_1.prisma.order.groupBy({
            by: ["status"],
            where: { userId },
            _count: true,
        });
    },
    async getRecentOrders(limit = 6) {
        return shared_1.prisma.order.findMany({
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { username: true } },
                game: true,
                paymentMethod: true
            },
        });
    },
    async getOrderById(id, userId, isAdmin = false) {
        const order = await shared_1.prisma.order.findUnique({
            where: { id },
            include: {
                game: true,
                paymentMethod: true,
                user: { select: { username: true, email: true } }
            },
        });
        if (!order)
            return null;
        if (!isAdmin && order.userId !== userId) {
            throw new Error("Unauthorized");
        }
        return order;
    },
    async updateStatus(id, status, adminId, adminNote) {
        const oldOrder = await shared_1.prisma.order.findUnique({
            where: { id },
            include: { paymentMethod: true }
        });
        if (!oldOrder) {
            throw new Error("Order not found");
        }
        const order = await shared_1.prisma.order.update({
            where: { id },
            data: {
                status,
                adminNote: adminNote || undefined,
            },
        });
        if (status === client_1.OrderStatus.COMPLETED || status === client_1.OrderStatus.APPROVED) {
            if (oldOrder.type === client_1.OrderType.DEPOSIT) {
                await shared_1.prisma.wallet.upsert({
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
            await shared_1.prisma.transaction.create({
                data: {
                    orderId: order.id,
                    userId: order.userId,
                    amount: order.receivedAmount,
                    type: order.type,
                    status: "SUCCESS",
                },
            });
            await shared_1.prisma.notification.create({
                data: {
                    userId: order.userId,
                    title: `${order.type} Approved`,
                    message: `Your ${order.type.toLowerCase()} request #${order.id.slice(-6)} has been approved.`,
                },
            });
        }
        else if (status === client_1.OrderStatus.REJECTED) {
            if (oldOrder.type === client_1.OrderType.EXCHANGE) {
                await shared_1.prisma.wallet.update({
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
            await shared_1.prisma.notification.create({
                data: {
                    userId: order.userId,
                    title: `${order.type} Rejected`,
                    message: `Your ${order.type.toLowerCase()} request #${order.id.slice(-6)} was rejected. Reason: ${adminNote || "No reason provided."}`,
                },
            });
        }
        await shared_1.prisma.adminLog.create({
            data: {
                adminId,
                action: `REVIEW_ORDER_${status}`,
                details: `Reviewed order #${id} as ${status}`,
            },
        });
        return order;
    }
};
