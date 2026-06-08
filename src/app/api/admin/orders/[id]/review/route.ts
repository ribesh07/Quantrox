import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { OrderType, OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
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

    const oldOrder = await prisma.order.findUnique({
      where: { id },
      include: { paymentMethod: true }
    });

    if (!oldOrder) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote || undefined,
      },
    });

    // Handle Balance Updates
    if (status === OrderStatus.COMPLETED || status === OrderStatus.APPROVED) {
      if (oldOrder.type === OrderType.DEPOSIT) {
        // Increase user's wallet balance for the specific payment method
        await prisma.wallet.upsert({
          where: {
            userId_paymentMethodId: {
              userId: order.userId,
              paymentMethodId: order.paymentMethodId
            }
          },
          update: {
            balance: { increment: order.receivedAmount }
          },
          create: {
            userId: order.userId,
            paymentMethodId: order.paymentMethodId,
            balance: order.receivedAmount
          }
        });
      }

      // Create a transaction record
      await prisma.transaction.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          amount: order.receivedAmount,
          type: order.type,
          status: "SUCCESS",
        },
      });

      // Send notification
      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: `${order.type} Approved`,
          message: `Your ${order.type.toLowerCase()} request #${order.id.slice(-6)} has been approved.`,
        },
      });
    } else if (status === OrderStatus.REJECTED) {
      // If it was an exchange, refund the wallet
      if (oldOrder.type === OrderType.EXCHANGE) {
        await prisma.wallet.update({
          where: {
            userId_paymentMethodId: {
              userId: order.userId,
              paymentMethodId: order.paymentMethodId
            }
          },
          data: {
            balance: { increment: order.amount }
          }
        });
      }

      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: `${order.type} Rejected`,
          message: `Your ${order.type.toLowerCase()} request #${order.id.slice(-6)} was rejected. Reason: ${adminNote || "No reason provided."}`,
        },
      });
    }

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: (session.user as any).id,
        action: `REVIEW_ORDER_${status}`,
        details: `Reviewed order #${id} as ${status}`,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error updating order status" }, { status: 500 });
  }
}
