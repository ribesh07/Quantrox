import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password } = registerSchema.parse(body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "User created successfully", user: { id: user.id, username: user.username, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ 
      message: "An error occurred during registration. Please ensure your database is connected and migrations have been run.",
    }, { status: 500 });
  }
}
