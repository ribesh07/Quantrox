import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { TwoFactorService } from '../services/two-factor.service';
import { AuditLogService } from '../services/audit-log.service';

export const getSetupQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const { secret, qrCode: otpauthUrl } = await TwoFactorService.generateSecret(req.user!.userId);
    const qrCodeImage = await TwoFactorService.generateQRCode(otpauthUrl);

    res.json({
      success: true,
      secret,
      qrCode: qrCodeImage,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const enable2FA = async (req: AuthRequest, res: Response) => {
  try {
    const { secret, token } = req.body;

    if (!secret || !token) {
      return res.status(400).json({ success: false, message: "Secret and token required" });
    }

    const result = await TwoFactorService.enable(req.user!.userId, secret, token);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'ENABLE_2FA',
      resource: 'User',
      resourceId: req.user!.userId,
      result: 'SUCCESS',
    });

    res.json({
      success: true,
      message: '2FA enabled successfully',
      backupCodes: result.backupCodes,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const disable2FA = async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password required to disable 2FA" });
    }

    // In a real app, you would verify the password here
    // For now, we'll just check it's provided

    await TwoFactorService.disable(req.user!.userId);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'DISABLE_2FA',
      resource: 'User',
      resourceId: req.user!.userId,
      result: 'SUCCESS',
    });

    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const verify2FALogin = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "Authentication code required" });
    }

    const result = await TwoFactorService.verifyLogin(req.user!.userId, token);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'VERIFY_2FA_LOGIN',
      resource: 'User',
      resourceId: req.user!.userId,
      result: 'SUCCESS',
    });

    res.json({
      success: true,
      message: '2FA verification successful',
      isBackupCode: result.isBackupCode,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const get2FAStatus = async (req: AuthRequest, res: Response) => {
  try {
    const status = await TwoFactorService.getStatus(req.user!.userId);
    res.json({ success: true, ...status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBackupCodes = async (req: AuthRequest, res: Response) => {
  try {
    const backupCodes = await TwoFactorService.getBackupCodes(req.user!.userId);
    res.json({ success: true, backupCodes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const regenerateBackupCodes = async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password required" });
    }

    const backupCodes = await TwoFactorService.regenerateBackupCodes(req.user!.userId);

    await AuditLogService.log({
      userId: req.user!.userId,
      userEmail: req.user!.email,
      action: 'REGENERATE_BACKUP_CODES',
      resource: 'User',
      resourceId: req.user!.userId,
      result: 'SUCCESS',
    });

    res.json({ success: true, backupCodes });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
