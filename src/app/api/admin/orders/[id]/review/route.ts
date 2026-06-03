import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role === "USER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { status, adminNote } = await req.json();

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote || undefined,
      },
    });

    // Create a transaction record if completed
    if (status === "COMPLETED") {
      await prisma.transaction.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          amount: order.total,
          status: "SUCCESS",
        },
      });

      // Send notification
      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: "Order Completed",
          message: `Your order #${order.id.slice(-6)} has been approved and completed.`,
        },
      });
    } else if (status === "REJECTED") {
      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: "Order Rejected",
          message: `Your order #${order.id.slice(-6)} was rejected. Reason: ${adminNote || "No reason provided."}`,
        },
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error updating order status" }, { status: 500 });
  }
}
