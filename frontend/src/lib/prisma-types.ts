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

export const ReportStatus = {
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const DepositType = {
  INITIAL: "INITIAL",
  ADDITIONAL: "ADDITIONAL",
  ADJUSTMENT: "ADJUSTMENT",
  WITHDRAWAL: "WITHDRAWAL",
} as const;

export type DepositType = (typeof DepositType)[keyof typeof DepositType];

export const DepositStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  FROZEN: "FROZEN",
  RELEASED: "RELEASED",
  REJECTED: "REJECTED",
} as const;

export type DepositStatus = (typeof DepositStatus)[keyof typeof DepositStatus];

export const PayoutStatus = {
  PENDING: "PENDING",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  PAID: "PAID",
  REJECTED: "REJECTED",
} as const;

export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];

export const PayoutType = {
  MERCHANT: "MERCHANT",
  USER: "USER",
} as const;

export type PayoutType = (typeof PayoutType)[keyof typeof PayoutType];
