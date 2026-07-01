import { prisma } from "../shared/prisma";
import { GameIdRequest, GameIdRequestStatus, GameIdRequestType } from "@prisma/client";

export interface CreateGameIdRequestData {
  userId: string;
  gameId: string;
  requestType: GameIdRequestType;
  gameUsername?: string;
  email?: string;
  password?: string;
}

export interface GameIdRequestFilters {
  status?: GameIdRequestStatus;
  userId?: string;
  limit?: number;
  offset?: number;
}

export const GameIdRequestService = {
  async create(data: CreateGameIdRequestData): Promise<GameIdRequest> {
    return await prisma.gameIdRequest.create({
      data,
      include: {
        game: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  },

  async getById(id: string): Promise<GameIdRequest | null> {
    return await prisma.gameIdRequest.findUnique({
      where: { id },
      include: {
        game: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  },

  async getByUserId(userId: string, filters?: GameIdRequestFilters) {
    const where: any = { userId };
    if (filters?.status) {
      where.status = filters.status;
    }

    const [requests, count] = await Promise.all([
      prisma.gameIdRequest.findMany({
        where,
        include: {
          game: true,
        },
        orderBy: { createdAt: "desc" },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.gameIdRequest.count({ where }),
    ]);

    return { requests, count };
  },

  async getAll(filters?: GameIdRequestFilters) {
    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.userId) {
      where.userId = filters.userId;
    }

    const [requests, count] = await Promise.all([
      prisma.gameIdRequest.findMany({
        where,
        include: {
          game: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      prisma.gameIdRequest.count({ where }),
    ]);

    return { requests, count };
  },

  async approve(id: string, adminId: string, response: string): Promise<GameIdRequest> {
    return await prisma.gameIdRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        response,
        respondedAt: new Date(),
        respondedBy: adminId,
      },
      include: {
        game: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  },

  async reject(id: string, adminId: string, response: string): Promise<GameIdRequest> {
    return await prisma.gameIdRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        response,
        respondedAt: new Date(),
        respondedBy: adminId,
      },
      include: {
        game: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  },
};