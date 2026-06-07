import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export const dynamic = "force-dynamic";
export async function GET() {
  const qrCodes = await prisma.qRCode.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(qrCodes);
}
