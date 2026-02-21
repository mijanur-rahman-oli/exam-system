import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teacherId = parseInt(session.user.id);

    const attempts = await prisma.examAttempt.findMany({
      where: {
        isCompleted: true,
        exam: { createdBy: teacherId },
      },
      include: {
        student: { select: { username: true, email: true } },
        exam: {
          select: {
            examName: true,
            totalMarks: true,
            passingMarks: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json(attempts);
  } catch (error) {
    console.error("Teacher results error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}