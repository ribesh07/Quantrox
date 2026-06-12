"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorService = void 0;
const prisma_1 = require("../shared/prisma");
const speakeasy = __importStar(require("speakeasy"));
const QRCode = __importStar(require("qrcode"));
exports.TwoFactorService = {
    async generateSecret(userId) {
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
    async generateQRCode(otpauthUrl) {
        try {
            const qrCode = await QRCode.toDataURL(otpauthUrl);
            return qrCode;
        }
        catch (error) {
            throw new Error('Failed to generate QR code');
        }
    },
    async verifyToken(secret, token) {
        try {
            const verified = speakeasy.totp.verify({
                secret,
                encoding: 'base32',
                token,
                window: 2,
            });
            return verified;
        }
        catch (error) {
            return false;
        }
    },
    async enable(userId, secret, token) {
        // Verify the token first
        const verified = this.verifyToken(secret, token);
        if (!verified) {
            throw new Error('Invalid authentication code');
        }
        // Generate backup codes
        const backupCodes = this.generateBackupCodes(8);
        // Save to database
        const user = await prisma_1.prisma.user.update({
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
    async disable(userId) {
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                twoFactorBackupCodes: null,
            },
        });
        return { success: true };
    },
    async verifyLogin(userId, token) {
        const user = await prisma_1.prisma.user.findUnique({
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
                await prisma_1.prisma.user.update({
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
    generateBackupCodes(count = 8) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            codes.push(this.generateBackupCode());
        }
        return codes;
    },
    generateBackupCode() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    },
    async regenerateBackupCodes(userId) {
        const backupCodes = this.generateBackupCodes(8);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorBackupCodes: JSON.stringify(backupCodes),
            },
        });
        return backupCodes;
    },
    async getBackupCodes(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorBackupCodes: true },
        });
        if (!user || !user.twoFactorBackupCodes) {
            return [];
        }
        return JSON.parse(user.twoFactorBackupCodes);
    },
    async getStatus(userId) {
        const user = await prisma_1.prisma.user.findUnique({
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
