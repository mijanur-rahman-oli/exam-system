import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "teacher" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teacherId = parseInt(session.user.id);

    const [totalExams, totalAttempts, uniqueStudents, totalQuestions] = await Promise.all([
      prisma.exam.count({ where: { createdBy: teacherId } }),
      prisma.examAttempt.count({
        where: { exam: { createdBy: teacherId }, isCompleted: true },
      }),
      prisma.examAttempt.groupBy({
        by: ["studentId"],
        where: { exam: { createdBy: teacherId }, isCompleted: true },
      }).then(r => r.length),
      prisma.question.count({ where: { createdBy: teacherId } }),
    ]);

    return NextResponse.json({ totalExams, totalAttempts, uniqueStudents, totalQuestions });
  } catch (error) {
    console.error("GET /api/teacher/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}