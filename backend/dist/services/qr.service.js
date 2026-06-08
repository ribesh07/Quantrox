"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRCodeService = void 0;
const shared_1 = require("@quantrox/shared");
exports.QRCodeService = {
    async getAll() {
        return shared_1.prisma.qRCode.findMany({
            orderBy: { createdAt: 'desc' },
        });
    },
    async getActive() {
        return shared_1.prisma.qRCode.findMany({
            where: { active: true },
            orderBy: { createdAt: 'desc' },
        });
    },
    async create(imageUrl) {
        return shared_1.prisma.qRCode.create({
            data: {
                image: imageUrl,
                active: true,
            },
        });
    },
    async update(id, active) {
        return shared_1.prisma.qRCode.update({
            where: { id },
            data: { active },
        });
    },
    async delete(id) {
        return shared_1.prisma.qRCode.delete({
            where: { id },
        });
    }
};
