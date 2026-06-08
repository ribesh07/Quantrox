import { OrderType, OrderStatus, Role } from "@prisma/client";

export interface CreateOrderDTO {
  userId: string;
  type: OrderType;
  paymentMethodId: string;
  amount: number;
  gameId?: string;
  gameUsername?: string;
  walletAddress?: string;
}

export interface UserDTO {
  id: string;
  username: string;
  email: string;
  role: Role;
  createdAt: Date;
}
