import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role === "USER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const qrCodes = await prisma.qRCode.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(qrCodes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role === "USER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "qrs");
    
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    const imageUrl = `/uploads/qrs/${filename}`;

    const qr = await prisma.qRCode.create({
      data: {
        image: imageUrl,
        active: true,
      },
    });

    return NextResponse.json(qr);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error uploading QR code" }, { status: 500 });
  }
}
