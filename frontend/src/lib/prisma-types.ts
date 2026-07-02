export const Role = {
  USER: "USER",
  VENDOR: "VENDOR",
  STAFF_ADMIN: "STAFF_ADMIN",
  SUB_ADMIN: "SUB_ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export const Permission = {
  VIEW_ORDERS: "VIEW_ORDERS",
  MANAGE_ORDERS: "MANAGE_ORDERS",
  VIEW_USERS: "VIEW_USERS",
  MANAGE_USERS: "MANAGE_USERS",
  VIEW_GAMES: "VIEW_GAMES",
  MANAGE_GAMES: "MANAGE_GAMES",
  VIEW_MERCHANTS: "VIEW_MERCHANTS",
  MANAGE_MERCHANTS: "MANAGE_MERCHANTS",
  VIEW_PAYMENT_METHODS: "VIEW_PAYMENT_METHODS",
  MANAGE_PAYMENT_METHODS: "MANAGE_PAYMENT_METHODS",
  VIEW_DEPOSITS: "VIEW_DEPOSITS",
  MANAGE_DEPOSITS: "MANAGE_DEPOSITS",
  VIEW_PAYOUTS: "VIEW_PAYOUTS",
  MANAGE_PAYOUTS: "MANAGE_PAYOUTS",
  VIEW_SETTINGS: "VIEW_SETTINGS",
  MANAGE_SETTINGS: "MANAGE_SETTINGS",
  VIEW_GAME_ID_REQUESTS: "VIEW_GAME_ID_REQUESTS",
  MANAGE_GAME_ID_REQUESTS: "MANAGE_GAME_ID_REQUESTS",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

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
