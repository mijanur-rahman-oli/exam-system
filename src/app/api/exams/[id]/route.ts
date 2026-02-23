import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── GET /api/exams ───────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit");

    const where: any =
      session.user.role === "teacher"
        ? { createdBy: parseInt(session.user.id) }
        : {};

    const exams = await prisma.exam.findMany({
      where,
      include: {
        subject:      { select: { name: true } },
        examQuestions: { select: { id: true, marks: true } },
        _count:        { select: { examQuestions: true, examAttempts: true } },
      },
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: parseInt(limit) } : {}),
    });

    return NextResponse.json(exams);
  } catch (err) {
    console.error("[GET /api/exams]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST /api/exams ──────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["teacher", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      examName, gradeLevel, subjectId,
      duration, scheduleTime, retakeAllowed, isActive,
      questions, // [{ questionId, marks }]
    } = body;

    // Validate required fields
    if (!examName?.trim())  return NextResponse.json({ error: "Exam name is required" },   { status: 400 });
    if (!subjectId)         return NextResponse.json({ error: "Subject is required" },      { status: 400 });
    if (!duration || duration < 5) return NextResponse.json({ error: "Duration must be at least 5 minutes" }, { status: 400 });
    if (!questions?.length) return NextResponse.json({ error: "Select at least one question" }, { status: 400 });

    // Calculate total marks from selected questions
    const totalMarks = (questions as { questionId: number; marks: number }[])
      .reduce((sum, q) => sum + (q.marks || 1), 0);

    const exam = await prisma.exam.create({
      data: {
        examName:     examName.trim(),
        subjectId:    parseInt(subjectId),
        gradeLevel:   gradeLevel || null,
        duration:     parseInt(duration),
        totalMarks,
        scheduleTime: scheduleTime ? new Date(scheduleTime) : null,
        retakeAllowed: Boolean(retakeAllowed),
        isActive:     Boolean(isActive),
        createdBy:    parseInt(session.user.id),
        examQuestions: {
          create: (questions as { questionId: number; marks: number }[]).map((q) => ({
            questionId: q.questionId,
            marks:      q.marks || 1,
          })),
        },
      },
      include: {
        subject:       { select: { name: true } },
        examQuestions: { select: { id: true } },
      },
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/exams]", err);
    let message = "Internal server error";
    if (err?.code === "P2003") message = "Invalid subjectId or questionId — record not found";
    if (err?.code === "P2002") message = "Duplicate exam question entry";
    return NextResponse.json({ error: message, detail: err?.message }, { status: 500 });
  }
}