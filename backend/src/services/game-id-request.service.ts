import { prisma } from "../shared/prisma";
import { GameIdRequest, GameIdRequestStatus, GameIdRequestType } from "@prisma/client";
import { NotificationService } from "./notification.service";

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

async function getPendingRequest(id: string) {
  const request = await prisma.gameIdRequest.findUnique({
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

  if (!request) {
    throw new Error("Game ID request not found");
  }

  if (request.status !== "PENDING") {
    throw new Error(`This request has already been ${request.status.toLowerCase()}`);
  }

  return request;
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
    const existing = await getPendingRequest(id);

    const request = await prisma.gameIdRequest.update({
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

    await NotificationService.send({
      userId: existing.userId,
      title: "Game ID Request Approved",
      message: `Your ${existing.game.name} game ID request has been approved. ${response}`,
      type: "SUCCESS",
      referenceType: "GAME_ID_REQUEST",
      referenceId: id,
    });

    return request;
  },

  async reject(id: string, adminId: string, response: string): Promise<GameIdRequest> {
    const existing = await getPendingRequest(id);

    const request = await prisma.gameIdRequest.update({
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

    await NotificationService.send({
      userId: existing.userId,
      title: "Game ID Request Rejected",
      message: `Your ${existing.game.name} game ID request was rejected. Reason: ${response}`,
      type: "ERROR",
      referenceType: "GAME_ID_REQUEST",
      referenceId: id,
    });

    return request;
  },
};
