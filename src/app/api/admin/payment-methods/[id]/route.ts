import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role === "USER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const paymentMethod = await prisma.paymentMethod.findUnique({
    where: { id },
  });

  if (!paymentMethod) {
    return NextResponse.json({ message: "Payment method not found" }, { status: 404 });
  }

  return NextResponse.json(paymentMethod);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role === "USER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, category, feePercentage, rate, active, minAmount, maxAmount, details, qrCode } = body;

    const paymentMethod = await prisma.paymentMethod.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(feePercentage !== undefined && { feePercentage: parseFloat(feePercentage) }),
        ...(rate !== undefined && { rate: parseFloat(rate) }),
        ...(active !== undefined && { active }),
        ...(minAmount !== undefined && { minAmount: parseFloat(minAmount) }),
        ...(maxAmount !== undefined && { maxAmount: parseFloat(maxAmount) }),
        ...(details !== undefined && { details }),
        ...(qrCode !== undefined && { qrCode }),
      },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: (session.user as any).id,
        action: "UPDATE_PAYMENT_METHOD",
        details: `Updated payment method: ${paymentMethod.name}`,
      },
    });

    return NextResponse.json(paymentMethod);
  } catch (error) {
    console.error("Error updating payment method:", error);
    return NextResponse.json({ message: "Error updating payment method" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role === "USER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const paymentMethod = await prisma.paymentMethod.delete({
      where: { id },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: (session.user as any).id,
        action: "DELETE_PAYMENT_METHOD",
        details: `Deleted payment method: ${paymentMethod.name}`,
      },
    });

    return NextResponse.json({ message: "Payment method deleted" });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json({ message: "Error deleting payment method" }, { status: 500 });
  }
}
