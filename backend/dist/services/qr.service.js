"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRCodeService = void 0;
const prisma_1 = require("../shared/prisma");
exports.QRCodeService = {
    async getAll() {
        return prisma_1.prisma.qRCode.findMany({
            orderBy: { createdAt: 'desc' },
        });
    },
    async getActive() {
        return prisma_1.prisma.qRCode.findMany({
            where: { active: true },
            orderBy: { createdAt: 'desc' },
        });
    },
    async create(imageUrl) {
        return prisma_1.prisma.qRCode.create({
            data: {
                image: imageUrl,
                active: true,
            },
        });
    },
    async update(id, active) {
        return prisma_1.prisma.qRCode.update({
            where: { id },
            data: { active },
        });
    },
    async delete(id) {
        return prisma_1.prisma.qRCode.delete({
            where: { id },
        });
    }
};
