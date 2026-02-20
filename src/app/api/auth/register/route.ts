// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { sendVerificationEmail } from "../../../../lib/email";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password, role, phone, grade, fullName, subject } = body;

    // --- Role Validation Start ---
    const allowedRoles = ["student", "teacher", "question_setter"] as const;
    type AllowedRole = typeof allowedRoles[number];

    if (!allowedRoles.includes(role as AllowedRole)) {
      return NextResponse.json(
        { error: "Invalid role selected" }, 
        { status: 400 }
      );
    }
    // --- Role Validation End ---

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with conditional nested details
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
        phone,
        grade: role === "student" ? grade : null,
        ...(role === "question_setter" && {
          questionSetterDetails: {
            create: {
              fullName,
              subject,
            },
          },
        }),
        ...(role === "teacher" && {
          teacherDetails: {
            create: {
              fullName,
              subject,
            },
          },
        }),
        ...(role === "student" && {
          studentDetails: {
            create: {
              grade,
            },
          },
        }),
      },
    });

    // Create email verification token
    const token = randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    });

    // Send verification email
    await sendVerificationEmail(email, token);

    return NextResponse.json(
      { message: "User created successfully. Please check your email to verify your account." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}