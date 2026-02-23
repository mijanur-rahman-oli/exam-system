// app/api/chapters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
    }

    const chapters = await prisma.chapter.findMany({
      where: { subjectId: parseInt(subjectId) },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        subjectId: true,
      },
    });

    return NextResponse.json(chapters);
  } catch (error) {
    console.error("GET /api/chapters error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}