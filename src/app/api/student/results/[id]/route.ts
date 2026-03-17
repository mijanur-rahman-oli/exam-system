import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") ?? "10");

    const attempts = await prisma.examAttempt.findMany({
      where: { studentId: parseInt(session.user.id), isCompleted: true },
      include: {
        exam: { select: { examName: true, totalMarks: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: limit,
    });

    const results = attempts.map((a) => ({
      id: a.id,
      examName: a.exam.examName,
      score: a.exam.totalMarks && a.exam.totalMarks > 0
        ? Math.round(((a.score ?? 0) / a.exam.totalMarks) * 100)
        : a.score ?? 0,
      submittedAt: a.submittedAt,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Recent results error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}