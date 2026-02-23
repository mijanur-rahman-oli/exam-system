// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isVerified: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Admin get users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { username, email, password, role, phone, grade, fullName, subject } = body;

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Check for existing user
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User with this username or email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role-specific details
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role,
        phone: phone || null,
        grade: role === "student" ? grade : null,
        isVerified: true, // Admin-created users are auto-verified
        ...(role === "question_setter" && {
          questionSetterDetails: {
            create: {
              fullName: fullName || username,
              subject: subject || null,
            },
          },
        }),
        ...(role === "teacher" && {
          teacherDetails: {
            create: {
              fullName: fullName || username,
              subject: subject || null,
            },
          },
        }),
        ...(role === "student" && {
          studentDetails: {
            create: {
              grade: grade || null,
            },
          },
        }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isVerified: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Admin create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}