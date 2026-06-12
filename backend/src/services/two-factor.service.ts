import { prisma } from "../shared";
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export const TwoFactorService = {
  async generateSecret(userId: string) {
    const secret = speakeasy.generateSecret({
      name: `Quantrox (${userId})`,
      issuer: 'Quantrox',
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url,
    };
  },

  async generateQRCode(otpauthUrl: string) {
    try {
      const qrCode = await QRCode.toDataURL(otpauthUrl);
      return qrCode;
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  },

  async verifyToken(secret: string, token: string) {
    try {
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2,
      });
      return verified;
    } catch (error) {
      return false;
    }
  },

  async enable(userId: string, secret: string, token: string) {
    // Verify the token first
    const verified = this.verifyToken(secret, token);
    if (!verified) {
      throw new Error('Invalid authentication code');
    }

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(8);

    // Save to database
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      },
    });

    return {
      success: true,
      backupCodes,
    };
  },

  async disable(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    return { success: true };
  },

  async verifyLogin(userId: string, token: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new Error('2FA not enabled');
    }

    // Check if it's a backup code
    if (user.twoFactorBackupCodes) {
      const backupCodes = JSON.parse(user.twoFactorBackupCodes);
      const codeIndex = backupCodes.indexOf(token);
      if (codeIndex !== -1) {
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await prisma.user.update({
          where: { id: userId },
          data: {
            twoFactorBackupCodes: JSON.stringify(backupCodes),
          },
        });
        return { success: true, isBackupCode: true };
      }
    }

    // Check TOTP token
    const verified = this.verifyToken(user.twoFactorSecret, token);
    if (!verified) {
      throw new Error('Invalid authentication code');
    }

    return { success: true, isBackupCode: false };
  },

  generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(this.generateBackupCode());
    }
    return codes;
  },

  generateBackupCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  },

  async regenerateBackupCodes(userId: string) {
    const backupCodes = this.generateBackupCodes(8);

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      },
    });

    return backupCodes;
  },

  async getBackupCodes(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorBackupCodes: true },
    });

    if (!user || !user.twoFactorBackupCodes) {
      return [];
    }

    return JSON.parse(user.twoFactorBackupCodes);
  },

  async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    return {
      enabled: user?.twoFactorEnabled || false,
      hasSecret: !!user?.twoFactorSecret,
    };
  },
};
