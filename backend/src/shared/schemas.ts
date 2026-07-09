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

export const createOrderSchema = z
  .object({
    type: z.enum(["DEPOSIT", "EXCHANGE", "GAME_TOPUP"]),
    paymentMethodId: z.string(),
    amount: z.number().positive(),
    gameId: z.string().optional(),
    gameUsername: z.string().optional(),
    walletAddress: z.string().optional(),
    fromWalletId: z.string().optional(),
    toWalletId: z.string().optional(),
    exchangeRate: z.number().optional(),
    rate: z.number().optional(),
    fee: z.number().optional(),
    receiveAmount: z.number().optional(),
    adminWalletId: z.string().optional(),
    receiveUsername: z.string().optional(),
    receiveWalletLabel: z.string().optional(),
    receiveWalletNumber: z.string().optional(),
    receiveEmail: z.string().optional(),
    receivePhone: z.string().optional(),
    transactionReference: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "GAME_TOPUP") {
      if (!data.gameId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Game is required for top-up",
          path: ["gameId"],
        });
      }
      // gameUsername is optional - user might be requesting a new Game ID
    }
  });

export const createGameIdRequestSchema = z.discriminatedUnion("requestType", [
  z.object({
    gameId: z.string().min(1, "Game selection is required"),
    requestType: z.literal("GAME_ID"),
    gameUsername: z.string().trim().min(1, "Game username/ID is required"),
  }),
  z.object({
    gameId: z.string().min(1, "Game selection is required"),
    requestType: z.literal("EMAIL_PASSWORD"),
    email: z.string().trim().email("Valid email is required"),
    password: z.string().trim().min(1, "Password is required"),
  }),
]);

export const gameIdRequestResponseSchema = z.object({
  response: z.string().trim().min(1, "Response is required"),
});
