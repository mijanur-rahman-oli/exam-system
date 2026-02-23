// app/api/exams/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
    }

    // Check if exam exists
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        examQuestions: true,
        examAttempts: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Delete in transaction to ensure data integrity
    await prisma.$transaction(async (tx) => {
      // Delete exam questions first
      await tx.examQuestion.deleteMany({
        where: { examId: id },
      });

      // Delete exam attempts and their answers
      const attempts = await tx.examAttempt.findMany({
        where: { examId: id },
        select: { id: true },
      });

      if (attempts.length > 0) {
        const attemptIds = attempts.map(a => a.id);
        
        // Delete exam answers
        await tx.examAnswer.deleteMany({
          where: { attemptId: { in: attemptIds } },
        });

        // Delete exam attempts
        await tx.examAttempt.deleteMany({
          where: { examId: id },
        });
      }

      // Finally delete the exam
      await tx.exam.delete({
        where: { id },
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: "Exam deleted successfully" 
    });
  } catch (error) {
    console.error("DELETE /api/exams/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete exam. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
    }

    const body = await req.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean" },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.update({
      where: { id },
      data: { isActive },
      include: {
        subject: { select: { name: true } },
      },
    });

    return NextResponse.json(exam);
  } catch (error) {
    console.error("PATCH /api/exams/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update exam status" },
      { status: 500 }
    );
  }
}