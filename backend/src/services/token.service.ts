import { prisma } from "../shared/prisma";
import { v4 as uuidv4 } from 'uuid';

export const TokenService = {
  async createRefreshToken(userId: string, ttlSeconds = 60 * 60 * 24 * 30) {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const rt = await prisma.refreshToken.create({
      data: { userId, token, expiresAt }
    });
    return rt;
  },

  async verifyRefreshToken(token: string) {
    const rt = await prisma.refreshToken.findUnique({ where: { token } });
    if (!rt || rt.revoked || rt.expiresAt < new Date()) return null;
    return rt;
  },

  async revokeRefreshToken(token: string) {
    return prisma.refreshToken.update({ where: { token }, data: { revoked: true } });
  },

  async createVerificationToken(userId: string, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET', ttlSeconds = 60 * 60) {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    return prisma.verificationToken.create({ data: { userId, token, type, expiresAt } });
  },

  async verifyVerificationToken(token: string, type: string) {
    const vt = await prisma.verificationToken.findUnique({ where: { token } });
    if (!vt || vt.used || vt.type !== type || vt.expiresAt < new Date()) return null;
    return vt;
  },

  async markVerificationTokenUsed(id: string) {
    return prisma.verificationToken.update({ where: { id }, data: { used: true } });
  }
};

