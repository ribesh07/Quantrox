import {
  PrismaClient,
  Role,
  PaymentMethodCategory,
  FeeType,
  OrderType,
  OrderStatus,
  ExchangeStatus,
  GamePointOrderStatus,
  NotificationType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // USERS
 

  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);
  const userPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@settlerpay.com' },
    update: {},
    create: {
      email: 'admin@settlerpay.com',
      username: 'admin',
      password: adminPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@settlerpay.com' },
    update: {},
    create: {
      email: 'staff@settlerpay.com',
      username: 'staff',
      password: staffPassword,
      role: Role.STAFF_ADMIN,
    },
  });

  const users = [];

  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.upsert({
      where: {
        email: `user${i}@example.com`,
      },
      update: {},
      create: {
        email: `user${i}@example.com`,
        username: `user${i}`,
        password: userPassword,
      },
    });

    users.push(user);
  }

  
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
    'Juwa Online',
    'Firekirin',
    'Orion Stars',
    'Game Vault',
    'Panda Master',
    'Ultra Monster',
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


  const templates = [
    {
      code: 'ORDER_APPROVED',
      title: 'Order Approved',
      subject: 'Order Approved',
      body: 'Your order {{orderId}} has been approved.',
      type: 'EMAIL',
    },
    {
      code: 'ORDER_REJECTED',
      title: 'Order Rejected',
      subject: 'Order Rejected',
      body: 'Your order {{orderId}} has been rejected.',
      type: 'EMAIL',
    },
  ];

  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: {
        code: template.code,
      },
      update: {},
      create: template,
    });
  }

  // USER SETTINGS
 

  for (const user of users) {
    await prisma.notificationPreference.upsert({
      where: {
        userId: user.id,
      },
      update: {},
      create: {
        userId: user.id,
      },
    });
  }

 
  // WALLETS
 

  for (const user of users) {
    for (const method of paymentMethodsDb) {
      await prisma.wallet.upsert({
        where: {
          userId_paymentMethodId: {
            userId: user.id,
            paymentMethodId: method.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          paymentMethodId: method.id,
          balance: Math.floor(Math.random() * 5000),
        },
      });
    }
  }

  
  // SAMPLE DATA
 

  for (const user of users) {
    const method = paymentMethodsDb[0];

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        type: OrderType.GAME_TOPUP,
        paymentMethodId: method.id,
        amount: 100,
        fee: 5,
        total: 105,
        rate: 1,
        receivedAmount: 100,
        status: OrderStatus.APPROVED,
        gameId: game?.id,
        gameUsername: `${user.username}_player`,
      },
    });

    await prisma.transaction.create({
      data: {
        orderId: order.id,
        userId: user.id,
        amount: order.total,
        type: 'GAME_TOPUP',
        status: 'SUCCESS',
      },
    });

    await prisma.exchangeRequest.create({
      data: {
        userId: user.id,
        amount: 500,
        fee: 25,
        total: 525,
        rate: 1,
        usdtReceived: 500,
        walletAddress: 'TRON_WALLET_TEST',
        paymentMethodId: method.id,
        status: ExchangeStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    await prisma.gamePointOrder.create({
      data: {
        userId: user.id,
        gameId: game!.id,
        points: 1000,
        pricePerPoint: 0.01,
        totalPrice: 10,
        fee: 1,
        finalPrice: 11,
        paymentMethodId: method.id,
        gameUsername: `${user.username}_player`,
        status: GamePointOrderStatus.FULFILLED,
        fulfilledAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to SettlerPay',
        message: 'Your account has been successfully created.',
        type: NotificationType.SUCCESS,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: 'ACCOUNT_CREATED',
        resource: 'USER',
        resourceId: user.id,
        result: 'SUCCESS',
      },
    });
  }

  console.log('✅ Seed completed');
  console.log('👤 Admin: admin@settlerpay.com / admin123');
  console.log('👤 Staff: staff@settlerpay.com / staff123');
  console.log('👤 Users: user1@example.com → user5@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    // process.exit(1);//
  })
  .finally(async () => {
    await prisma.$disconnect();
  });