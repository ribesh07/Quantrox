import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function initPrisma() {
  try {
    console.log('[prisma] Connecting to database...');
    await prisma.$connect();
    console.log('[prisma] Connected');
  } catch (err) {
    console.error('[prisma] Connection error:', err);
    throw err;
  }
}
