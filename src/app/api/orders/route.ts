import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { OrderType, OrderStatus } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const userId = (session.user as any).id;
    const { type, paymentMethodId, amount, gameId, gameUsername, walletAddress } = data;

    // Fetch payment method to get current rate and fee
    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId }
    });

    if (!paymentMethod) {
      return NextResponse.json({ message: "Invalid payment method" }, { status: 400 });
    }

    let fee = 0;
    let total = amount;
    let receivedAmount = 0;

    if (type === OrderType.DEPOSIT) {
      // Deposit: User pays amount + fee, receives amount * rate in game points/wallet
      fee = (amount * paymentMethod.feePercentage) / 100;
      total = amount + fee;
      receivedAmount = amount * paymentMethod.rate;
    } else if (type === OrderType.EXCHANGE) {
      // Exchange: User pays amount from wallet, receives (amount * rate) - fee in USDT
      // Actually, let's follow the prompt's logic: "System calculates: Current exchange rate, Exchange fee, Final USDT amount"
      // Usually, it's (amount * rate) - fee or (amount - fee) * rate.
      // Let's assume: receivedAmount = (amount * rate) - fee_percentage_of_amount? 
      // Prompt says: "USDT rate... Cash App rate...". 
      // Example: Cash App -> USDT Rate = 0.95. 
      // If user exchanges $100 Cash App balance, they get 100 * 0.95 = $95 USDT.
      // If there is also a fee, it would be deducted. 
      // Let's use: receivedAmount = (amount * paymentMethod.rate) * (1 - paymentMethod.feePercentage/100)
      fee = (amount * paymentMethod.rate * paymentMethod.feePercentage) / 100;
      receivedAmount = (amount * paymentMethod.rate) - fee;
      total = amount; // Amount deducted from source wallet
      
      // Check if user has enough balance in the source wallet
      const wallet = await prisma.wallet.findUnique({
        where: {
          userId_paymentMethodId: {
            userId,
            paymentMethodId
          }
        }
      });
      
      if (!wallet || wallet.balance < amount) {
        return NextResponse.json({ message: "Insufficient balance in source wallet" }, { status: 400 });
      }
    }

    const order = await prisma.order.create({
      data: {
        userId,
        type,
        paymentMethodId,
        amount,
        fee,
        total,
        rate: paymentMethod.rate,
        receivedAmount,
        gameId: gameId || null,
        gameUsername: gameUsername || null,
        walletAddress: walletAddress || null,
        status: type === OrderType.DEPOSIT ? OrderStatus.PENDING_PAYMENT : OrderStatus.PENDING_REVIEW,
      },
    });

    // If it's an exchange, we might want to "lock" the balance or deduct it immediately and mark as pending
    if (type === OrderType.EXCHANGE) {
      await prisma.wallet.update({
        where: {
          userId_paymentMethodId: {
            userId,
            paymentMethodId
          }
        },
        data: {
          balance: { decrement: amount }
        }
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error creating order" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { 
      game: true,
      paymentMethod: true
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}
