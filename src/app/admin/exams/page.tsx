// app/admin/exams/page.tsx
"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, Trash2, Eye, Edit, ToggleLeft, ToggleRight,
  Calendar, Users, Clock
} from "lucide-react";

export default function AdminExamsPage() {
  const { toast } = useToast();

  const { data: exams, refetch, isLoading } = useQuery({
    queryKey: ["admin-exams"],
    queryFn: async () => {
      const res = await fetch("/api/exams");
      if (!res.ok) throw new Error("Failed to fetch exams");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/exams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update exam");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Exam status updated" });
      refetch();
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete exam");
    },
    onSuccess: () => {
      toast({ title: "Exam deleted" });
      refetch();
    },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Exam Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage all exams</p>
        </div>
        <Link href="/admin/exams/create">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create New Exam
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Exams</p>
                <p className="text-2xl font-bold">{exams?.length ?? 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900/30">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Exams</p>
                <p className="text-2xl font-bold">
                  {exams?.filter((e: any) => e.isActive).length ?? 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full dark:bg-green-900/30">
                <ToggleRight className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Questions</p>
                <p className="text-2xl font-bold">
                  {exams?.reduce((acc: number, e: any) => acc + (e.examQuestions?.length || 0), 0) ?? 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full dark:bg-purple-900/30">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Duration</p>
                <p className="text-2xl font-bold">
                  {exams?.length 
                    ? Math.round(exams.reduce((acc: number, e: any) => acc + e.duration, 0) / exams.length)
                    : 0} min
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full dark:bg-orange-900/30">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Exams</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading exams...</p>
          ) : exams?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No exams created yet</p>
              <Link href="/admin/exams/create">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first exam
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams?.map((exam: any) => (
                  <TableRow key={exam.id}>
                    <TableCell>{exam.id}</TableCell>
                    <TableCell className="font-medium">{exam.examName}</TableCell>
                    <TableCell>{exam.subject?.name}</TableCell>
                    <TableCell>{exam.duration} min</TableCell>
                    <TableCell>{exam.examQuestions?.length ?? 0}</TableCell>
                    <TableCell>{exam.totalMarks ?? '—'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(exam.isActive)}>
                        {exam.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/exams/${exam.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/exams/${exam.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMutation.mutate({ 
                            id: exam.id, 
                            isActive: !exam.isActive 
                          })}
                        >
                          {exam.isActive 
                            ? <ToggleRight className="h-4 w-4 text-green-600" />
                            : <ToggleLeft className="h-4 w-4 text-gray-400" />
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete exam "${exam.examName}"?`)) {
                              deleteMutation.mutate(exam.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
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