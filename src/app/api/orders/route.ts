import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const userId = (session.user as any).id;

    const order = await prisma.order.create({
      data: {
        userId,
        type: data.type,
        amount: data.amount,
        rate: data.rate,
        total: data.total,
        gameId: data.gameId || null,
        gameUsername: data.gameUsername || null,
        status: "PENDING_PAYMENT",
      },
    });

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
    include: { game: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}
