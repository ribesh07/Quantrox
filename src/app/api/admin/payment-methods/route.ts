import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role === "USER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const paymentMethods = await prisma.paymentMethod.findMany({
    orderBy: { name: 'asc' }
  });
  return NextResponse.json(paymentMethods);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role === "USER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, category, feePercentage, rate, active, minAmount, maxAmount, details, qrCode } = body;

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        name,
        category,
        feePercentage: parseFloat(feePercentage),
        rate: parseFloat(rate),
        active: active ?? true,
        minAmount: parseFloat(minAmount || 0),
        maxAmount: parseFloat(maxAmount || 1000000),
        details,
        qrCode,
      },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: (session.user as any).id,
        action: "CREATE_PAYMENT_METHOD",
        details: `Created payment method: ${name}`,
      },
    });

    return NextResponse.json(paymentMethod);
  } catch (error) {
    console.error("Error creating payment method:", error);
    return NextResponse.json({ message: "Error creating payment method" }, { status: 500 });
  }
}
