// app/api/questions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

// ── GET /api/questions/[id] ───────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        subject:    { select: { id: true, name: true } },
        chapter:    { select: { id: true, name: true } },
        subconcept: { select: { id: true, name: true } },
        creator:    { select: { id: true, username: true } },
      },
    });

    if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(question);
  } catch (error) {
    console.error("GET /api/questions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PUT /api/questions/[id] — update from Edit Question page ─────────────────
// Accepts JSON (the edit page sends JSON, not FormData)
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    // Ownership check
    const existing = await prisma.question.findUnique({
      where:  { id },
      select: { createdBy: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.createdBy !== parseInt(session.user.id) && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // The edit page sends flat fields: subjectId, chapterId, question,
    // optionA/B/C/D, correctAnswer, explanation, marks, difficulty
    const {
      subjectId, chapterId, subconceptId, gradeLevel,
      question, optionA, optionB, optionC, optionD,
      correctAnswer, isMultipleAnswer, explanation,
      marks, difficulty,
    } = body;

    const updated = await prisma.question.update({
      where: { id },
      data: {
        subjectId:        parseInt(subjectId),
        chapterId:        chapterId    ? parseInt(chapterId)    : null,
        subconceptId:     subconceptId ? parseInt(subconceptId) : null,
        gradeLevel:       gradeLevel   || null,
        question,
        optionA:          optionA,
        optionB:          optionB,
        optionC:          optionC  || null,
        optionD:          optionD  || null,
        correctAnswer,
        isMultipleAnswer: isMultipleAnswer ?? false,
        explanation:      explanation || null,
        marks:            parseInt(marks) || 1,
        difficulty:       difficulty ?? "medium",
      },
      include: {
        subject:    { select: { id: true, name: true } },
        chapter:    { select: { id: true, name: true } },
        subconcept: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/questions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── DELETE /api/questions/[id] ────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    // Ownership check
    const existing = await prisma.question.findUnique({
      where:  { id },
      select: { createdBy: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.createdBy !== parseInt(session.user.id) && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Remove from any exams first to avoid FK violations
    await prisma.examQuestion.deleteMany({ where: { questionId: id } });
    await prisma.examAnswer.deleteMany({   where: { questionId: id } });
    await prisma.question.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/questions/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}