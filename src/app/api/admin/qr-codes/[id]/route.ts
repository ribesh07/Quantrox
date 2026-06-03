import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";

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
    const data = await req.json();
    const qr = await prisma.qRCode.update({
      where: { id },
      data,
    });
    return NextResponse.json(qr);
  } catch (error) {
    return NextResponse.json({ message: "Error updating QR" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role === "USER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const qr = await prisma.qRCode.findUnique({
      where: { id },
    });

    if (qr) {
      // Delete file if exists
      const filePath = path.join(process.cwd(), "public", qr.image);
      try {
        await unlink(filePath);
      } catch (err) {
        console.error("Failed to delete file", err);
      }
    }

    await prisma.qRCode.delete({
      where: { id },
    });
    return NextResponse.json({ message: "QR deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting QR" }, { status: 500 });
  }
}
