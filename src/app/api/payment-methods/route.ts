import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category"); // DEPOSIT or EXCHANGE

  const where: any = { active: true };
  if (category) {
    where.OR = [
      { category: category },
      { category: "BOTH" }
    ];
  }

  const paymentMethods = await prisma.paymentMethod.findMany({
    where,
    orderBy: { name: 'asc' }
  });

  return NextResponse.json(paymentMethods);
}
