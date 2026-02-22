import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

async function saveFile(file: File, dir: string): Promise<string> {
  const uploadDir = join(process.cwd(), "public", "uploads", dir);
  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await writeFile(join(uploadDir, filename), buffer);
  return `/uploads/${dir}/${filename}`;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit");
    const subjectId = searchParams.get("subjectId");
    const chapterId = searchParams.get("chapterId");
    const difficulty = searchParams.get("difficulty");

    const where: any = {};
    if (subjectId) where.subjectId = parseInt(subjectId);
    if (chapterId) where.chapterId = parseInt(chapterId);
    if (difficulty) where.difficulty = difficulty;

    const questions = await prisma.question.findMany({
      where,
      include: {
        subject: { select: { name: true } },
        chapter: { select: { name: true } },
        subconcept: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: parseInt(limit) } : {}),
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("GET /api/questions error:", error);
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

    const contentType = req.headers.get("content-type") ?? "";

    // ── Handle multipart/form-data (with images) ──────────────────────────
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      const subjectId = formData.get("subjectId") as string;
      const chapterId = formData.get("chapterId") as string;
      const subconceptId = formData.get("subconceptId") as string | null;
      const gradeLevel = formData.get("gradeLevel") as string | null;
      const questionText = formData.get("question") as string;
      const difficulty = (formData.get("difficulty") as string) || "medium";
      const marks = parseInt((formData.get("marks") as string) || "1");
      const isMultipleAnswer = formData.get("isMultipleAnswer") === "true";
      const optionsRaw = formData.get("options") as string;

      if (!subjectId || !chapterId || !questionText) {
        return NextResponse.json(
          { error: "subjectId, chapterId, and question are required" },
          { status: 400 }
        );
      }

      // Save question image
      let questionImageUrl: string | null = null;
      const questionImage = formData.get("questionImage") as File | null;
      if (questionImage && questionImage.size > 0) {
        questionImageUrl = await saveFile(questionImage, "question-images");
      }

      // Save solution PDF
      let solutionPdfUrl: string | null = null;
      const solutionPdf = formData.get("solutionPdf") as File | null;
      if (solutionPdf && solutionPdf.size > 0) {
        solutionPdfUrl = await saveFile(solutionPdf, "solution-pdfs");
      }

      // Parse options JSON
      let options: { text: string; isCorrect: boolean }[] = [];
      try {
        options = JSON.parse(optionsRaw || "[]");
      } catch {
        return NextResponse.json({ error: "Invalid options format" }, { status: 400 });
      }

      // Save option images
      const optionImageUrls: (string | null)[] = options.map(() => null);
      for (let i = 0; i < options.length; i++) {
        const optImg = formData.get(`optionImage_${i}`) as File | null;
        if (optImg && optImg.size > 0) {
          optionImageUrls[i] = await saveFile(optImg, "option-images");
        }
      }

      // Build correct answer string (for single-answer questions, store the letter A/B/C/D)
      const correctIndexes = options
        .map((o, i) => (o.isCorrect ? String.fromCharCode(65 + i) : null))
        .filter(Boolean);
      const correctAnswer = correctIndexes.join(",");

      // For Prisma schema compatibility, we store options as A/B/C/D fields
      const newQuestion = await prisma.question.create({
        data: {
          subjectId: parseInt(subjectId),
          chapterId: parseInt(chapterId),
          subconceptId: subconceptId ? parseInt(subconceptId) : null,
          question: questionText,
          optionA: options[0]?.text ?? "",
          optionB: options[1]?.text ?? "",
          optionC: options[2]?.text ?? null,
          optionD: options[3]?.text ?? null,
          optionAImage: optionImageUrls[0],
          optionBImage: optionImageUrls[1],
          optionCImage: optionImageUrls[2] ?? null,
          optionDImage: optionImageUrls[3] ?? null,
          correctAnswer,
          questionImage: questionImageUrl,
          solutionPdf: solutionPdfUrl,
          difficulty,
          marks,
          isMultipleAnswer,
          gradeLevel: gradeLevel ?? null,
          createdBy: parseInt(session.user.id),
        },
      });

      return NextResponse.json(newQuestion, { status: 201 });
    }

    // ── Handle JSON (simple, no images) ──────────────────────────────────
    const body = await req.json();
    const {
      subjectId,
      chapterId,
      subconceptId,
      question,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
      marks,
      difficulty,
    } = body;

    if (!subjectId || !question || !optionA || !optionB || !correctAnswer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newQuestion = await prisma.question.create({
      data: {
        subjectId: parseInt(subjectId),
        chapterId: chapterId ? parseInt(chapterId) : null,
        subconceptId: subconceptId ? parseInt(subconceptId) : null,
        question,
        optionA,
        optionB,
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
    console.error("POST /api/questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}