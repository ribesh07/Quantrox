"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const shared_1 = require("../shared");
exports.NotificationService = {
    async send(data) {
        const created = await shared_1.prisma.notification.create({
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
            const io = global.io;
            if (io) {
                io.to(`user_${data.userId}`).emit('notification', created);
            }
        }
        catch (err) {
            console.warn('Failed to emit notification via WS', err);
        }
        return created;
    },
    async getUnread(userId, limit = 20) {
        return shared_1.prisma.notification.findMany({
            where: {
                userId,
                read: false,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    },
    async getAll(userId, limit = 50, offset = 0) {
        const [notifications, count] = await Promise.all([
            shared_1.prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            shared_1.prisma.notification.count({ where: { userId } }),
        ]);
        return { notifications, count };
    },
    async markAsRead(notificationId) {
        return shared_1.prisma.notification.update({
            where: { id: notificationId },
            data: {
                read: true,
                readAt: new Date(),
            },
        });
    },
    async markAllAsRead(userId) {
        return shared_1.prisma.notification.updateMany({
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
    async getById(id) {
        return shared_1.prisma.notification.findUnique({
            where: { id },
        });
    },
    async delete(notificationId) {
        return shared_1.prisma.notification.delete({
            where: { id: notificationId },
        });
    },
    async deleteAllForUser(userId) {
        return shared_1.prisma.notification.deleteMany({
            where: { userId },
        });
    },
    async getUnreadCount(userId) {
        return shared_1.prisma.notification.count({
            where: {
                userId,
                read: false,
            },
        });
    },
    async sendBulk(notifications) {
        return shared_1.prisma.notification.createMany({
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
