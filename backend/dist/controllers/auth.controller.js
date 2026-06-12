"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = exports.resetPassword = exports.forgotPassword = exports.logout = exports.refresh = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../shared/prisma");
const schemas_1 = require("../shared/schemas");
const env_1 = require("../config/env");
const token_service_1 = require("../services/token.service");
const email_service_1 = require("../services/email.service");
const register = async (req, res) => {
    try {
        const validatedData = schemas_1.registerSchema.parse(req.body);
        const { username, email, password } = validatedData;
        const existingUser = await prisma_1.prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
        });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email or username already exists" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });
        // create email verification token
        const vt = await token_service_1.TokenService.createVerificationToken(user.id, 'EMAIL_VERIFICATION', 60 * 60 * 24);
        const verifyUrl = `${env_1.env.frontendUrl}/verify-email?token=${vt.token}`;
        // send email (console fallback)
        await email_service_1.EmailService.sendMail({ to: user.email, subject: 'Verify your email', html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email</p>`, text: `Verify: ${verifyUrl}` });
        res.status(201).json({
            success: true,
            user: { id: user.id, username: user.username, email: user.email }
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || "Registration failed" });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = schemas_1.loginSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        console.log("user details :", user);
        if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
        const jwtSecret = env_1.env.jwtSecret || process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not configured");
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, jwtSecret, { expiresIn: '1d' });
        // create refresh token and return it
        const rt = await token_service_1.TokenService.createRefreshToken(user.id);
        res.json({
            success: true,
            token,
            refreshToken: rt.token,
            user: { id: user.id, username: user.username, role: user.role }
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || "Login failed" });
    }
};
exports.login = login;
const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            return res.status(400).json({ success: false, message: 'Missing refreshToken' });
        const rt = await token_service_1.TokenService.verifyRefreshToken(refreshToken);
        if (!rt)
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        const user = await prisma_1.prisma.user.findUnique({ where: { id: rt.userId } });
        if (!user)
            return res.status(401).json({ success: false, message: 'Invalid user' });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, env_1.env.jwtSecret, { expiresIn: '15m' });
        // optionally rotate refresh token
        await token_service_1.TokenService.revokeRefreshToken(refreshToken);
        const newRt = await token_service_1.TokenService.createRefreshToken(user.id);
        res.json({ success: true, token, refreshToken: newRt.token });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.refresh = refresh;
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await token_service_1.TokenService.revokeRefreshToken(refreshToken);
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.logout = logout;
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(400).json({ success: false, message: 'User not found' });
        const vt = await token_service_1.TokenService.createVerificationToken(user.id, 'PASSWORD_RESET', 60 * 60);
        const resetUrl = `${env_1.env.frontendUrl}/reset-password?token=${vt.token}`;
        await email_service_1.EmailService.sendMail({ to: user.email, subject: 'Password reset', html: `<p>Reset your password: <a href="${resetUrl}">Reset</a></p>`, text: `Reset: ${resetUrl}` });
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const vt = await token_service_1.TokenService.verifyVerificationToken(token, 'PASSWORD_RESET');
        if (!vt)
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        const hashed = await bcryptjs_1.default.hash(password, 10);
        await prisma_1.prisma.user.update({ where: { id: vt.userId }, data: { password: hashed } });
        await token_service_1.TokenService.markVerificationTokenUsed(vt.id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.resetPassword = resetPassword;
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        const vt = await token_service_1.TokenService.verifyVerificationToken(token, 'EMAIL_VERIFICATION');
        if (!vt)
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        await prisma_1.prisma.user.update({ where: { id: vt.userId }, data: { status: 'ACTIVE' } });
        await token_service_1.TokenService.markVerificationTokenUsed(vt.id);
        res.json({ success: true });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
exports.verifyEmail = verifyEmail;
