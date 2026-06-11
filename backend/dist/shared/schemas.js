"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrderSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(3),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.createOrderSchema = zod_1.z.object({
    type: zod_1.z.enum(["DEPOSIT", "EXCHANGE", "GAME_TOPUP"]),
    paymentMethodId: zod_1.z.string(),
    amount: zod_1.z.number().positive(),
    gameId: zod_1.z.string().optional(),
    gameUsername: zod_1.z.string().optional(),
    walletAddress: zod_1.z.string().optional(),
});
