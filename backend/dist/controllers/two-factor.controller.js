"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regenerateBackupCodes = exports.getBackupCodes = exports.get2FAStatus = exports.verify2FALogin = exports.disable2FA = exports.enable2FA = exports.getSetupQRCode = void 0;
const two_factor_service_1 = require("../services/two-factor.service");
const audit_log_service_1 = require("../services/audit-log.service");
const getSetupQRCode = async (req, res) => {
    try {
        const { secret, qrCode: otpauthUrl } = await two_factor_service_1.TwoFactorService.generateSecret(req.user.userId);
        const qrCodeImage = await two_factor_service_1.TwoFactorService.generateQRCode(otpauthUrl);
        res.json({
            success: true,
            secret,
            qrCode: qrCodeImage,
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.getSetupQRCode = getSetupQRCode;
const enable2FA = async (req, res) => {
    try {
        const { secret, token } = req.body;
        if (!secret || !token) {
            return res.status(400).json({ success: false, message: "Secret and token required" });
        }
        const result = await two_factor_service_1.TwoFactorService.enable(req.user.userId, secret, token);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'ENABLE_2FA',
            resource: 'User',
            resourceId: req.user.userId,
            result: 'SUCCESS',
        });
        res.json({
            success: true,
            message: '2FA enabled successfully',
            backupCodes: result.backupCodes,
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.enable2FA = enable2FA;
const disable2FA = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: "Password required to disable 2FA" });
        }
        // In a real app, you would verify the password here
        // For now, we'll just check it's provided
        await two_factor_service_1.TwoFactorService.disable(req.user.userId);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'DISABLE_2FA',
            resource: 'User',
            resourceId: req.user.userId,
            result: 'SUCCESS',
        });
        res.json({ success: true, message: '2FA disabled successfully' });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.disable2FA = disable2FA;
const verify2FALogin = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: "Authentication code required" });
        }
        const result = await two_factor_service_1.TwoFactorService.verifyLogin(req.user.userId, token);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'VERIFY_2FA_LOGIN',
            resource: 'User',
            resourceId: req.user.userId,
            result: 'SUCCESS',
        });
        res.json({
            success: true,
            message: '2FA verification successful',
            isBackupCode: result.isBackupCode,
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.verify2FALogin = verify2FALogin;
const get2FAStatus = async (req, res) => {
    try {
        const status = await two_factor_service_1.TwoFactorService.getStatus(req.user.userId);
        res.json({ success: true, ...status });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.get2FAStatus = get2FAStatus;
const getBackupCodes = async (req, res) => {
    try {
        const backupCodes = await two_factor_service_1.TwoFactorService.getBackupCodes(req.user.userId);
        res.json({ success: true, backupCodes });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getBackupCodes = getBackupCodes;
const regenerateBackupCodes = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ success: false, message: "Password required" });
        }
        const backupCodes = await two_factor_service_1.TwoFactorService.regenerateBackupCodes(req.user.userId);
        await audit_log_service_1.AuditLogService.log({
            userId: req.user.userId,
            userEmail: req.user.email,
            action: 'REGENERATE_BACKUP_CODES',
            resource: 'User',
            resourceId: req.user.userId,
            result: 'SUCCESS',
        });
        res.json({ success: true, backupCodes });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.regenerateBackupCodes = regenerateBackupCodes;
