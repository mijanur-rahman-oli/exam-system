// app/api/subjects/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subjects = await prisma.subject.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            chapters: true,
            questions: true,
            exams: true,
          }
        }
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(subjects);
  } catch (error) {
    console.error("GET /api/subjects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check for duplicate
    const existing = await prisma.subject.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A subject with this name already exists" },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error("POST /api/subjects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}