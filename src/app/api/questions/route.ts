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
  const bytes    = await file.arrayBuffer();
  const buffer   = Buffer.from(bytes);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename  = `${Date.now()}_${safeName}`;
  await writeFile(join(uploadDir, filename), buffer);
  return `/uploads/${dir}/${filename}`;
}

function toInt(v: string | null | undefined): number | null {
  if (!v || v.trim() === "") return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

// ─── GET /api/questions ───────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const subjectId    = searchParams.get("subjectId");
    const chapterId    = searchParams.get("chapterId");
    const subconceptId = searchParams.get("subconceptId");
    const gradeLevel   = searchParams.get("gradeLevel");
    const difficulty   = searchParams.get("difficulty");
    const limit        = searchParams.get("limit");
    const createdByMe  = searchParams.get("createdByMe");

    const where: Record<string, any> = {};
    if (subjectId)            where.subjectId    = parseInt(subjectId);
    if (chapterId)            where.chapterId    = parseInt(chapterId);
    if (subconceptId)         where.subconceptId = parseInt(subconceptId);
    if (gradeLevel)           where.gradeLevel   = gradeLevel;
    if (difficulty)           where.difficulty   = difficulty;
    if (createdByMe === "true") where.createdBy  = parseInt(session.user.id);

    const questions = await prisma.question.findMany({
      where,
      include: {
        subject:    { select: { name: true } },
        chapter:    { select: { name: true } },
        subconcept: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: parseInt(limit) } : {}),
    });

    return NextResponse.json(questions);
  } catch (err) {
    console.error("[GET /api/questions]", err);
    return NextResponse.json({ error: "Internal server error", detail: String(err) }, { status: 500 });
  }
}

// ─── POST /api/questions ──────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["question_setter", "admin", "teacher"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const createdBy = parseInt(session.user.id);

    // ── Parse multipart or JSON ───────────────────────────────────────────
    const contentType = req.headers.get("content-type") ?? "";
    const fields: Record<string, string> = {};
    const files:  Record<string, File>   = {};

    if (contentType.includes("multipart/form-data")) {
      const fd = await req.formData();
      for (const [key, val] of fd.entries()) {
        if (val instanceof File && val.size > 0) files[key] = val;
        else if (typeof val === "string")        fields[key] = val;
      }
    } else {
      const body = await req.json();
      Object.assign(fields, body);
    }

    // ── Required field checks ─────────────────────────────────────────────
    const subjectIdRaw = fields["subjectId"];
    const questionText = fields["question"]?.trim();
    const optionsRaw   = fields["options"];

    if (!subjectIdRaw?.trim()) {
      return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
    }
    if (!questionText) {
      return NextResponse.json({ error: "Question text is required" }, { status: 400 });
    }

    // ── Parse options array ───────────────────────────────────────────────
    let options: { text: string; isCorrect: boolean }[] = [];
    if (optionsRaw) {
      try {
        options = JSON.parse(optionsRaw);
      } catch {
        return NextResponse.json({ error: "Options JSON is malformed" }, { status: 400 });
      }
    } else {
      // Legacy: individual optionA/B/C/D + correctAnswer fields
      const optA = fields["optionA"];
      const optB = fields["optionB"];
      if (!optA || !optB) {
        return NextResponse.json({ error: "At least 2 options are required" }, { status: 400 });
      }
      const correct = (fields["correctAnswer"] ?? "A").split(",").map((s) => s.trim().toUpperCase());
      const raw = [optA, fields["optionB"], fields["optionC"], fields["optionD"]].filter(Boolean) as string[];
      options = raw.map((text, i) => ({
        text,
        isCorrect: correct.includes(String.fromCharCode(65 + i)),
      }));
    }

    if (options.length < 2) {
      return NextResponse.json({ error: "At least 2 options are required" }, { status: 400 });
    }
    if (!options.some((o) => o.isCorrect)) {
      return NextResponse.json({ error: "Mark at least one correct answer" }, { status: 400 });
    }

    // correctAnswer string: "A" | "B,C" etc.
    const correctAnswer = options
      .map((o, i) => (o.isCorrect ? String.fromCharCode(65 + i) : null))
      .filter(Boolean)
      .join(",");

    // ── Save images ───────────────────────────────────────────────────────
    let questionImageUrl: string | null = null;
    if (files["questionImage"]) {
      questionImageUrl = await saveFile(files["questionImage"], "question-images");
    }

    const optionImageUrls: (string | null)[] = [null, null, null, null];
    for (let i = 0; i < 4; i++) {
      if (files[`optionImage_${i}`]) {
        optionImageUrls[i] = await saveFile(files[`optionImage_${i}`], "option-images");
      }
    }

    // ── Build data object matching YOUR actual schema ─────────────────────
    const data: Record<string, any> = {
      subjectId:       parseInt(subjectIdRaw),
      chapterId:       toInt(fields["chapterId"]),
      subconceptId:    toInt(fields["subconceptId"]),
      gradeLevel:      fields["gradeLevel"]?.trim() || null,
      question:        questionText,
      optionA:         options[0]?.text ?? "",
      optionB:         options[1]?.text ?? "",
      optionC:         options[2]?.text ?? null,
      optionD:         options[3]?.text ?? null,
      correctAnswer,
      isMultipleAnswer: fields["isMultipleAnswer"] === "true",
      explanation:     fields["explanation"]?.trim() || null,
      marks:           parseInt(fields["marks"] || "1") || 1,
      difficulty:      (fields["difficulty"] || "medium") as "easy" | "medium" | "hard",
      createdBy,
    };

    // Add image fields only if they exist in schema
    // (safe — if column doesn't exist Prisma will throw P2009 with a clear message)
    if (questionImageUrl) data.questionImage = questionImageUrl;
    if (optionImageUrls[0]) data.optionAImage = optionImageUrls[0];
    if (optionImageUrls[1]) data.optionBImage = optionImageUrls[1];
    if (optionImageUrls[2]) data.optionCImage = optionImageUrls[2];
    if (optionImageUrls[3]) data.optionDImage = optionImageUrls[3];

    const newQuestion = await prisma.question.create({ data });
    return NextResponse.json(newQuestion, { status: 201 });

  } catch (err: any) {
    console.error("[POST /api/questions]", err);

    let message = "Internal server error";
    if (err?.code === "P2002") message = "Duplicate entry";
    if (err?.code === "P2003") message = "Invalid foreign key — check subject/chapter IDs exist in the database";
    if (err?.code === "P2025") message = "Referenced record not found";
    if (err?.code === "P2009" || err?.message?.includes("Unknown argument")) {
      message = "Schema mismatch — run `npx prisma generate` and restart the server";
    }

    return NextResponse.json({ error: message, code: err?.code, detail: err?.message }, { status: 500 });
  }
}