import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const question = await prisma.question.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        subject:    { select: { name: true } },
        chapter:    { select: { name: true } },
        subconcept: { select: { name: true } },
      },
    });

    if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(question);
  } catch (err) {
    console.error("[GET /api/questions/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["question_setter", "admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = parseInt(params.id);

    // Check ownership (admin can delete any)
    const question = await prisma.question.findUnique({ where: { id }, select: { createdBy: true } });
    if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (session.user.role !== "admin" && question.createdBy !== parseInt(session.user.id)) {
      return NextResponse.json({ error: "You can only delete your own questions" }, { status: 403 });
    }

    // Remove from exam_questions first to avoid FK violation
    await prisma.examQuestion.deleteMany({ where: { questionId: id } });
    await prisma.question.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/questions/[id]]", err);
    return NextResponse.json({ error: "Delete failed", detail: err?.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = parseInt(params.id);
    const body = await req.json();

    const question = await prisma.question.update({
      where: { id },
      data: {
        question:     body.question,
        optionA:      body.optionA,
        optionB:      body.optionB,
        optionC:      body.optionC ?? null,
        optionD:      body.optionD ?? null,
        correctAnswer: body.correctAnswer,
        difficulty:   body.difficulty,
        marks:        body.marks,
      },
    });

    return NextResponse.json(question);
  } catch (err: any) {
    console.error("[PUT /api/questions/[id]]", err);
    return NextResponse.json({ error: "Update failed", detail: err?.message }, { status: 500 });
  }
}