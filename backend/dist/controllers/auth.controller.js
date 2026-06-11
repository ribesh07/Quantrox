"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const shared_1 = require("@quantrox/shared");
const env_1 = require("../config/env");
const register = async (req, res) => {
    try {
        const validatedData = shared_1.registerSchema.parse(req.body);
        const { username, email, password } = validatedData;
        const existingUser = await shared_1.prisma.user.findFirst({
            where: { OR: [{ email }, { username }] },
        });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email or username already exists" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await shared_1.prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
            },
        });
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
        const { email, password } = shared_1.loginSchema.parse(req.body);
        const user = await shared_1.prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, env_1.env.jwtSecret, { expiresIn: '1d' });
        res.json({
            success: true,
            token,
            user: { id: user.id, username: user.username, role: user.role }
        });
    }
    catch (error) {
        res.status(400).json({ success: false, message: error.message || "Login failed" });
    }
};
exports.login = login;
