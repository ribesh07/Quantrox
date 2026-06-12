import { PrismaClient, Role, PaymentMethodCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create Super Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@Settlerpay.com' },
    update: {},
    create: {
      email: 'admin@Settlerpay.com',
      username: 'admin',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  console.log({ admin });

  const paymentMethods = [
    { name: 'USDT (TRC20)', category: PaymentMethodCategory.DEPOSIT, feePercentage: 0, rate: 1.0 },
    { name: 'USDT (BEP20)', category: PaymentMethodCategory.DEPOSIT, feePercentage: 0, rate: 1.0 },
    { name: 'USDT (ERC20)', category: PaymentMethodCategory.DEPOSIT, feePercentage: 0, rate: 1.0 },
    { name: 'Cash App', category: PaymentMethodCategory.BOTH, feePercentage: 5, rate: 0.95 },
    { name: 'Zelle', category: PaymentMethodCategory.BOTH, feePercentage: 5, rate: 0.97 },
    { name: 'Venmo', category: PaymentMethodCategory.BOTH, feePercentage: 5, rate: 0.95 },
    { name: 'Chime', category: PaymentMethodCategory.BOTH, feePercentage: 5, rate: 0.96 },
    { name: 'Stripe', category: PaymentMethodCategory.DEPOSIT, feePercentage: 5, rate: 1.0 },
    { name: 'Stripe Cash App Pay', category: PaymentMethodCategory.DEPOSIT, feePercentage: 5, rate: 1.0 },
    { name: 'PayPal', category: PaymentMethodCategory.BOTH, feePercentage: 5, rate: 0.92 },
    { name: 'Apple Pay', category: PaymentMethodCategory.DEPOSIT, feePercentage: 5, rate: 1.0 },
    { name: 'Cash App Card Cash Out', category: PaymentMethodCategory.EXCHANGE, feePercentage: 2, rate: 0.94 },
    { name: 'Cash App P2P', category: PaymentMethodCategory.EXCHANGE, feePercentage: 2, rate: 0.95 },
    { name: 'Chime P2P', category: PaymentMethodCategory.EXCHANGE, feePercentage: 2, rate: 0.96 },
    { name: 'Apple Pay P2P', category: PaymentMethodCategory.EXCHANGE, feePercentage: 2, rate: 0.98 },
  ];

  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { name: method.name },
      update: {
        category: method.category,
        feePercentage: method.feePercentage,
        rate: method.rate,
      },
      create: {
        name: method.name,
        category: method.category,
        feePercentage: method.feePercentage,
        rate: method.rate,
      },
    });
  }

  const games = [
    {
      name: 'Juwa Online',
      buyRate: 1.0,
      sellRate: 1.0,
      logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
      active: true,
    },
    {
      name: 'Firekirin',
      buyRate: 1.0,
      sellRate: 1.0,
      logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop',
      active: true,
    },
    {
      name: 'Orion Stars',
      buyRate: 1.0,
      sellRate: 1.0,
      logo: 'https://images.unsplash.com/photo-1614027164847-1b2809eb7b9c?q=80&w=1964&auto=format&fit=crop',
      active: true,
    },
    {
      name: 'Game Vault',
      buyRate: 1.0,
      sellRate: 1.0,
      logo: 'https://images.unsplash.com/photo-1552824236-033f42de7483?q=80&w=2070&auto=format&fit=crop',
      active: true,
    },
    {
      name: 'Panda Master',
      buyRate: 1.0,
      sellRate: 1.0,
      logo: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1930&auto=format&fit=crop',
      active: true,
    },
    {
      name: 'Ultra Monster',
      buyRate: 1.0,
      sellRate: 1.0,
      logo: 'https://images.unsplash.com/photo-1605899435973-ca2d1a8861cf?q=80&w=1935&auto=format&fit=crop',
      active: true,
    },
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: { id: game.name.toLowerCase().replace(/\s+/g, '-') },
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
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
