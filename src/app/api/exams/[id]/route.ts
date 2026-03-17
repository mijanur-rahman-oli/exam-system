import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const exam = await prisma.exam.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        subject: true,
        examQuestions: { include: { question: true } },
      },
    });

    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    return NextResponse.json(exam);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const exam = await prisma.exam.update({
      where: { id: parseInt(params.id) },
      data: body,
    });

    return NextResponse.json(exam);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = parseInt(params.id);

    // Delete in order: answers → attempts → questions → exam
    await prisma.$transaction(async (tx) => {
      const attempts = await tx.examAttempt.findMany({
        where: { examId: id },
        select: { id: true },
      });
      const attemptIds = attempts.map((a) => a.id);

      if (attemptIds.length > 0) {
        await tx.examAnswer.deleteMany({
          where: { attemptId: { in: attemptIds } },
        });
      }

      await tx.examAttempt.deleteMany({ where: { examId: id } });
      await tx.examQuestion.deleteMany({ where: { examId: id } });
      await tx.exam.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete exam error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
