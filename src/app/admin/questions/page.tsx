// app/admin/questions/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, Pencil, Trash2, Search, Filter, 
  Eye, ChevronDown, ChevronUp, Copy 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminQuestionsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    subjectId: "all", // Changed from "" to "all"
    chapterId: "all", // Changed from "" to "all"
    difficulty: "all", // Changed from "" to "all"
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetch("/api/subjects").then(r => r.json()),
  });

  const { data: chapters } = useQuery({
    queryKey: ["chapters", filters.subjectId],
    queryFn: () => fetch(`/api/chapters?subjectId=${filters.subjectId}`).then(r => r.json()),
    enabled: filters.subjectId !== "all" && !!filters.subjectId,
  });

  const { data: questions, refetch, isLoading } = useQuery({
    queryKey: ["admin-questions", filters, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.subjectId && filters.subjectId !== "all") params.append("subjectId", filters.subjectId);
      if (filters.chapterId && filters.chapterId !== "all") params.append("chapterId", filters.chapterId);
      if (filters.difficulty && filters.difficulty !== "all") params.append("difficulty", filters.difficulty);
      if (search) params.append("search", search);
      
      const res = await fetch(`/api/questions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Question deleted successfully" });
      refetch();
    },
    onError: () => toast({ title: "Error", description: "Failed to delete", variant: "destructive" }),
  });

  const difficultyColors = {
    easy: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    hard: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  const handleSubjectChange = (value: string) => {
    setFilters({ 
      subjectId: value, 
      chapterId: "all", // Reset chapter when subject changes
      difficulty: filters.difficulty 
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Question Bank</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all questions in the system</p>
        </div>
        <Link href="/admin/questions/create">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create New Question
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Search questions..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <Select
              value={filters.subjectId}
              onValueChange={handleSubjectChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects?.map((s: any) => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.chapterId}
              onValueChange={(value) => setFilters({ ...filters, chapterId: value })}
              disabled={filters.subjectId === "all" || !filters.subjectId}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Chapters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chapters</SelectItem>
                {chapters?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.difficulty}
              onValueChange={(value) => setFilters({ ...filters, difficulty: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Questions ({questions?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : questions?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No questions found</p>
              <Link href="/admin/questions/create">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first question
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {questions?.map((q: any) => (
                <div key={q.id} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                  {/* Question Header */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          ID: {q.id}
                        </Badge>
                        <Badge className={difficultyColors[q.difficulty as keyof typeof difficultyColors]}>
                          {q.difficulty}
                        </Badge>
                        <Badge variant="secondary">{q.marks} marks</Badge>
                        {q.isMultipleAnswer && (
                          <Badge variant="purple" className="text-xs">
                            Multiple Answers
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white">{q.question}</p>
                      <div className="flex gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                        <span>{q.subject?.name}</span>
                        {q.chapter && (
                          <>
                            <span>›</span>
                            <span>{q.chapter.name}</span>
                          </>
                        )}
                        {q.subconcept && (
                          <>
                            <span>›</span>
                            <span>{q.subconcept.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                      >
                        {expandedId === q.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Link href={`/admin/questions/${q.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Delete this question?")) {
                            deleteMutation.mutate(q.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === q.id && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Options:</h4>
                          <div className="space-y-2">
                            {[
                              { letter: 'A', text: q.optionA },
                              { letter: 'B', text: q.optionB },
                              { letter: 'C', text: q.optionC },
                              { letter: 'D', text: q.optionD },
                            ].filter(opt => opt.text).map((opt) => (
                              <div 
                                key={opt.letter}
                                className={`p-2 rounded-lg ${
                                  q.correctAnswer.includes(opt.letter) 
                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                                    : 'bg-gray-50 dark:bg-gray-800/50'
                                }`}
                              >
                                <span className="font-medium mr-2">{opt.letter}.</span>
                                {opt.text}
                              </div>
                            ))}
                          </div>
                        </div>
                        {q.explanation && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Explanation:</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                        Created by: {q.creator?.username} on {new Date(q.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}