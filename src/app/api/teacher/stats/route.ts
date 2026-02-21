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

    const [totalExams, activeExams, totalStudents] = await Promise.all([
      prisma.exam.count({ where: { createdBy: teacherId } }),
      prisma.exam.count({ where: { createdBy: teacherId, isActive: true } }),
      prisma.user.count({ where: { role: "student" } }),
    ]);

    return NextResponse.json({ totalExams, activeExams, totalStudents });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}