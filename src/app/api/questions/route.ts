// app/api/questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const chapterId = searchParams.get("chapterId");
    const subconceptId = searchParams.get("subconceptId");
    const gradeLevel = searchParams.get("gradeLevel");
    const difficulty = searchParams.get("difficulty");
    const search = searchParams.get("search");
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
    const createdByMe = searchParams.get("createdByMe") === "true";

    // Build where clause
    const where: any = {};

    if (createdByMe) {
      where.createdBy = parseInt(session.user.id);
    }

    if (subjectId && subjectId !== "all") {
      where.subjectId = parseInt(subjectId);
    }

    if (chapterId && chapterId !== "all") {
      where.chapterId = parseInt(chapterId);
    }

    if (subconceptId && subconceptId !== "all") {
      where.subconceptId = parseInt(subconceptId);
    }

    if (gradeLevel && gradeLevel !== "all") {
      where.gradeLevel = gradeLevel;
    }

    if (difficulty && difficulty !== "all") {
      where.difficulty = difficulty;
    }

    if (search) {
      where.question = {
        contains: search,
        mode: "insensitive",
      };
    }

    const questions = await prisma.question.findMany({
      where,
      include: {
        subject: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true } },
        subconcept: { select: { id: true, name: true } },
        creator: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("GET /api/questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["admin", "teacher", "question_setter"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const createdBy = parseInt(session.user.id);
    const formData = await req.formData();

    const subjectId = formData.get("subjectId") as string;
    const chapterId = formData.get("chapterId") as string | null;
    const subconceptId = formData.get("subconceptId") as string | null;
    const gradeLevel = formData.get("gradeLevel") as string | null;
    const question = formData.get("question") as string;
    const difficulty = (formData.get("difficulty") as string) || "medium";
    const marks = formData.get("marks") as string;
    const isMultipleAnswer = formData.get("isMultipleAnswer") === "true";
    const solutionType = (formData.get("solutionType") as string) || "none";
    const solutionText = formData.get("solutionText") as string | null;
    const optionsRaw = formData.get("options") as string;

    if (!subjectId || !question || !optionsRaw) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const options: { text: string; isCorrect: boolean }[] = JSON.parse(optionsRaw);
    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: "At least 2 options required" }, { status: 400 });
    }
    if (!options.some((o) => o.isCorrect)) {
      return NextResponse.json({ error: "At least one correct answer required" }, { status: 400 });
    }

    const LETTERS = ["A", "B", "C", "D"];
    const correctAnswer = options
      .map((o, i) => (o.isCorrect ? LETTERS[i] : null))
      .filter(Boolean)
      .join(",");

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "question-images");
    await mkdir(uploadsDir, { recursive: true });

    const saveImage = async (file: File): Promise<string> => {
      const bytes = await file.arrayBuffer();
      const ext = file.name.split(".").pop() ?? "jpg";
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      await writeFile(path.join(uploadsDir, name), Buffer.from(bytes));
      return `/uploads/question-images/${name}`;
    };

    const questionImageFile = formData.get("questionImage");
    const questionImage = questionImageFile instanceof File ? await saveImage(questionImageFile) : null;

    const solutionImageFile = formData.get("solutionImage");
    const solutionImagePath = solutionImageFile instanceof File ? await saveImage(solutionImageFile) : null;

    let explanation: string | null = null;
    if (solutionType === "text" && solutionText) {
      explanation = solutionText;
    } else if (solutionType === "image" && solutionImagePath) {
      explanation = solutionImagePath;
    }

    const optionImages: (string | null)[] = [null, null, null, null];
    for (let i = 0; i < 4; i++) {
      const img = formData.get(`optionImage_${i}`);
      if (img instanceof File) optionImages[i] = await saveImage(img);
    }

    const created = await prisma.question.create({
      data: {
        subjectId: parseInt(subjectId),
        chapterId: chapterId && chapterId !== "" ? parseInt(chapterId) : null,
        subconceptId: subconceptId && subconceptId !== "" ? parseInt(subconceptId) : null,
        gradeLevel: gradeLevel || null,
        question,
        questionImage,
        optionA: options[0]?.text ?? "",
        optionB: options[1]?.text ?? "",
        optionC: options[2]?.text ?? null,
        optionD: options[3]?.text ?? null,
        optionAImage: optionImages[0],
        optionBImage: optionImages[1],
        optionCImage: optionImages[2],
        optionDImage: optionImages[3],
        correctAnswer,
        isMultipleAnswer,
        explanation,
        marks: parseInt(marks) || 1,
        difficulty: difficulty as "easy" | "medium" | "hard",
        createdBy,
      },
      include: {
        subject: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true } },
        subconcept: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}