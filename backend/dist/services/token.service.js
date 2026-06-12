"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const shared_1 = require("../shared");
const uuid_1 = require("uuid");
exports.TokenService = {
    async createRefreshToken(userId, ttlSeconds = 60 * 60 * 24 * 30) {
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
        const rt = await shared_1.prisma.refreshToken.create({
            data: { userId, token, expiresAt }
        });
        return rt;
    },
    async verifyRefreshToken(token) {
        const rt = await shared_1.prisma.refreshToken.findUnique({ where: { token } });
        if (!rt || rt.revoked || rt.expiresAt < new Date())
            return null;
        return rt;
    },
    async revokeRefreshToken(token) {
        return shared_1.prisma.refreshToken.update({ where: { token }, data: { revoked: true } });
    },
    async createVerificationToken(userId, type, ttlSeconds = 60 * 60) {
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
        return shared_1.prisma.verificationToken.create({ data: { userId, token, type, expiresAt } });
    },
    async verifyVerificationToken(token, type) {
        const vt = await shared_1.prisma.verificationToken.findUnique({ where: { token } });
        if (!vt || vt.used || vt.type !== type || vt.expiresAt < new Date())
            return null;
        return vt;
    },
    async markVerificationTokenUsed(id) {
        return shared_1.prisma.verificationToken.update({ where: { id }, data: { used: true } });
    }
};
