import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

export const createOrderSchema = z.object({
  type: z.enum(["DEPOSIT", "EXCHANGE", "GAME_TOPUP"]),
  paymentMethodId: z.string(),
  amount: z.number().positive(),
  gameId: z.string().optional(),
  gameUsername: z.string().optional(),
  walletAddress: z.string().optional(),
});
