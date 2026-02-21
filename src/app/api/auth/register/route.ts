import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";

const allowedRoles = ["student", "teacher", "question_setter"] as const;
type AllowedRole = typeof allowedRoles[number];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password, role, phone, grade, fullName, subject } = body;

    if (!allowedRoles.includes(role as AllowedRole)) {
      return NextResponse.json({ error: "Invalid role selected" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username, email,
        password: hashedPassword,
        role, phone,
        isVerified: true, // set false when SMTP is configured
        grade: role === "student" ? grade : null,
        ...(role === "question_setter" && {
          questionSetterDetails: { create: { fullName: fullName || "", subject } },
        }),
        ...(role === "teacher" && {
          teacherDetails: { create: { fullName: fullName || "", subject } },
        }),
        ...(role === "student" && {
          studentDetails: { create: { grade } },
        }),
      },
    });

    const token = randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await prisma.emailVerificationToken.create({
      data: { userId: user.id, token, expires },
    });

    try {
      await sendVerificationEmail(email, token);
    } catch (emailError) {
      console.error("Verification email failed (user still created):", emailError);
    }

    return NextResponse.json(
      { message: "Account created successfully. You can now log in." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}