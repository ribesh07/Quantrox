"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const prisma_1 = require("../shared/prisma");
exports.GameService = {
    async getAll(activeOnly = false) {
        return prisma_1.prisma.game.findMany({
            where: activeOnly ? { active: true } : {},
            orderBy: { name: 'asc' },
        });
    },
    async getById(id) {
        return prisma_1.prisma.game.findUnique({
            where: { id },
        });
    },
    async create(data, adminId) {
        const game = await prisma_1.prisma.game.create({
            data: {
                ...data,
                buyRate: parseFloat(data.buyRate || 0),
                sellRate: parseFloat(data.sellRate || 0),
            },
        });
        await prisma_1.prisma.adminLog.create({
            data: {
                adminId,
                action: "CREATE_GAME",
                details: `Created game: ${game.name}`,
            },
        });
        return game;
    },
    async update(id, data, adminId) {
        const game = await prisma_1.prisma.game.update({
            where: { id },
            data: {
                ...data,
                ...(data.buyRate !== undefined && { buyRate: parseFloat(data.buyRate) }),
                ...(data.sellRate !== undefined && { sellRate: parseFloat(data.sellRate) }),
            },
        });
        await prisma_1.prisma.adminLog.create({
            data: {
                adminId,
                action: "UPDATE_GAME",
                details: `Updated game: ${game.name}`,
            },
        });
        return game;
    },
    async delete(id, adminId) {
        const game = await prisma_1.prisma.game.delete({
            where: { id },
        });
        await prisma_1.prisma.adminLog.create({
            data: {
                adminId,
                action: "DELETE_GAME",
                details: `Deleted game: ${game.name}`,
            },
        });
        return game;
    }
};
