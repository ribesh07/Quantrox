import { prisma } from "@quantrox/shared";
import { Role } from "@prisma/client";

export const UserService = {
  async getAll() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });
  },

  async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });
  },

  async updateRole(id: string, role: Role, adminId: string) {
    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: "UPDATE_USER_ROLE",
        details: `Updated user ${user.username} role to ${role}`,
      }
    });

    return user;
  },

  async delete(id: string, adminId: string) {
    const user = await prisma.user.delete({
      where: { id }
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: "DELETE_USER",
        details: `Deleted user ${user.username}`,
      }
    });

    return user;
  },

  async getDashboardStats() {
    const [totalUsers, totalDeposits, totalExchanges, totalRevenue, pendingRequests, completedRequests] = await Promise.all([
      prisma.user.count(),
      prisma.order.count({ where: { type: "DEPOSIT" } }),
      prisma.order.count({ where: { type: "EXCHANGE" } }),
      prisma.order.aggregate({
        where: { status: "COMPLETED" },
        _sum: { fee: true },
      }),
      prisma.order.count({ 
        where: { 
          status: { in: ["PENDING_REVIEW", "PENDING_PAYMENT"] } 
        } 
      }),
      prisma.order.count({ where: { status: "COMPLETED" } }),
    ]);

    return {
      totalUsers,
      totalDeposits,
      totalExchanges,
      totalRevenue: totalRevenue._sum.fee || 0,
      pendingRequests,
      completedRequests,
    };
  }
};
