import { prisma } from "../shared/prisma";

const baseUrl = process.env.SERVICE_URL_BACKEND || "https://api.settlerpay.com";

export const GameService = {
  async getAll(activeOnly: boolean = false) {
    const games = await prisma.game.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: { name: 'asc' },
    });

    return games.map(game => ({
      ...game,
      logo: game.logo 
        ? (game.logo.startsWith('http://') || game.logo.startsWith('https://') 
          ? game.logo 
          : `${baseUrl}${game.logo}`) 
        : null,
    }));
  },

  async getById(id: string) {
    const game = await prisma.game.findUnique({
      where: { id },
    });

    if (!game) return null;

    return {
      ...game,
      logo: game.logo 
        ? (game.logo.startsWith('http://') || game.logo.startsWith('https://') 
          ? game.logo 
          : `${baseUrl}${game.logo}`) 
        : null,
    };
  },

  async create(data: any, adminId: string) {
    // Strip baseUrl from logo if present before saving
    let processedData = { ...data };
    if (processedData.logo && (processedData.logo.startsWith('http://') || processedData.logo.startsWith('https://'))) {
      const pathMatch = processedData.logo.match(/\/uploads\/.*$/);
      if (pathMatch) {
        processedData.logo = pathMatch[0];
      }
    }

    const game = await prisma.game.create({
      data: {
        ...processedData,
        buyRate: parseFloat(processedData.buyRate || 0),
        sellRate: parseFloat(processedData.sellRate || 0),
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: "CREATE_GAME",
        details: `Created game: ${game.name}`,
      },
    });

    return {
      ...game,
      logo: game.logo 
        ? (game.logo.startsWith('http://') || game.logo.startsWith('https://') 
          ? game.logo 
          : `${baseUrl}${game.logo}`) 
        : null,
    };
  },

  async update(id: string, data: any, adminId: string) {
    // Strip baseUrl from logo if present before saving
    let processedData = { ...data };
    if (processedData.logo && (processedData.logo.startsWith('http://') || processedData.logo.startsWith('https://'))) {
      const pathMatch = processedData.logo.match(/\/uploads\/.*$/);
      if (pathMatch) {
        processedData.logo = pathMatch[0];
      }
    }

    const game = await prisma.game.update({
      where: { id },
      data: {
        ...processedData,
        ...(processedData.buyRate !== undefined && { buyRate: parseFloat(processedData.buyRate) }),
        ...(processedData.sellRate !== undefined && { sellRate: parseFloat(processedData.sellRate) }),
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: "UPDATE_GAME",
        details: `Updated game: ${game.name}`,
      },
    });

    return {
      ...game,
      logo: game.logo 
        ? (game.logo.startsWith('http://') || game.logo.startsWith('https://') 
          ? game.logo 
          : `${baseUrl}${game.logo}`) 
        : null,
    };
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

