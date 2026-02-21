"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileQuestion, CheckCircle, Clock, PlusCircle } from "lucide-react";
import Link from "next/link";

export function QuestionSetterDashboard() {
  const { data: session } = useSession();

  const { data: stats } = useQuery({
    queryKey: ["qs-stats"],
    queryFn: async () => {
      const res = await fetch("/api/question-setter/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: recentQuestions } = useQuery({
    queryKey: ["qs-questions"],
    queryFn: async () => {
      const res = await fetch("/api/questions?limit=5");
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Question Setter Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.username}
          </p>
        </div>
        <Link href="/question-setter/questions">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalQuestions ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Easy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.easyCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hard</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.hardCount ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Questions</CardTitle>
          <CardDescription>Last 5 questions you created</CardDescription>
        </CardHeader>
        <CardContent>
          {recentQuestions?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No questions yet.{" "}
              <Link href="/question-setter/questions" className="text-blue-600 hover:underline">
                Create your first question
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {recentQuestions?.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium truncate">{q.question}</p>
                    <p className="text-sm text-muted-foreground">
                      {q.subject?.name} · {q.marks} mark{q.marks !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                    q.difficulty === "easy"
                      ? "bg-green-100 text-green-800"
                      : q.difficulty === "medium"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {q.difficulty}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}