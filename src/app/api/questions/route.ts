import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit");

    const questions = await prisma.question.findMany({
      include: { subject: { select: { name: true } }, chapter: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: parseInt(limit) } : {}),
    });

    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["question_setter", "admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { subjectId, chapterId, subconceptId, question, optionA, optionB, optionC, optionD, correctAnswer, explanation, marks, difficulty } = body;

    if (!subjectId || !question || !optionA || !optionB || !correctAnswer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newQuestion = await prisma.question.create({
      data: {
        subjectId: parseInt(subjectId),
        chapterId: chapterId ? parseInt(chapterId) : null,
        subconceptId: subconceptId ? parseInt(subconceptId) : null,
        question, optionA, optionB,
        optionC: optionC || null,
        optionD: optionD || null,
        correctAnswer,
        explanation: explanation || null,
        marks: marks ? parseInt(marks) : 1,
        difficulty: difficulty || "medium",
        createdBy: parseInt(session.user.id),
      },
    });

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}