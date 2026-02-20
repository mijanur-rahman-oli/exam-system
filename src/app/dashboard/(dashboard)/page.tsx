// src/app/(dashboard)/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../../lib/auth";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { QuestionSetterDashboard } from "@/components/dashboard/QuestionSetterDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  switch (role) {
    case "admin":
      return <AdminDashboard />;
    case "teacher":
      return <TeacherDashboard />;
    case "question_setter":
      return <QuestionSetterDashboard />;
    case "student":
      return <StudentDashboard />;
    default:
      redirect("/login");
  }
}