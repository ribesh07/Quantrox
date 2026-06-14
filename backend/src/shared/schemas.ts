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
  fromWalletId: z.string().optional(),
  toWalletId: z.string().optional(),
  exchangeRate: z.number().optional(),
  fee: z.number().optional(),
  receiveAmount: z.number().optional(),
  adminWalletId: z.string().optional(),
  receiveUsername: z.string().optional(),
  receiveWalletNumber: z.string().optional(),
  receiveEmail: z.string().optional(),
  receivePhone: z.string().optional(),
  transactionReference: z.string().optional(),
});
