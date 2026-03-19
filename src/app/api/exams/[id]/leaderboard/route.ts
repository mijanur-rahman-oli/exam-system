import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const examId = parseInt(params.id);
    if (isNaN(examId)) return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });

    // Auth check — admins always allowed; students allowed if exam is active
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "admin";

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { id: true, examName: true, totalMarks: true, isActive: true, subject: { select: { name: true } } },
    });
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    // Non-admins can only see leaderboard for active exams
    if (!isAdmin && !exam.isActive) {
      return NextResponse.json({ error: "Leaderboard not available" }, { status: 403 });
    }

    const attempts = await prisma.examAttempt.findMany({
      where: { examId, isCompleted: true },
      select: {
        id:           true,
        score:        true,
        startedAt:    true,
        submittedAt:  true,
        studentId:    true,
        guestName:    true,
        guestCollege: true,
        student: {
          select: {
            username:       true,
            studentDetails: { select: { grade: true } },
          },
        },
      },
      orderBy: [
        { score: "desc" },
        { submittedAt: "asc" }, // tiebreak: earlier submission ranks higher
      ],
    });

    const totalMarks = exam.totalMarks ?? 0;

    const leaderboard = attempts.map((a, index) => {
      const isGuest    = !a.studentId;
      const name       = isGuest ? (a.guestName ?? "Guest") : (a.student?.username ?? "—");
      const college    = isGuest ? (a.guestCollege ?? "—") : (a.student?.studentDetails?.grade ?? "—");
      const score      = a.score ?? 0;
      const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
      const timeTaken  = a.submittedAt
        ? Math.round((new Date(a.submittedAt).getTime() - new Date(a.startedAt).getTime()) / 1000 / 60)
        : null;

      return {
        rank:        index + 1,
        attemptId:   a.id,
        name,
        college,
        score,
        totalMarks,
        percentage,
        timeTaken,
        type:        isGuest ? "guest" : "registered",
        submittedAt: a.submittedAt,
        // Highlight current student
        isCurrentUser: session?.user ? a.studentId === parseInt(session.user.id) : false,
      };
    });

    return NextResponse.json({ exam, leaderboard, totalParticipants: leaderboard.length });
  } catch (err) {
    console.error("[GET /api/exams/:id/leaderboard]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}