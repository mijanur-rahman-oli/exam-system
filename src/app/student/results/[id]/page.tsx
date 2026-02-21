"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trophy, TrendingUp, BookOpen, Award } from "lucide-react";

export default function StudentResultsPage() {
  const { data: results, isLoading } = useQuery({
    queryKey: ["student-results"],
    queryFn: async () => {
      const res = await fetch("/api/student/recent-results?limit=100");
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
  });

  const avgScore = results?.length
    ? Math.round(results.reduce((sum: number, r: any) => sum + r.score, 0) / results.length)
    : 0;

  const best = results?.length
    ? Math.max(...results.map((r: any) => r.score))
    : 0;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Results</h1>
        <p className="text-muted-foreground mt-1">Track your exam performance over time</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exams Taken</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results?.length ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{best}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Results</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading results...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No results yet. Take an exam to see your results here.
                    </TableCell>
                  </TableRow>
                )}
                {results?.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.examName}</TableCell>
                    <TableCell>
                      <span className={`text-lg font-bold ${r.score >= 50 ? "text-green-600" : "text-red-600"}`}>
                        {r.score}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${r.score >= 75 ? "bg-green-500" : r.score >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{ width: `${r.score}%` }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/student/results/${r.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}