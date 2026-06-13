"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.initPrisma = initPrisma;
const client_1 = require("@prisma/client");
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: ["query"],
    });
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.prisma;
async function initPrisma() {
    try {
        console.log('[prisma] Connecting to database...');
        await exports.prisma.$connect();
        console.log('[prisma] Connected');
    }
    catch (err) {
        console.error('[prisma] Connection error:', err);
        throw err;
    }
}
