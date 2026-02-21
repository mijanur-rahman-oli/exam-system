import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const question = await prisma.question.findUnique({
      where: { id: parseInt(params.id) },
      include: { subject: true, chapter: true },
    });

    if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(question);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const question = await prisma.question.update({
      where: { id: parseInt(params.id) },
      data: {
        subjectId: parseInt(body.subjectId),
        chapterId: body.chapterId ? parseInt(body.chapterId) : null,
        question: body.question,
        optionA: body.optionA,
        optionB: body.optionB,
        optionC: body.optionC || null,
        optionD: body.optionD || null,
        correctAnswer: body.correctAnswer,
        explanation: body.explanation || null,
        marks: parseInt(body.marks),
        difficulty: body.difficulty,
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.question.delete({ where: { id: parseInt(params.id) } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}