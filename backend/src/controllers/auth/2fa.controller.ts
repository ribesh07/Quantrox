import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { TwoFAService } from '../../services/auth/2fa.service';
import { prisma } from '../../shared/prisma';
import { TokenService } from '../../services/token.service';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

// Setup 2FA
export const setup2FA = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { secret, qrCode } = await TwoFAService.generateSetupSecret(user.id, user.email);

    res.json({
      success: true,
      secret,
      qrCode,
    });
  } catch (error: any) {
    console.error('Setup 2FA error:', error);
    res.status(400).json({ success: false, message: 'Failed to setup 2FA' });
  }
};

// Enable 2FA
export const enable2FA = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { code, secret, password } = req.body;

    if (!code || !secret || !password) {
      return res.status(400).json({
        success: false,
        message: 'Code, secret, and password are required',
      });
    }

    const result = await TwoFAService.enable2FA(req.user.userId, secret, code, password);

    res.json({
      success: true,
      backupCodes: result.backupCodes,
    });
  } catch (error: any) {
    console.error('Enable 2FA error:', error);
    res.status(400).json({ success: false, message: 'Invalid credentials or code' });
  }
};

// Disable 2FA
export const disable2FA = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { password, code } = req.body;

    if (!password || !code) {
      return res.status(400).json({
        success: false,
        message: 'Password and code are required',
      });
    }

    await TwoFAService.disable2FA(req.user.userId, password, code);

    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error: any) {
    console.error('Disable 2FA error:', error);
    res.status(400).json({ success: false, message: 'Invalid credentials or code' });
  }
};

// Verify 2FA for login
export const verify2FA = async (req: AuthRequest, res: Response) => {
  try {
    const { temporaryToken, code } = req.body;

    if (!temporaryToken || !code) {
      return res.status(400).json({
        success: false,
        message: 'Temporary token and code are required',
      });
    }

    const userId = TwoFAService.verifyTemporaryToken(temporaryToken);
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired temporary token',
      });
    }

    await TwoFAService.verify2FA(userId, code);

    // Issue full JWT tokens
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, env.jwtSecret, { expiresIn: '1d' });
    const rt = await TokenService.createRefreshToken(user.id);

    res.json({
      success: true,
      token,
      refreshToken: rt.token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error: any) {
    console.error('Verify 2FA error:', error);
    res.status(400).json({ success: false, message: 'Invalid authentication code' });
  }
};
