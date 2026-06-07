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

  const rates = await prisma.exchangeRate.findMany();
  return NextResponse.json(rates);
}
