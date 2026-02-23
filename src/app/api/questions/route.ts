// app/api/questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ── GET /api/questions ────────────────────────────────────────────────────────
// Params: subjectId, chapterId, subconceptId, gradeLevel, createdByMe=true
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId    = searchParams.get("subjectId");
    const chapterId    = searchParams.get("chapterId");
    const subconceptId = searchParams.get("subconceptId");
    const gradeLevel   = searchParams.get("gradeLevel");
    // ✅ NEW: filter to only this user's own questions (for question-setter list)
    const createdByMe  = searchParams.get("createdByMe") === "true";

    // subjectId is required UNLESS createdByMe is set
    if (!subjectId && !createdByMe) {
      return NextResponse.json({ error: "subjectId or createdByMe=true is required" }, { status: 400 });
    }

    const questions = await prisma.question.findMany({
      where: {
        ...(createdByMe ? { createdBy: parseInt(session.user.id) } : {}),
        ...(subjectId    ? { subjectId:    parseInt(subjectId)    } : {}),
        ...(chapterId    ? { chapterId:    parseInt(chapterId)    } : {}),
        ...(subconceptId ? { subconceptId: parseInt(subconceptId) } : {}),
        ...(gradeLevel   ? { gradeLevel }                          : {}),
      },
      include: {
        subject:    { select: { id: true, name: true } },
        chapter:    { select: { id: true, name: true } },
        subconcept: { select: { id: true, name: true } },
        creator:    { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("GET /api/questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST /api/questions — multipart/form-data ─────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (
      session.user.role !== "teacher" &&
      session.user.role !== "admin" &&
      session.user.role !== "question_setter"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const createdBy = parseInt(session.user.id);
    const formData  = await req.formData();

    const subjectId        = formData.get("subjectId")        as string;
    const chapterId        = formData.get("chapterId")        as string | null;
    const subconceptId     = formData.get("subconceptId")     as string | null;
    const gradeLevel       = formData.get("gradeLevel")       as string | null;
    const question         = formData.get("question")         as string;
    const difficulty       = (formData.get("difficulty") as string) || "medium";
    const marks            = formData.get("marks")            as string;
    const isMultipleAnswer = formData.get("isMultipleAnswer") === "true";
    const solutionType     = (formData.get("solutionType") as string) || "none";
    const solutionText     = formData.get("solutionText")     as string | null;
    const optionsRaw       = formData.get("options")          as string;

    if (!subjectId || !question || !optionsRaw) {
      return NextResponse.json({ error: "subjectId, question, and options are required" }, { status: 400 });
    }

    const options: { text: string; isCorrect: boolean }[] = JSON.parse(optionsRaw);
    if (!Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ error: "At least 2 options required" }, { status: 400 });
    }
    if (!options.some((o) => o.isCorrect)) {
      return NextResponse.json({ error: "At least one correct answer required" }, { status: 400 });
    }

    // Derive correctAnswer string e.g. "A" or "A,C"
    const LETTERS       = ["A", "B", "C", "D"];
    const correctAnswer = options
      .map((o, i) => (o.isCorrect ? LETTERS[i] : null))
      .filter(Boolean)
      .join(",");

    // Save images
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "question-images");
    await mkdir(uploadsDir, { recursive: true });

    const saveImage = async (file: File): Promise<string> => {
      const bytes  = await file.arrayBuffer();
      const ext    = file.name.split(".").pop() ?? "jpg";
      const name   = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      await writeFile(path.join(uploadsDir, name), Buffer.from(bytes));
      return `/uploads/question-images/${name}`;
    };

    const questionImageFile = formData.get("questionImage");
    const questionImage     = questionImageFile instanceof File ? await saveImage(questionImageFile) : null;

    // Solution image (stored in explanation field as a path when solutionType=image)
    const solutionImageFile = formData.get("solutionImage");
    const solutionImagePath = solutionImageFile instanceof File ? await saveImage(solutionImageFile) : null;

    // Determine what goes in the explanation column
    let explanation: string | null = null;
    if (solutionType === "text" && solutionText) {
      explanation = solutionText;
    } else if (solutionType === "image" && solutionImagePath) {
      explanation = solutionImagePath; // store image path in explanation
    }

    const optionImages: (string | null)[] = [null, null, null, null];
    for (let i = 0; i < 4; i++) {
      const img = formData.get(`optionImage_${i}`);
      if (img instanceof File) optionImages[i] = await saveImage(img);
    }

    const created = await prisma.question.create({
      data: {
        subjectId:        parseInt(subjectId),
        chapterId:        chapterId    && chapterId    !== "" ? parseInt(chapterId)    : null,
        subconceptId:     subconceptId && subconceptId !== "" ? parseInt(subconceptId) : null,
        gradeLevel:       gradeLevel   && gradeLevel   !== "" ? gradeLevel             : null,
        question,
        questionImage,
        optionA:      options[0]?.text ?? "",
        optionB:      options[1]?.text ?? "",
        optionC:      options[2]?.text ?? null,
        optionD:      options[3]?.text ?? null,
        optionAImage: optionImages[0],
        optionBImage: optionImages[1],
        optionCImage: optionImages[2],
        optionDImage: optionImages[3],
        correctAnswer,
        isMultipleAnswer,
        explanation,
        marks:     parseInt(marks) || 1,
        difficulty: difficulty as "easy" | "medium" | "hard",
        createdBy,
      },
      include: {
        subject:    { select: { id: true, name: true } },
        chapter:    { select: { id: true, name: true } },
        subconcept: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}