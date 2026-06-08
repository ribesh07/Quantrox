import { z } from "zod";
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const registerSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    username: string;
}, {
    email: string;
    password: string;
    username: string;
}>;
export declare const createOrderSchema: z.ZodObject<{
    type: z.ZodEnum<["DEPOSIT", "EXCHANGE", "GAME_TOPUP"]>;
    paymentMethodId: z.ZodString;
    amount: z.ZodNumber;
    gameId: z.ZodOptional<z.ZodString>;
    gameUsername: z.ZodOptional<z.ZodString>;
    walletAddress: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "DEPOSIT" | "EXCHANGE" | "GAME_TOPUP";
    paymentMethodId: string;
    amount: number;
    gameId?: string | undefined;
    gameUsername?: string | undefined;
    walletAddress?: string | undefined;
}, {
    type: "DEPOSIT" | "EXCHANGE" | "GAME_TOPUP";
    paymentMethodId: string;
    amount: number;
    gameId?: string | undefined;
    gameUsername?: string | undefined;
    walletAddress?: string | undefined;
}>;
