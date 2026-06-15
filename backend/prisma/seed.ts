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
  UserStatus,
  DepositType,
  DepositStatus,
  PayoutStatus,
  ReportStatus,
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

  // MERCHANT DEMO DATA (additive — skips records that already exist)
  console.log('🏪 Seeding merchant demo data...');

  const merchantProfiles = [
    {
      email: 'merchant1@example.com',
      username: 'merchant1',
      businessName: 'QuickPay Gaming Lounge',
      businessDescription: 'Mobile game top-up and wallet services',
      expectedDailyVolume: 5000,
      approved: true,
    },
    {
      email: 'merchant2@example.com',
      username: 'merchant2',
      businessName: 'Neon Arcade Exchange',
      businessDescription: 'Pending merchant application for review',
      expectedDailyVolume: 2500,
      approved: false,
    },
    {
      email: 'merchant3@example.com',
      username: 'merchant3',
      businessName: 'Star Points Hub',
      businessDescription: 'Approved merchant with mixed transaction states',
      expectedDailyVolume: 8000,
      approved: true,
    },
  ];

  const seededMerchants: Array<{ user: { id: string; email: string; username: string }; walletId: string; approved: boolean }> = [];

  for (const profile of merchantProfiles) {
    const merchantUser = await prisma.user.upsert({
      where: { email: profile.email },
      update: { status: UserStatus.ACTIVE },
      create: {
        email: profile.email,
        username: profile.username,
        password: userPassword,
        status: UserStatus.ACTIVE,
      },
    });

    await prisma.notificationPreference.upsert({
      where: { userId: merchantUser.id },
      update: {},
      create: { userId: merchantUser.id },
    });

    const preferredMethod = paymentMethodsDb[0];
    const merchantWallet = await prisma.wallet.upsert({
      where: {
        userId_paymentMethodId: {
          userId: merchantUser.id,
          paymentMethodId: preferredMethod.id,
        },
      },
      update: {},
      create: {
        userId: merchantUser.id,
        paymentMethodId: preferredMethod.id,
        balance: profile.approved ? 3500 : 500,
      },
    });

    const existingMerchantInfo = await prisma.merchantInfo.findUnique({
      where: { userId: merchantUser.id },
    });

    if (!existingMerchantInfo) {
      await prisma.merchantInfo.create({
        data: {
          userId: merchantUser.id,
          businessName: profile.businessName,
          businessDescription: profile.businessDescription,
          preferredWalletId: merchantWallet.id,
          expectedDailyVolume: profile.expectedDailyVolume,
          approvedAt: profile.approved ? new Date() : null,
          approvedBy: profile.approved ? admin.id : null,
          adminNote: profile.approved ? 'Demo merchant approved for testing' : null,
        },
      });
    }

    seededMerchants.push({
      user: merchantUser,
      walletId: merchantWallet.id,
      approved: profile.approved,
    });
  }

  const approvedMerchant = seededMerchants.find((m) => m.user.email === 'merchant1@example.com');
  if (approvedMerchant) {
    const existingQr = await prisma.merchantQRCode.findUnique({
      where: { userId: approvedMerchant.user.id },
    });

    if (!existingQr) {
      await prisma.merchantQRCode.create({
        data: {
          userId: approvedMerchant.user.id,
          imageUrl: 'https://placehold.co/300x300/png?text=Merchant+QR',
          assignedBy: admin.id,
        },
      });
    }

    const existingDeposits = await prisma.deposit.count({
      where: { userId: approvedMerchant.user.id },
    });

    if (existingDeposits === 0) {
      await prisma.deposit.createMany({
        data: [
          {
            userId: approvedMerchant.user.id,
            amount: 1000,
            type: DepositType.INITIAL,
            status: DepositStatus.APPROVED,
            requiredDeposit: 1000,
            notes: 'Initial merchant deposit',
          },
          {
            userId: approvedMerchant.user.id,
            amount: 500,
            type: DepositType.ADDITIONAL,
            status: DepositStatus.PENDING,
            requiredDeposit: 0,
            notes: 'Additional deposit awaiting approval',
          },
          {
            userId: approvedMerchant.user.id,
            amount: 750,
            type: DepositType.ADDITIONAL,
            status: DepositStatus.FROZEN,
            requiredDeposit: 0,
            notes: 'Frozen deposit for compliance review',
            frozenAt: new Date(),
            frozenBy: admin.id,
          },
        ],
      });
    }

    const existingPayouts = await prisma.payoutRequest.count({
      where: { userId: approvedMerchant.user.id },
    });

    if (existingPayouts === 0) {
      await prisma.payoutRequest.createMany({
        data: [
          {
            userId: approvedMerchant.user.id,
            amount: 250,
            walletAddress: 'TDemoMerchantWallet111111111111111',
            walletNetwork: 'TRC20',
            remarks: 'Weekly payout request',
            status: PayoutStatus.PENDING,
          },
          {
            userId: approvedMerchant.user.id,
            amount: 400,
            walletAddress: 'TDemoMerchantWallet222222222222222',
            walletNetwork: 'TRC20',
            remarks: 'Approved payout ready to mark paid',
            status: PayoutStatus.APPROVED,
            approvedAt: new Date(),
            approvedBy: admin.id,
          },
          {
            userId: approvedMerchant.user.id,
            amount: 150,
            walletAddress: 'TDemoMerchantWallet333333333333333',
            walletNetwork: 'TRC20',
            remarks: 'Completed payout',
            status: PayoutStatus.PAID,
            approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            approvedBy: admin.id,
            paidAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            paidBy: admin.id,
            transactionHash: '0xdemo1234567890abcdef',
          },
        ],
      });
    }

    const existingReports = await prisma.transactionReport.count({
      where: { userId: approvedMerchant.user.id },
    });

    if (existingReports === 0) {
      await prisma.transactionReport.createMany({
        data: [
          {
            userId: approvedMerchant.user.id,
            transactionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            totalTransactions: 42,
            totalAmount: 3200,
            notes: 'Daily sales report',
            status: ReportStatus.APPROVED,
            reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            reviewedBy: admin.id,
          },
          {
            userId: approvedMerchant.user.id,
            transactionDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            totalTransactions: 18,
            totalAmount: 1450,
            notes: 'Pending review report',
            status: ReportStatus.PENDING_REVIEW,
          },
        ],
      });
    }
  }

  const mixedStateMerchant = seededMerchants.find((m) => m.user.email === 'merchant3@example.com');
  if (mixedStateMerchant) {
    const existingDeposits = await prisma.deposit.count({
      where: { userId: mixedStateMerchant.user.id },
    });

    if (existingDeposits === 0) {
      await prisma.deposit.create({
        data: {
          userId: mixedStateMerchant.user.id,
          amount: 300,
          type: DepositType.INITIAL,
          status: DepositStatus.REJECTED,
          requiredDeposit: 500,
          notes: 'Rejected due to insufficient documentation',
        },
      });
    }

    const existingPayouts = await prisma.payoutRequest.count({
      where: { userId: mixedStateMerchant.user.id },
    });

    if (existingPayouts === 0) {
      await prisma.payoutRequest.create({
        data: {
          userId: mixedStateMerchant.user.id,
          amount: 200,
          walletAddress: 'TDemoMerchantWallet444444444444444',
          walletNetwork: 'BEP20',
          remarks: 'Rejected payout example',
          status: PayoutStatus.REJECTED,
          rejectedAt: new Date(),
          rejectedBy: admin.id,
          rejectionReason: 'Invalid wallet address format',
        },
      });
    }

    const existingReports = await prisma.transactionReport.count({
      where: { userId: mixedStateMerchant.user.id },
    });

    if (existingReports === 0) {
      await prisma.transactionReport.create({
        data: {
          userId: mixedStateMerchant.user.id,
          transactionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          totalTransactions: 9,
          totalAmount: 620,
          notes: 'Rejected report example',
          status: ReportStatus.REJECTED,
          reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          reviewedBy: admin.id,
          rejectionReason: 'Proof image was unclear',
        },
      });
    }
  }

  console.log('✅ Seed completed');
  console.log('👤 Admin: admin@settlerpay.com / admin123');
  console.log('👤 Staff: staff@settlerpay.com / staff123');
  console.log('👤 Users: user1@example.com → user5@example.com / password123');
  console.log('🏪 Merchants: merchant1@example.com (approved), merchant2@example.com (pending), merchant3@example.com (mixed states) / password123');
}

main()
  .catch((e) => {
    console.error(e);
    // process.exit(1);//
  })
  .finally(async () => {
    await prisma.$disconnect();
  });