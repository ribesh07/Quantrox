import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role === "USER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(games);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role === "USER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const game = await prisma.game.create({
      data: {
        name: data.name,
        logo: data.logo,
        buyRate: data.buyRate,
        sellRate: data.sellRate,
      },
    });
    return NextResponse.json(game);
  } catch (error) {
    return NextResponse.json({ message: "Error creating game" }, { status: 500 });
  }
}
