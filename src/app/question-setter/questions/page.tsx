"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import Link from "next/link";

export default function QuestionsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const { data: questions, refetch, isLoading } = useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const res = await fetch("/api/questions");
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete question");
    },
    onSuccess: () => { toast({ title: "Question deleted successfully" }); refetch(); },
    onError: () => toast({ title: "Error", description: "Failed to delete question", variant: "destructive" }),
  });

  const filtered = questions?.filter((q: any) => {
    const matchesSearch = q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.subject?.name.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficultyFilter === "all" || q.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const difficultyBadge = (d: string) => {
    const map: Record<string, string> = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      hard: "bg-red-100 text-red-800",
    };
    return map[d] ?? "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Question Bank</h1>
          <p className="text-muted-foreground mt-1">Manage all your questions</p>
        </div>
        <Link href="/question-setter/questions/create">
          <Button><Plus className="h-4 w-4 mr-2" />Add Question</Button>
        </Link>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions or subjects..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questions ({filtered?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading questions...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Question</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {search || difficultyFilter !== "all"
                        ? "No questions match your filters."
                        : "No questions yet. Add your first question."}
                    </TableCell>
                  </TableRow>
                )}
                {filtered?.map((q: any) => (
                  <TableRow key={q.id}>
                    <TableCell className="max-w-xs">
                      <p className="truncate font-medium">{q.question}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        A: {q.optionA} &nbsp;|&nbsp; B: {q.optionB}
                        {q.optionC && <>&nbsp;|&nbsp; C: {q.optionC}</>}
                        {q.optionD && <>&nbsp;|&nbsp; D: {q.optionD}</>}
                      </p>
                      <p className="text-xs text-green-700 mt-0.5">✓ Answer: {q.correctAnswer}</p>
                    </TableCell>
                    <TableCell>{q.subject?.name ?? "—"}</TableCell>
                    <TableCell>{q.chapter?.name ?? "—"}</TableCell>
                    <TableCell>{q.marks}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${difficultyBadge(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/question-setter/questions/${q.id}/edit`}>
                          <Button variant="ghost" size="sm" title="Edit">
                            <Pencil className="h-4 w-4 text-blue-500" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete"
                          onClick={() => {
                            if (confirm("Delete this question? This cannot be undone.")) {
                              deleteMutation.mutate(q.id);
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