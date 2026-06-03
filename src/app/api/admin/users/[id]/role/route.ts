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

  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Only Super Admins can change roles" }, { status: 401 });
  }

  try {
    const { role } = await req.json();
    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ message: "Error updating role" }, { status: 500 });
  }
}
