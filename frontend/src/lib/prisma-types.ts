export const Role = {
  USER: "USER",
  STAFF_ADMIN: "STAFF_ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const OrderStatus = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const OrderType = {
  DEPOSIT: "DEPOSIT",
  EXCHANGE: "EXCHANGE",
  GAME_TOPUP: "GAME_TOPUP",
} as const;

export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const PaymentMethodCategory = {
  DEPOSIT: "DEPOSIT",
  EXCHANGE: "EXCHANGE",
  BOTH: "BOTH",
} as const;

export type PaymentMethodCategory = (typeof PaymentMethodCategory)[keyof typeof PaymentMethodCategory];
