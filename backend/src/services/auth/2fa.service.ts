import { prisma } from '../../shared/prisma';
import * as totpUtils from '../../utils/totp';
import * as encryptionUtils from '../../utils/encryption';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export interface BackupCodeHash {
  hash: string;
  used: boolean;
}

export const TwoFAService = {
  // Generate secret for setup
  async generateSetupSecret(userId: string, userEmail: string) {
    const { base32, otpauthUrl } = totpUtils.generateSecret('SettlerPay', userEmail);
    const qrCode = await totpUtils.generateQRCode(otpauthUrl);
    return {
      secret: base32,
      qrCode,
    };
  },

  // Enable 2FA
  async enable2FA(userId: string, secret: string, code: string, currentPassword: string) {
    // Verify current password
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Invalid credentials');

    const passwordValid = await bcrypt.compare(currentPassword, user.password);
    if (!passwordValid) throw new Error('Invalid credentials');

    // Verify TOTP code
    const codeValid = totpUtils.verifyToken(secret, code, 1);
    if (!codeValid) throw new Error('Invalid authentication code');

    // Encrypt secret
    const encryptedSecret = encryptionUtils.encrypt(secret);

    // Generate and hash backup codes
    const plainBackupCodes = totpUtils.generateBackupCodes(10);
    const backupCodeHashes: BackupCodeHash[] = await Promise.all(
      plainBackupCodes.map(async (code) => ({
        hash: await encryptionUtils.hashBackupCode(code),
        used: false,
      }))
    );

    // Save to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: JSON.stringify(backupCodeHashes),
      },
    });

    return {
      backupCodes: plainBackupCodes,
    };
  },

  // Disable 2FA
  async disable2FA(userId: string, currentPassword: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Invalid credentials');

    // Verify password
    const passwordValid = await bcrypt.compare(currentPassword, user.password);
    if (!passwordValid) throw new Error('Invalid credentials');

    // Verify code or backup code
    let codeValid = false;

    if (user.twoFactorSecret) {
      const decryptedSecret = encryptionUtils.decrypt(user.twoFactorSecret);
      codeValid = totpUtils.verifyToken(decryptedSecret, code, 1);
    }

    if (!codeValid && user.twoFactorBackupCodes) {
      const backupCodes: BackupCodeHash[] = JSON.parse(user.twoFactorBackupCodes);
      for (let i = 0; i < backupCodes.length; i++) {
        if (!backupCodes[i].used && await encryptionUtils.verifyBackupCode(code, backupCodes[i].hash)) {
          codeValid = true;
          break;
        }
      }
    }

    if (!codeValid) throw new Error('Invalid authentication code');

    // Disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });
  },

  // Verify 2FA code for login
  async verify2FA(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled) {
      throw new Error('Invalid credentials');
    }

    // Check if it's a backup code
    let isValid = false;
    let isBackupCode = false;

    if (user.twoFactorSecret) {
      const decryptedSecret = encryptionUtils.decrypt(user.twoFactorSecret);
      isValid = totpUtils.verifyToken(decryptedSecret, code, 1);
    }

    if (!isValid && user.twoFactorBackupCodes) {
      const backupCodes: BackupCodeHash[] = JSON.parse(user.twoFactorBackupCodes);
      for (let i = 0; i < backupCodes.length; i++) {
        if (!backupCodes[i].used && await encryptionUtils.verifyBackupCode(code, backupCodes[i].hash)) {
          isValid = true;
          isBackupCode = true;
          // Mark backup code as used
          backupCodes[i].used = true;
          await prisma.user.update({
            where: { id: userId },
            data: { twoFactorBackupCodes: JSON.stringify(backupCodes) },
          });
          break;
        }
      }
    }

    if (!isValid) {
      throw new Error('Invalid authentication code');
    }

    return { isValid, isBackupCode };
  },

  // Generate temporary token for 2FA login
  generateTemporaryToken(userId: string): string {
    return jwt.sign({ userId, type: '2fa-temp' }, env.jwtSecret, { expiresIn: '5m' });
  },

  // Verify temporary token
  verifyTemporaryToken(token: string): string | null {
    try {
      const payload = jwt.verify(token, env.jwtSecret) as any;
      if (payload.type !== '2fa-temp') return null;
      return payload.userId;
    } catch {
      return null;
    }
  },
};
