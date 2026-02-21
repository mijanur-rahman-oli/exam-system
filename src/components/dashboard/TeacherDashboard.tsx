"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Clock, PlusCircle } from "lucide-react";
import Link from "next/link";

export function TeacherDashboard() {
  const { data: session } = useSession();

  const { data: stats } = useQuery({
    queryKey: ["teacher-stats"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: recentExams } = useQuery({
    queryKey: ["teacher-exams"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/exams");
      if (!res.ok) throw new Error("Failed to fetch exams");
      return res.json();
    },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.username}
          </p>
        </div>
        <Link href="/teacher/exams/create">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Exam
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Exams</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalExams ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeExams ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Recent Exams</CardTitle>
          <CardDescription>Exams you have created</CardDescription>
        </CardHeader>
        <CardContent>
          {recentExams?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No exams yet.{" "}
              <Link href="/teacher/exams/create" className="text-blue-600 hover:underline">
                Create your first exam
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {recentExams?.map((exam: any) => (
                <div key={exam.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="font-medium">{exam.examName}</p>
                    <p className="text-sm text-muted-foreground">
                      {exam.duration} mins · {exam.totalMarks} marks
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      exam.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {exam.isActive ? "Active" : "Inactive"}
                    </span>
                    <Link href={`/teacher/exams/${exam.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}