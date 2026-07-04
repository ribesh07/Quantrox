import {
  PrismaClient,
  Role,
  PaymentMethodCategory,
  FeeType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // USERS
 

  const adminPassword = await bcrypt.hash('Kevin@iie7388', 10);

await prisma.user.upsert({
  where: {
    email: 'Schodhury334@gmail.com',
  },
  update: {},
  create: {
    email: 'Schodhury334@gmail.com',
    username: 'admin',
    password: adminPassword,
    role: Role.SUPER_ADMIN,
  },
});


  
  // PAYMENT METHODS


  const paymentMethods = [
    {
      name: 'USDT (TRC20)',
      category: PaymentMethodCategory.DEPOSIT,
      feePercentage: 0,
      rate: 1,
    },
    {
      name: 'USDT (BEP20)',
      category: PaymentMethodCategory.DEPOSIT,
      feePercentage: 0,
      rate: 1,
    },
    {
      name: 'USDT (ERC20)',
      category: PaymentMethodCategory.DEPOSIT,
      feePercentage: 0,
      rate: 1,
    },
    {
      name: 'Cash App',
      category: PaymentMethodCategory.BOTH,
      feePercentage: 5,
      rate: 0.95,
    },
    {
      name: 'Zelle',
      category: PaymentMethodCategory.BOTH,
      feePercentage: 5,
      rate: 0.97,
    },
    {
      name: 'Venmo',
      category: PaymentMethodCategory.BOTH,
      feePercentage: 5,
      rate: 0.95,
    },
    {
      name: 'Chime',
      category: PaymentMethodCategory.BOTH,
      feePercentage: 5,
      rate: 0.96,
    },
    {
      name: 'Stripe',
      category: PaymentMethodCategory.DEPOSIT,
      feePercentage: 5,
      rate: 1,
    },
    {
      name: 'PayPal',
      category: PaymentMethodCategory.BOTH,
      feePercentage: 5,
      rate: 0.92,
    },
    {
      name: 'Apple Pay',
      category: PaymentMethodCategory.DEPOSIT,
      feePercentage: 5,
      rate: 1,
    },
  ];

  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { name: method.name },
      update: method,
      create: method,
    });
  }

  const paymentMethodsDb = await prisma.paymentMethod.findMany();

  // GAMES
 

 const games = [
  'Orion Star',
  'Juwa',
  'Fire Kirin',
  'Milky Way',
  'Game Vault',
  'Panda Master',
  'Ultra Panda',
  'Yolo777',
  'VB Link',
  'Vegas Sweeps',
  'Cash Machine',
  'Game Room',
  'Casino Ignite',
  'Cash Frenzy',
  'Sirius',
  'River Sweeps',
  'VegasX',
  'Blue Dragon',
  'Mega Spin',
  'Para Casino',
  'EGame',
  'Cash Vault',
  'Gem Slots',
  'Lucky Star',
  'Big Winner',
  'Moolah',
  'Win Star',
  'Orion Strike',
  'Orion Power',
  'Vegas Luck',
  'King of Pop',
  'Mr All In One',
  'Big Bang',
  'Nobel',
];

  for (const gameName of games) {
    await prisma.game.upsert({
      where: {
        id: gameName.toLowerCase().replace(/\s+/g, '-'),
      },
      update: {},
      create: {
        id: gameName.toLowerCase().replace(/\s+/g, '-'),
        name: gameName,
        buyRate: 1,
        sellRate: 1,
        active: true,
      },
    });
  }

  const game = await prisma.game.findFirst();

  // SYSTEM SETTINGS


  if (!(await prisma.systemSettings.findFirst())) {
    await prisma.systemSettings.create({
      data: {
        minExchangeAmount: 10,
        maxExchangeAmount: 50000,
        minGamePurchaseAmount: 5,
        maxGamePurchaseAmount: 10000,
        exchangeProcessTime: 300,
        requiresApprovalAmount: 5000,
      },
    });
  }

 
  // FEE SETTINGS
 

  if ((await prisma.feeSetting.count()) === 0) {
    await prisma.feeSetting.createMany({
      data: [
        {
          feeType: FeeType.EXCHANGE_FEE,
          percentage: 5,
          description: 'Default Exchange Fee',
        },
        {
          feeType: FeeType.DEPOSIT_FEE,
          percentage: 2,
          description: 'Default Deposit Fee',
        },
      ],
    });
  }

  
  // PAYMENT ACCOUNTS


  for (const method of paymentMethodsDb) {
    const existing = await prisma.paymentAccount.findFirst({
      where: {
        paymentMethodId: method.id,
      },
    });

    if (!existing) {
      await prisma.paymentAccount.create({
        data: {
          paymentMethodId: method.id,
          accountName: 'SettlerPay',
          email:
            method.name === 'PayPal'
              ? 'payments@settlerpay.com'
              : null,
          walletAddress: method.name.includes('USDT')
            ? 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
            : null,
          instructions: `Send payment via ${method.name}`,
        },
      });
    }
  }


  // NOTIFICATION TEMPLATES


 


  // USER SETTINGS
 



 
  // WALLETS
 



  
 
 

  

  // ---------------- ADMIN PANEL SAMPLE DATA ----------------
 



 

  

   
  // ---------------- USER NOTIFICATIONS & PREFERENCES ----------------
  

    

 
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    // process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });