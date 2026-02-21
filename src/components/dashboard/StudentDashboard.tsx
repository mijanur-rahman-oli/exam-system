"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { BookOpen, Clock, Award, TrendingUp } from "lucide-react";
import Link from "next/link";

export function StudentDashboard() {
  const { data: session } = useSession();

  const { data: stats } = useQuery({
    queryKey: ["student-stats"],
    queryFn: async () => {
      const res = await fetch("/api/student/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: upcomingExams } = useQuery({
    queryKey: ["upcoming-exams"],
    queryFn: async () => {
      const res = await fetch("/api/student/upcoming-exams");
      if (!res.ok) throw new Error("Failed to fetch exams");
      return res.json();
    },
  });

  const { data: recentResults } = useQuery({
    queryKey: ["recent-results"],
    queryFn: async () => {
      const res = await fetch("/api/student/recent-results");
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user?.username}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalExams ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageScore ?? 0}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedExams ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingExams ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Exams</TabsTrigger>
          <TabsTrigger value="results">Recent Results</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {!upcomingExams || upcomingExams.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">No upcoming exams available.</p>
              </CardContent>
            </Card>
          ) : (
            upcomingExams.map((exam: any) => (
              <Card key={exam.id}>
                <CardHeader>
                  <CardTitle>{exam.examName}</CardTitle>
                  <CardDescription>{exam.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm">Duration: {exam.duration} minutes</p>
                      <p className="text-sm">Total Marks: {exam.totalMarks}</p>
                    </div>
                    <Link href={`/student/take-exam/${exam.id}`}>
                      <Button>Start Exam</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {!recentResults || recentResults.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">No results yet. Take an exam to see your results here.</p>
              </CardContent>
            </Card>
          ) : (
            recentResults.map((result: any) => (
              <Card key={result.id}>
                <CardHeader>
                  <CardTitle>{result.examName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm">Score: {result.score}%</p>
                      <p className="text-sm">
                        Date: {new Date(result.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link href={`/student/results/${result.id}`}>
                      <Button variant="outline">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}