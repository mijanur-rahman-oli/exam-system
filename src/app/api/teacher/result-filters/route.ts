import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const teacherId = parseInt(session.user.id);

    const [gradeRows, subjectRows, examRows] = await Promise.all([
      prisma.studentDetails.findMany({
        where: { grade: { not: null } },
        select: { grade: true },
        distinct: ["grade"],
        orderBy: { grade: "asc" },
      }),
      prisma.subject.findMany({
        where: { exams: { some: { createdBy: teacherId } } },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.exam.findMany({
        where: { createdBy: teacherId },
        select: { examName: true },
        orderBy: { examName: "asc" },
      }),
    ]);

    return NextResponse.json({
      grades:   gradeRows.map(r => r.grade),
      subjects: subjectRows.map(r => r.name),
      exams:    examRows.map(r => r.examName),
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}