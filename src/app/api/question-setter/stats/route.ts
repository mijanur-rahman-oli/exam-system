import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "question_setter") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const createdBy = parseInt(session.user.id);

    const [totalQuestions, easyCount, mediumCount, hardCount] = await Promise.all([
      prisma.question.count({ where: { createdBy } }),
      prisma.question.count({ where: { createdBy, difficulty: "easy" } }),
      prisma.question.count({ where: { createdBy, difficulty: "medium" } }),
      prisma.question.count({ where: { createdBy, difficulty: "hard" } }),
    ]);

    return NextResponse.json({ totalQuestions, easyCount, mediumCount, hardCount });
  } catch (error) {
    console.error("QS stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}