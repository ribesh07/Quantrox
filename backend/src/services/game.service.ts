import { prisma } from "@quantrox/shared";

export const GameService = {
  async getAll(activeOnly: boolean = false) {
    return prisma.game.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: { name: 'asc' },
    });
  },

  async getById(id: string) {
    return prisma.game.findUnique({
      where: { id },
    });
  },

  async create(data: any, adminId: string) {
    const game = await prisma.game.create({
      data: {
        ...data,
        buyRate: parseFloat(data.buyRate || 0),
        sellRate: parseFloat(data.sellRate || 0),
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: "CREATE_GAME",
        details: `Created game: ${game.name}`,
      },
    });

    return game;
  },

  async update(id: string, data: any, adminId: string) {
    const game = await prisma.game.update({
      where: { id },
      data: {
        ...data,
        ...(data.buyRate !== undefined && { buyRate: parseFloat(data.buyRate) }),
        ...(data.sellRate !== undefined && { sellRate: parseFloat(data.sellRate) }),
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: "UPDATE_GAME",
        details: `Updated game: ${game.name}`,
      },
    });

    return game;
  },

  async delete(id: string, adminId: string) {
    const game = await prisma.game.delete({
      where: { id },
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: "DELETE_GAME",
        details: `Deleted game: ${game.name}`,
      },
    });

    return game;
  }
};
