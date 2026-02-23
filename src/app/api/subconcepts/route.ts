// app/api/subconcepts/route.ts
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
    const chapterId = searchParams.get("chapterId");

    if (!chapterId) {
      return NextResponse.json({ error: "chapterId is required" }, { status: 400 });
    }

    const subconcepts = await prisma.subconcept.findMany({
      where: { chapterId: parseInt(chapterId) },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        chapterId: true,
      },
    });

    return NextResponse.json(subconcepts);
  } catch (error) {
    console.error("GET /api/subconcepts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}