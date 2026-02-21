"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TeacherResultsPage() {
  const { data: results, isLoading } = useQuery({
    queryKey: ["teacher-results"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/results");
      if (!res.ok) throw new Error("Failed to fetch results");
      return res.json();
    },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Exam Results</h1>
        <p className="text-muted-foreground mt-1">View student performance across all your exams</p>
      </div>

      <Card>
        <CardHeader><CardTitle>All Results ({results?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading results...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No results yet. Results will appear here when students complete your exams.
                    </TableCell>
                  </TableRow>
                )}
                {results?.map((r: any) => {
                  const pct = r.totalMarks > 0 ? Math.round((r.score / r.totalMarks) * 100) : 0;
                  const passed = r.passingMarks ? r.score >= r.passingMarks : pct >= 50;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.student?.username}</TableCell>
                      <TableCell>{r.exam?.examName}</TableCell>
                      <TableCell>{r.score ?? 0}</TableCell>
                      <TableCell>{r.totalMarks ?? "—"}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${pct >= 50 ? "text-green-600" : "text-red-600"}`}>
                          {pct}%
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {passed ? "Pass" : "Fail"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}