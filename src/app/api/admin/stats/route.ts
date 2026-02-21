// src/app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get total users
    const totalUsers = await prisma.user.count();
    
    // Get users by role
    const studentCount = await prisma.user.count({ where: { role: "student" } });
    const teacherCount = await prisma.user.count({ where: { role: "teacher" } });
    const questionSetterCount = await prisma.user.count({ where: { role: "question_setter" } });
    
    // Get total exams
    const totalExams = await prisma.exam.count();
    
    // Get total questions
    const totalQuestions = await prisma.question.count();
    
    // Get exam attempts
    const totalAttempts = await prisma.examAttempt.count();

    return NextResponse.json({
      totalUsers,
      studentCount,
      teacherCount,
      questionSetterCount,
      totalExams,
      totalQuestions,
      totalAttempts,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}