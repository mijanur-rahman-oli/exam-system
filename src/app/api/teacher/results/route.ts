import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "teacher" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teacherId = parseInt(session.user.id);
    const { searchParams } = new URL(req.url);
    const gradeFilter   = searchParams.get("grade");
    const subjectFilter = searchParams.get("subject");
    const examFilter    = searchParams.get("exam");

    const attempts = await prisma.examAttempt.findMany({
      where: {
        isCompleted: true,
        exam: {
          createdBy: teacherId,
          ...(subjectFilter ? { subject: { name: { contains: subjectFilter, mode: "insensitive" } } } : {}),
          ...(examFilter    ? { examName: { contains: examFilter, mode: "insensitive" } } : {}),
        },
        ...(gradeFilter ? {
          student: { studentDetails: { grade: gradeFilter } }
        } : {}),
      },
      include: {
        exam: { include: { subject: { select: { name: true } } } },
        student: {
          select: {
            username: true,
            studentDetails: { select: { grade: true } },
          },
        },
      },
      orderBy: [
        { student: { studentDetails: { grade: "asc" } } },
        { student: { username: "asc" } },
        { submittedAt: "desc" },
      ],
    });

    const results = attempts.map(a => ({
      id:           a.id,
      studentId:    a.studentId,
      studentName:  a.student.username,
      studentGrade: a.student.studentDetails?.grade ?? null,
      examName:     a.exam.examName,
      subjectName:  a.exam.subject.name,
      score:        a.score,
      submittedAt:  a.submittedAt,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET /api/teacher/results error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}