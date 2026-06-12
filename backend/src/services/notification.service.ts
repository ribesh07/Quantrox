import { prisma } from "../shared";
import { NotificationType } from "@prisma/client";

export const NotificationService = {
  async send(data: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    referenceType?: string;
    referenceId?: string;
  }) {
    const created = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'INFO',
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        sentViaInApp: true,
      },
    });

    // emit via WebSocket if available
    try {
      const io = (global as any).io;
      if (io) {
        io.to(`user_${data.userId}`).emit('notification', created);
      }
    } catch (err) {
      console.warn('Failed to emit notification via WS', err);
    }

    return created;
  },

  async getUnread(userId: string, limit = 20) {
    return prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getAll(userId: string, limit = 50, offset = 0) {
    const [notifications, count] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return { notifications, count };
  },

  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  },

  async getById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
    });
  },

  async delete(notificationId: string) {
    return prisma.notification.delete({
      where: { id: notificationId },
    });
  },

  async deleteAllForUser(userId: string) {
    return prisma.notification.deleteMany({
      where: { userId },
    });
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  },

  async sendBulk(notifications: Array<{
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    referenceType?: string;
    referenceId?: string;
  }>) {
    return prisma.notification.createMany({
      data: notifications.map(n => ({
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type || 'INFO',
        referenceType: n.referenceType,
        referenceId: n.referenceId,
        sentViaInApp: true,
      })),
    });
  },
};
