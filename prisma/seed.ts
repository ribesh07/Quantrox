import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // Create Super Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@quantrox.com" },
    update: {},
    create: {
      email: "admin@quantrox.com",
      username: "admin",
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  console.log({ admin });

  // Create default exchange rates
  await prisma.exchangeRate.upsert({
    where: { type: "USD_TO_USDT" },
    update: {},
    create: {
      type: "USD_TO_USDT",
      rate: 0.95, // 1 USD = 0.95 USDT
    },
  });

  await prisma.exchangeRate.upsert({
    where: { type: "USDT_TO_USD" },
    update: {},
    create: {
      type: "USDT_TO_USD",
      rate: 1.05, // 1 USDT = 1.05 USD
    },
  });

  // Create some default games with posters
  const games = [
    { 
      name: "Juwa Online", 
      buyRate: 1.0, 
      sellRate: 1.0, 
      logo: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
      active: true 
    },
    { 
      name: "Firekirin", 
      buyRate: 1.0, 
      sellRate: 1.0, 
      logo: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop",
      active: true 
    },
    { 
      name: "Orion Stars", 
      buyRate: 1.0, 
      sellRate: 1.0, 
      logo: "https://images.unsplash.com/photo-1614027164847-1b2809eb7b9c?q=80&w=1964&auto=format&fit=crop",
      active: true 
    },
    { 
      name: "Game Vault", 
      buyRate: 1.0, 
      sellRate: 1.0, 
      logo: "https://images.unsplash.com/photo-1552824236-033f42de7483?q=80&w=2070&auto=format&fit=crop",
      active: true 
    },
    { 
      name: "Panda Master", 
      buyRate: 1.0, 
      sellRate: 1.0, 
      logo: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1930&auto=format&fit=crop",
      active: true 
    },
    { 
      name: "Ultra Monster", 
      buyRate: 1.0, 
      sellRate: 1.0, 
      logo: "https://images.unsplash.com/photo-1605899435973-ca2d1a8861cf?q=80&w=1935&auto=format&fit=crop",
      active: true 
    },
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: { id: game.name.toLowerCase().replace(/\s+/g, '-') }, // Using a predictable ID for seed
      update: {
        logo: game.logo,
        buyRate: game.buyRate,
        sellRate: game.sellRate,
        active: game.active,
      },
      create: {
        id: game.name.toLowerCase().replace(/\s+/g, '-'),
        name: game.name,
        logo: game.logo,
        buyRate: game.buyRate,
        sellRate: game.sellRate,
        active: game.active,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
