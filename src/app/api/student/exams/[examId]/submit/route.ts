// src/app/api/student/exams/[examId]/submit/route.ts
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
    const { attemptId, answers } = await req.json();

    // Get exam attempt
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            examQuestions: {
              include: {
                question: true,
              },
            },
          },
        },
      },
    });

    if (!attempt || attempt.studentId !== studentId) {
      return NextResponse.json({ error: "Invalid attempt" }, { status: 404 });
    }

    if (attempt.isCompleted) {
      return NextResponse.json({ error: "Exam already submitted" }, { status: 400 });
    }

    // Calculate results
    let totalScore = 0;
    const results = [];

    for (const eq of attempt.exam.examQuestions) {
      const selectedAnswer = answers[eq.questionId];
      const isCorrect = selectedAnswer === eq.question.correctAnswer;
      const marksObtained = isCorrect ? eq.marks : 0;
      
      totalScore += marksObtained;

      results.push({
        examAttemptId: attemptId,
        questionId: eq.questionId,
        selectedAnswer,
        isCorrect,
        marksObtained,
      });
    }

    // Save results and update attempt
    await prisma.$transaction([
      prisma.examResult.createMany({
        data: results,
      }),
      prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
          score: totalScore,
          submittedAt: new Date(),
          isCompleted: true,
        },
      }),
    ]);

    // Get total marks
    const totalMarks = attempt.exam.examQuestions.reduce(
      (sum, eq) => sum + eq.marks,
      0
    );

    // Updated return statement with safe division and rounding
    return NextResponse.json({
      resultId: attemptId,
      score: totalScore,
      totalMarks,
      percentage: totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0,
    });
    
  } catch (error) {
    console.error("Submit exam error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}