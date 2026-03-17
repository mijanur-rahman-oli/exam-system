import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const exams = await prisma.exam.findMany({
      include: { subject: true, creator: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(exams);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { examName, description, subjectId, gradeLevel, duration,
            scheduleTime, retakeAllowed, isActive, questions } = body;

    if (!examName || !subjectId || !duration) {
      return NextResponse.json({ error: "examName, subjectId, and duration are required" }, { status: 400 });
    }

    const totalMarks = Array.isArray(questions)
      ? questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0)
      : 0;

    const exam = await prisma.exam.create({
      data: {
        examName,
        description,
        subjectId: parseInt(subjectId),
        gradeLevel,
        duration: parseInt(duration),
        totalMarks,
        scheduleTime: scheduleTime ? new Date(scheduleTime) : null,
        retakeAllowed: retakeAllowed ?? false,
        isActive: isActive ?? false,
        createdBy: parseInt(session.user.id),
        examQuestions: Array.isArray(questions) ? {
          create: questions.map((q: any) => ({
            questionId: q.questionId,
            marks: q.marks || 1,
          })),
        } : undefined,
      },
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error("Create exam error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
