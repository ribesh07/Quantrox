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

  const users: any[] = [];
  for (let i = 1; i <= 6; i++) {
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

    seededMerchants.push({ user: merchantUser, approved: profile.approved });
  }

  // ---------------- ADMIN PANEL SAMPLE DATA ----------------
  console.log('📋 Seeding admin panel sample data...');

  const primaryGame = game!;
  const usdtTrc = paymentMethodsDb.find((m) => m.name.includes('USDT')) ?? paymentMethodsDb[0];
  const cashApp = paymentMethodsDb.find((m) => m.name.includes('Cash App')) ?? paymentMethodsDb[0];
  const zelle = paymentMethodsDb.find((m) => m.name.includes('Zelle')) ?? paymentMethodsDb[0];
  const wireTransfer = paymentMethodsDb.find((m) => m.name.includes('Wire')) ?? paymentMethodsDb[0];
  const SEED_MARKER = 'SEED_DATA';

  await seedIfEmpty('Orders & transactions', await prisma.order.count(), async () => {
    const orderSamples = [
      { user: users[0], type: OrderType.DEPOSIT, status: OrderStatus.PENDING_PAYMENT, amount: 200, fee: 4, total: 204, method: usdtTrc },
      { user: users[0], type: OrderType.DEPOSIT, status: OrderStatus.PENDING_REVIEW, amount: 500, fee: 10, total: 510, method: cashApp },
      { user: users[1], type: OrderType.DEPOSIT, status: OrderStatus.COMPLETED, amount: 1000, fee: 20, total: 1020, method: zelle },
      { user: users[1], type: OrderType.DEPOSIT, status: OrderStatus.REJECTED, amount: 150, fee: 3, total: 153, method: cashApp },
      { user: users[2], type: OrderType.EXCHANGE, status: OrderStatus.PENDING_PAYMENT, amount: 300, fee: 15, total: 315, method: wireTransfer },
      { user: users[2], type: OrderType.EXCHANGE, status: OrderStatus.PENDING_REVIEW, amount: 750, fee: 37.5, total: 787.5, method: usdtTrc },
      { user: users[3], type: OrderType.EXCHANGE, status: OrderStatus.APPROVED, amount: 400, fee: 20, total: 420, method: cashApp },
      { user: users[3], type: OrderType.EXCHANGE, status: OrderStatus.COMPLETED, amount: 1200, fee: 60, total: 1260, method: zelle },
      { user: users[4], type: OrderType.GAME_TOPUP, status: OrderStatus.PENDING_PAYMENT, amount: 50, fee: 2.5, total: 52.5, method: usdtTrc },
      { user: users[4], type: OrderType.GAME_TOPUP, status: OrderStatus.PENDING_REVIEW, amount: 100, fee: 5, total: 105, method: cashApp },
      { user: users[5], type: OrderType.GAME_TOPUP, status: OrderStatus.COMPLETED, amount: 250, fee: 12.5, total: 262.5, method: zelle },
      { user: users[5], type: OrderType.GAME_TOPUP, status: OrderStatus.REJECTED, amount: 75, fee: 3.75, total: 78.75, method: usdtTrc },
    ];

    for (const sample of orderSamples) {
      const order = await prisma.order.create({
        data: {
          userId: sample.user.id,
          type: sample.type,
          paymentMethodId: sample.method.id,
          amount: sample.amount,
          fee: sample.fee,
          total: sample.total,
          rate: sample.method.rate,
          receivedAmount: sample.amount * sample.method.rate,
          status: sample.status,
          adminNote: SEED_MARKER,
          gameId: sample.type === OrderType.GAME_TOPUP ? primaryGame.id : null,
          gameUsername: sample.type === OrderType.GAME_TOPUP ? `${sample.user.username}_player` : null,
          receiveUsername: sample.type === OrderType.EXCHANGE ? 'receiver_demo' : null,
          receiveWalletNumber: sample.type === OrderType.EXCHANGE ? 'WALLET123456' : null,
          transactionReference: `${SEED_MARKER}-${sample.type}-${sample.status}`,
        },
      });

        if (
  sample.status === OrderStatus.COMPLETED ||
  sample.status === OrderStatus.APPROVED
)
        {
        await prisma.transaction.create({
          data: {
            orderId: order.id,
            userId: sample.user.id,
            amount: order.total,
            type: sample.type === OrderType.EXCHANGE ? TransactionType.EXCHANGE_RECEIVED : TransactionType.GAME_PURCHASE,
            status: 'SUCCESS',
            internalNotes: SEED_MARKER,
          },
        });
      }

      if (sample.status === OrderStatus.PENDING_REVIEW) {
        await prisma.proofUpload.create({
          data: {
            userId: sample.user.id,
            orderId: order.id,
            fileUrl: '/uploads/seed/payment-proof-sample.png',
            fileType: 'png',
            referenceNo: `PROOF-${order.id.slice(-6)}`,
            notes: 'Seed payment proof for admin review',
          },
        });
      }
    }
  });

  await seedIfEmpty('Exchange requests', await prisma.exchangeRequest.count(), async () => {
    const exchangeSamples = [
      { user: users[0], status: ExchangeStatus.PENDING_PAYMENT, amount: 200 },
      { user: users[1], status: ExchangeStatus.PENDING_VERIFICATION, amount: 350 },
      { user: users[2], status: ExchangeStatus.APPROVED, amount: 500 },
      { user: users[3], status: ExchangeStatus.REJECTED, amount: 180 },
      { user: users[4], status: ExchangeStatus.CANCELLED, amount: 90 },
    ];

    for (const sample of exchangeSamples) {
      await prisma.exchangeRequest.create({
        data: {
          userId: sample.user.id,
          amount: sample.amount,
          fee: sample.amount * 0.05,
          total: sample.amount * 1.05,
          rate: 1,
          usdtReceived: sample.amount,
          walletAddress: 'TRON_SEED_WALLET_DEMO',
          paymentMethodId: usdtTrc.id,
          status: sample.status,
          approvedAt: sample.status === ExchangeStatus.APPROVED ? new Date() : null,
          rejectedAt: sample.status === ExchangeStatus.REJECTED ? new Date() : null,
          rejectionReason: sample.status === ExchangeStatus.REJECTED ? 'Invalid proof of payment' : null,
          internalNotes: SEED_MARKER,
        },
      });
    }
  });

  await seedIfEmpty('Game point orders', await prisma.gamePointOrder.count(), async () => {
    const gameOrderSamples = [
      { user: users[0], status: GamePointOrderStatus.PENDING, points: 500 },
      { user: users[1], status: GamePointOrderStatus.PAYMENT_RECEIVED, points: 1000 },
      { user: users[2], status: GamePointOrderStatus.PENDING_FULFILLMENT, points: 2000 },
      { user: users[3], status: GamePointOrderStatus.FULFILLED, points: 1500 },
      { user: users[4], status: GamePointOrderStatus.FAILED, points: 800 },
      { user: users[5], status: GamePointOrderStatus.CANCELLED, points: 300 },
    ];

    for (const sample of gameOrderSamples) {
      await prisma.gamePointOrder.create({
        data: {
          userId: sample.user.id,
          gameId: primaryGame.id,
          points: sample.points,
          pricePerPoint: 0.01,
          totalPrice: sample.points * 0.01,
          fee: sample.points * 0.01 * 0.1,
          finalPrice: sample.points * 0.01 * 1.1,
          paymentMethodId: cashApp.id,
          gameUsername: `${sample.user.username}_player`,
          status: sample.status,
          fulfilledAt: sample.status === GamePointOrderStatus.FULFILLED ? new Date() : null,
          internalNotes: SEED_MARKER,
        },
      });
    }
  });

  await seedIfEmpty('Game ID requests', await prisma.gameIdRequest.count(), async () => {
    await prisma.gameIdRequest.create({
      data: {
        userId: users[0].id,
        gameId: primaryGame.id,
        requestType: 'EMAIL_PASSWORD',
        email: 'user1@example.com',
        password: 'seed-demo-password',
        status: 'PENDING',
      },
    });

    await prisma.gameIdRequest.create({
      data: {
        userId: users[1].id,
        gameId: primaryGame.id,
        requestType: 'GAME_ID',
        gameUsername: 'player_seed_123',
        status: 'PENDING',
      },
    });

    await prisma.gameIdRequest.create({
      data: {
        userId: users[2].id,
        gameId: primaryGame.id,
        requestType: 'EMAIL_PASSWORD',
        email: 'user3@example.com',
        password: 'seed-demo-password',
        status: 'APPROVED',
        response: 'Your Game ID is: SEED12345',
        respondedAt: new Date(),
        respondedBy: admin.id,
      },
    });
  });

  await seedIfEmpty('Merchant QR codes', await prisma.merchantQRCode.count(), async () => {
    const approvedMerchants = seededMerchants.filter((m) => m.approved);
    await prisma.merchantQRCode.create({
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
        userId: approvedMerchants[1].user.id,
        imageUrl: '/uploads/seed/merchant-qr-disabled.png',
        assignedBy: admin.id,
        active: false,
        disabledAt: new Date(),
      },
    });
  });

  await seedIfEmpty('Transaction reports', await prisma.transactionReport.count(), async () => {
    const reportSamples = [
      { merchant: seededMerchants[0], status: ReportStatus.PENDING_REVIEW, totalTransactions: 42, totalAmount: 4200 },
      { merchant: seededMerchants[1], status: ReportStatus.APPROVED, totalTransactions: 18, totalAmount: 1800 },
      { merchant: seededMerchants[2], status: ReportStatus.REJECTED, totalTransactions: 7, totalAmount: 700 },
    ];

    for (const sample of reportSamples) {
      await prisma.transactionReport.create({
        data: {
          userId: sample.merchant.user.id,
          transactionDate: new Date(Date.now() - 86400000),
          totalTransactions: sample.totalTransactions,
          totalAmount: sample.totalAmount,
          proofImage: '/uploads/seed/transaction-report-proof.png',
          notes: `${SEED_MARKER} daily sales report`,
          status: sample.status,
          reviewedAt: sample.status !== ReportStatus.PENDING_REVIEW ? new Date() : null,
          reviewedBy: sample.status !== ReportStatus.PENDING_REVIEW ? admin.id : null,
          rejectionReason: sample.status === ReportStatus.REJECTED ? 'Totals do not match proof' : null,
        },
      });
    }
  });

  await seedIfEmpty('Deposits', await prisma.deposit.count(), async () => {
    const depositSamples = [
      { merchant: seededMerchants[0], type: DepositType.INITIAL, status: DepositStatus.PENDING, amount: 1000 },
      { merchant: seededMerchants[0], type: DepositType.ADDITIONAL, status: DepositStatus.APPROVED, amount: 500 },
      { merchant: seededMerchants[1], type: DepositType.INITIAL, status: DepositStatus.FROZEN, amount: 750 },
      { merchant: seededMerchants[1], type: DepositType.ADJUSTMENT, status: DepositStatus.RELEASED, amount: 200 },
      { merchant: seededMerchants[2], type: DepositType.WITHDRAWAL, status: DepositStatus.REJECTED, amount: 300 },
    ];

    for (const sample of depositSamples) {
      await prisma.deposit.create({
        data: {
          userId: sample.merchant.user.id,
          amount: sample.amount,
          type: sample.type,
          status: sample.status,
          requiredDeposit: sample.type === DepositType.INITIAL ? sample.amount : 0,
          notes: `${SEED_MARKER} ${sample.type} deposit`,
          adjustedBy: sample.status === DepositStatus.APPROVED || sample.status === DepositStatus.FROZEN || sample.status === DepositStatus.RELEASED ? admin.id : null,
          adjustedAt: sample.status === DepositStatus.APPROVED || sample.status === DepositStatus.FROZEN || sample.status === DepositStatus.RELEASED ? new Date() : null,
          frozenAt: sample.status === DepositStatus.FROZEN ? new Date() : null,
          frozenBy: sample.status === DepositStatus.FROZEN ? admin.id : null,
          releasedAt: sample.status === DepositStatus.RELEASED ? new Date() : null,
          releasedBy: sample.status === DepositStatus.RELEASED ? admin.id : null,
        },
      });
    }
  });

  await seedIfEmpty('Payout requests', await prisma.payoutRequest.count(), async () => {
    const payoutSamples = [
      { merchant: seededMerchants[0], status: PayoutStatus.PENDING, amount: 250 },
      { merchant: seededMerchants[0], status: PayoutStatus.UNDER_REVIEW, amount: 400 },
      { merchant: seededMerchants[1], status: PayoutStatus.APPROVED, amount: 600 },
      { merchant: seededMerchants[1], status: PayoutStatus.PAID, amount: 350 },
      { merchant: seededMerchants[2], status: PayoutStatus.REJECTED, amount: 150 },
    ];

    for (const sample of payoutSamples) {
      await prisma.payoutRequest.create({
        data: {
          userId: sample.merchant.user.id,
          amount: sample.amount,
          walletAddress: 'TRON_PAYOUT_WALLET_SEED',
          walletNetwork: 'TRC20',
          qrCodeImage: '/uploads/seed/payout-qr.png',
          remarks: `${SEED_MARKER} merchant payout request`,
          status: sample.status,
          approvedAt: sample.status === PayoutStatus.APPROVED || sample.status === PayoutStatus.PAID ? new Date() : null,
          approvedBy: sample.status === PayoutStatus.APPROVED || sample.status === PayoutStatus.PAID ? admin.id : null,
          rejectedAt: sample.status === PayoutStatus.REJECTED ? new Date() : null,
          rejectedBy: sample.status === PayoutStatus.REJECTED ? admin.id : null,
          rejectionReason: sample.status === PayoutStatus.REJECTED ? 'Insufficient merchant balance' : null,
          paidAt: sample.status === PayoutStatus.PAID ? new Date() : null,
          transactionHash: sample.status === PayoutStatus.PAID ? '0xseedtxhash123456789abcdef' : null,
          paidBy: sample.status === PayoutStatus.PAID ? admin.id : null,
        },
      });
    }
  });

  await seedIfEmpty('Wallet transactions', await prisma.walletTransaction.count(), async () => {
    for (const user of users.slice(0, 3)) {
      const wallet = await prisma.wallet.findUnique({
        where: {
          userId_paymentMethodId: {
            userId: user.id,
            paymentMethodId: usdtTrc.id,
          },
        },
      });
      if (!wallet) continue;

      const txTypes = [TransactionType.DEPOSIT, TransactionType.WITHDRAWAL, TransactionType.FEE];
      let balance = wallet.balance;
      for (const txType of txTypes) {
        const amount = txType === TransactionType.DEPOSIT ? 100 : 25;
        const signedAmount = txType === TransactionType.DEPOSIT ? amount : -amount;
        await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: txType,
            amount: signedAmount,
            balanceBefore: balance,
            balanceAfter: balance + signedAmount,
            notes: `${SEED_MARKER} ${txType}`,
          },
        });
        balance += signedAmount;
      }
    }
  });

  await seedIfEmpty('Admin logs', await prisma.adminLog.count(), async () => {
    await prisma.adminLog.createMany({
      data: [
        { adminId: admin.id, action: 'APPROVE_MERCHANT', details: 'Approved merchant1' },
        { adminId: admin.id, action: 'REVIEW_ORDER', details: 'Reviewed pending exchange order' },
        { adminId: staff.id, action: 'UPDATE_USER_ROLE', details: 'Updated user role to STAFF_ADMIN' },
        { adminId: admin.id, action: 'APPROVE_DEPOSIT', details: 'Approved merchant deposit' },
        { adminId: admin.id, action: 'MARK_PAYOUT_PAID', details: 'Marked payout as paid' },
      ],
    });
  });

  await seedIfEmpty('Audit logs', await prisma.auditLog.count({ where: { action: { startsWith: 'SEED_' } } }), async () => {
    await prisma.auditLog.createMany({
      data: [
        { userId: admin.id, userEmail: admin.email, action: 'SEED_ADMIN_LOGIN', resource: 'USER', resourceId: admin.id, result: 'SUCCESS', ipAddress: '127.0.0.1' },
        { userId: users[0].id, userEmail: users[0].email, action: 'SEED_CREATE_ORDER', resource: 'ORDER', result: 'SUCCESS' },
        { userId: seededMerchants[0].user.id, userEmail: seededMerchants[0].user.email, action: 'SEED_SUBMIT_REPORT', resource: 'TRANSACTION_REPORT', result: 'SUCCESS' },
      ],
    });
  });

  // ---------------- USER NOTIFICATIONS & PREFERENCES ----------------
  for (const user of [...users.slice(0, 3), seededMerchants[0].user]) {
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }

  await seedIfEmpty('Notifications', await prisma.notification.count(), async () => {
    const notificationSamples = [
      { user: users[0], title: 'Welcome to SettlerPay', message: 'Your account has been successfully created.', type: NotificationType.SUCCESS },
      { user: users[1], title: 'Order Pending Review', message: 'Your deposit is being reviewed by an admin.', type: NotificationType.ORDER_UPDATE, referenceType: 'ORDER' },
      { user: users[2], title: 'Exchange Approved', message: 'Your exchange request was approved.', type: NotificationType.TRANSACTION },
      { user: seededMerchants[0].user, title: 'Merchant Approved', message: 'Your merchant account is now active.', type: NotificationType.SUCCESS, referenceType: 'MERCHANT_INFO' },
      { user: seededMerchants[1].user, title: 'Application Pending', message: 'Your merchant application is under review.', type: NotificationType.WARNING },
      { user: users[3], title: 'Payment Required', message: 'Please upload proof of payment to continue.', type: NotificationType.INFO },
    ];

    for (const sample of notificationSamples) {
      await prisma.notification.create({
        data: {
          userId: sample.user.id,
          title: sample.title,
          message: sample.message,
          type: sample.type,
          referenceType: sample.referenceType,
        },
      });
    }
  });

  await seedIfEmpty('Devices', await prisma.device.count(), async () => {
    for (const user of users.slice(0, 2)) {
      await prisma.device.create({
        data: {
          userId: user.id,
          deviceInfo: JSON.stringify({
            name: 'Chrome on Windows',
            browser: 'Chrome',
            os: 'Windows',
            ip: '127.0.0.1',
          }),
        },
      });
    }
  });

  console.log('');
  console.log('✅ Seed completed successfully');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Admin:  admin@settlerpay.com / admin123');
  console.log('  Staff:  staff@settlerpay.com / staff123');
  console.log('  Users:  user1@example.com - user6@example.com / password123');
  console.log('  Merchants: merchant1@example.com - merchant3@example.com / password123');
  console.log('');
  console.log('Admin panel coverage:');
  console.log('  Orders (all statuses & types), Exchange requests, Game point orders');
  console.log('  Merchants (approved + pending), Merchant QRs, Transaction reports');
  console.log('  Deposits (all statuses), Payout requests (all statuses)');
  console.log('  Payment methods, Payment accounts, Exchange rates, Fee settings');
  console.log('  Platform QR codes, Games (incl. inactive), Users (incl. suspended)');
  console.log('  user1-user6 available for Add Merchant (no merchant profile)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    // process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });