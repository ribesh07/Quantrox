import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { OrderStatus } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = (formData.get("file") || formData.get("screenshot")) as File;
    const note = formData.get("note") as string;

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${id}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "proofs");
    
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const imageUrl = `/uploads/proofs/${filename}`;

    const order = await prisma.order.update({
      where: { id },
      data: {
        screenshot: imageUrl,
        adminNote: note || null,
        status: OrderStatus.PENDING_REVIEW,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error uploading proof" }, { status: 500 });
  }
}
