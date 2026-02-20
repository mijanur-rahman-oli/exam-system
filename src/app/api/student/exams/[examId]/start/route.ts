// src/app/api/student/exams/[examId]/start/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.examId);
    const studentId = parseInt(session.user.id);

    // Check if exam exists and is active
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examQuestions: true,
      },
    });

    if (!exam || !exam.isActive) {
      return NextResponse.json({ error: "Exam not found or inactive" }, { status: 404 });
    }

    // Check if student has already attempted this exam and retake is not allowed
    if (!exam.retakeAllowed) {
      const existingAttempt = await prisma.examAttempt.findFirst({
        where: {
          examId,
          studentId,
          isCompleted: true,
        },
      });

      if (existingAttempt) {
        return NextResponse.json(
          { error: "You have already attempted this exam" },
          { status: 400 }
        );
      }
    }

    // Create exam attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        examId,
        studentId,
        startedAt: new Date(),
      },
    });

    return NextResponse.json({ attemptId: attempt.id });
  } catch (error) {
    console.error("Start exam error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}