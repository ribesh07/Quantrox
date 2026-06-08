import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

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
    const { rate } = await req.json();
    const updatedRate = await prisma.exchangeRate.update({
      where: { id },
      data: { rate: parseFloat(rate) },
    });
    return NextResponse.json(updatedRate);
  } catch (error) {
    return NextResponse.json({ message: "Error updating rate" }, { status: 500 });
  }
}
