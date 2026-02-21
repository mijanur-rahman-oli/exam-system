"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

export default function TeacherExamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const { data: exam, isLoading, refetch } = useQuery({
    queryKey: ["exam", id],
    queryFn: async () => {
      const res = await fetch(`/api/exams/${id}`);
      if (!res.ok) throw new Error("Failed to fetch exam");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await fetch(`/api/exams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update exam");
      return res.json();
    },
    onSuccess: () => { toast({ title: "Exam status updated" }); refetch(); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const removeQuestionMutation = useMutation({
    mutationFn: async (examQuestionId: number) => {
      const res = await fetch(`/api/exams/${id}/questions/${examQuestionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove question");
    },
    onSuccess: () => { toast({ title: "Question removed" }); refetch(); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;
  if (!exam) return <div className="container mx-auto p-6"><p className="text-red-500">Exam not found.</p></div>;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/teacher/exams">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back to Exams</Button>
        </Link>
        <h1 className="text-3xl font-bold truncate">{exam.examName}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle>Exam Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subject</span><span>{exam.subject?.name ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span>{exam.duration} minutes</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Marks</span><span>{exam.totalMarks ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Passing Marks</span><span>{exam.passingMarks ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Grade Level</span><span>{exam.gradeLevel ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Retake Allowed</span><span>{exam.retakeAllowed ? "Yes" : "No"}</span></div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${exam.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                {exam.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/teacher/exams/${id}/edit`} className="block">
              <Button variant="outline" className="w-full justify-start">
                <Pencil className="h-4 w-4 mr-2" />Edit Exam Details
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => toggleMutation.mutate(!exam.isActive)}
              disabled={toggleMutation.isPending}
            >
              {exam.isActive ? "Deactivate Exam" : "Activate Exam"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questions ({exam.examQuestions?.length ?? 0})</CardTitle>
          <CardDescription>Questions assigned to this exam</CardDescription>
        </CardHeader>
        <CardContent>
          {exam.examQuestions?.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No questions added yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exam.examQuestions?.map((eq: any, index: number) => (
                  <TableRow key={eq.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="max-w-sm truncate">{eq.question?.question}</TableCell>
                    <TableCell>{eq.marks}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        eq.question?.difficulty === "easy" ? "bg-green-100 text-green-800" :
                        eq.question?.difficulty === "medium" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>{eq.question?.difficulty}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Remove this question from the exam?")) {
                            removeQuestionMutation.mutate(eq.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
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