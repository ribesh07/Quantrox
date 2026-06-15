import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../shared/prisma';
import { registerSchema, loginSchema } from '../shared/schemas';
import { env } from '../config/env';
import { TokenService } from '../services/token.service';
import { EmailService } from '../services/email.service';
import { v4 as uuidv4 } from 'uuid';

export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { username, email, password } = validatedData;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User with this email or username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    // create email verification token
    const vt = await TokenService.createVerificationToken(user.id, 'EMAIL_VERIFICATION', 60 * 60 * 24);
    const verifyUrl = `${env.frontendUrl}/verify-email?token=${vt.token}`;
    // send email (console fallback)
    await EmailService.sendMail({ to: user.email, subject: 'Verify your email', html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email</p>`, text: `Verify: ${verifyUrl}` });

    res.status(201).json({ 
      success: true, 
      user: { id: user.id, username: user.username, email: user.email } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    const jwtSecret = env.jwtSecret || process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

        const token = jwt.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: '1d' });

      // create refresh token and return it
      const rt = await TokenService.createRefreshToken(user.id);

    res.json({ 
      success: true, 
      token, 
        refreshToken: rt.token,
        user: { id: user.id, username: user.username, role: user.role } 
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || "Login failed" });
  }
};

  export const refresh = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ success: false, message: 'Missing refreshToken' });

      const rt = await TokenService.verifyRefreshToken(refreshToken);
      if (!rt) return res.status(401).json({ success: false, message: 'Invalid refresh token' });

      const user = await prisma.user.findUnique({ where: { id: rt.userId } });
      if (!user) return res.status(401).json({ success: false, message: 'Invalid user' });

      const token = jwt.sign({ userId: user.id, role: user.role }, env.jwtSecret, { expiresIn: '1d' });
      // optionally rotate refresh token
      await TokenService.revokeRefreshToken(refreshToken);
      const newRt = await TokenService.createRefreshToken(user.id);

      res.json({ success: true, token, refreshToken: newRt.token });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  export const logout = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await TokenService.revokeRefreshToken(refreshToken);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  export const forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(400).json({ success: false, message: 'User not found' });

      const vt = await TokenService.createVerificationToken(user.id, 'PASSWORD_RESET', 60 * 60);
      const resetUrl = `${env.frontendUrl}/reset-password?token=${vt.token}`;
      await EmailService.sendMail({ to: user.email, subject: 'Password reset', html: `<p>Reset your password: <a href="${resetUrl}">Reset</a></p>`, text: `Reset: ${resetUrl}` });
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  export const resetPassword = async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      const vt = await TokenService.verifyVerificationToken(token, 'PASSWORD_RESET');
      if (!vt) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

      const hashed = await bcrypt.hash(password, 10);
      await prisma.user.update({ where: { id: vt.userId }, data: { password: hashed } });
      await TokenService.markVerificationTokenUsed(vt.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  export const verifyEmail = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      const vt = await TokenService.verifyVerificationToken(token, 'EMAIL_VERIFICATION');
      if (!vt) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

      await prisma.user.update({ where: { id: vt.userId }, data: { status: 'ACTIVE' } });
      await TokenService.markVerificationTokenUsed(vt.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  export const getCurrentUser = async (req: AuthRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };



