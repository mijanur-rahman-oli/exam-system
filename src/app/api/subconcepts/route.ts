import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get("chapterId");

    const subconcepts = await prisma.subconcept.findMany({
      where: chapterId ? { chapterId: parseInt(chapterId) } : undefined,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(subconcepts);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!["question_setter", "admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, chapterId } = await req.json();
    if (!name || !chapterId) {
      return NextResponse.json({ error: "name and chapterId required" }, { status: 400 });
    }

    const subconcept = await prisma.subconcept.create({
      data: { name, chapterId: parseInt(chapterId) },
    });

    return NextResponse.json(subconcept, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}