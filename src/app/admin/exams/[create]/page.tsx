// app/admin/exams/create/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, X, Search, Loader2 } from "lucide-react";
import Link from "next/link";

const examSchema = z.object({
  examName: z.string().min(1, "Exam name is required"),
  description: z.string().optional(),
  subjectId: z.string().min(1, "Subject is required"),
  gradeLevel: z.string().optional(),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  passingMarks: z.coerce.number().optional(),
  scheduleTime: z.string().optional(),
  isActive: z.boolean().default(true),
  retakeAllowed: z.boolean().default(false),
});

type ExamForm = z.infer<typeof examSchema>;

export default function AdminCreateExamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedQuestions, setSelectedQuestions] = useState<Record<number, number>>({});
  const [filters, setFilters] = useState({
    subjectId: "all",
    chapterId: "all",
    difficulty: "all",
    gradeLevel: "all",
    search: "",
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ExamForm>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      isActive: true,
      retakeAllowed: false,
    },
  });

  const selectedSubject = watch("subjectId");

  // Update filters when subject changes
  useEffect(() => {
    if (selectedSubject && selectedSubject !== "all") {
      setFilters(prev => ({ ...prev, subjectId: selectedSubject }));
    }
  }, [selectedSubject]);

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetch("/api/subjects").then(r => r.json()),
  });

  const { data: chapters } = useQuery({
    queryKey: ["chapters", filters.subjectId],
    queryFn: () => fetch(`/api/chapters?subjectId=${filters.subjectId}`).then(r => r.json()),
    enabled: filters.subjectId !== "all" && !!filters.subjectId,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery({
    queryKey: ["questions", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.subjectId && filters.subjectId !== "all") params.append("subjectId", filters.subjectId);
      if (filters.chapterId && filters.chapterId !== "all") params.append("chapterId", filters.chapterId);
      if (filters.difficulty && filters.difficulty !== "all") params.append("difficulty", filters.difficulty);
      if (filters.gradeLevel && filters.gradeLevel !== "all") params.append("gradeLevel", filters.gradeLevel);
      if (filters.search) params.append("search", filters.search);
      
      const res = await fetch(`/api/questions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
  });

  const createExam = useMutation({
    mutationFn: async (data: ExamForm) => {
      if (Object.keys(selectedQuestions).length === 0) {
        throw new Error("Please select at least one question");
      }

      const questionsArray = Object.entries(selectedQuestions).map(([id, marks]) => ({
        questionId: parseInt(id),
        marks,
      }));

      const payload = {
        ...data,
        subjectId: parseInt(data.subjectId),
        gradeLevel: data.gradeLevel || null,
        passingMarks: data.passingMarks || null,
        scheduleTime: data.scheduleTime ? new Date(data.scheduleTime).toISOString() : null,
        questions: questionsArray,
      };

      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create exam");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "Exam created successfully" 
      });
      router.push("/admin/exams");
    },
    onError: (err: any) => {
      toast({ 
        title: "Error", 
        description: err.message, 
        variant: "destructive" 
      });
    },
  });

  const totalMarks = Object.values(selectedQuestions).reduce((sum, m) => sum + m, 0);

  const addQuestion = (question: any) => {
    setSelectedQuestions(prev => ({
      ...prev,
      [question.id]: question.marks,
    }));
  };

  const removeQuestion = (id: number) => {
    setSelectedQuestions(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const updateMarks = (id: number, marks: number) => {
    setSelectedQuestions(prev => ({
      ...prev,
      [id]: marks,
    }));
  };

  const difficultyColors = {
    easy: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    hard: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/exams">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Exams
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Exam</h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left column - Exam details */}
        <div className="col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exam Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="examName">Exam Name *</Label>
                <Input 
                  id="examName" 
                  {...register("examName")} 
                  placeholder="e.g., Mid Term Examination" 
                />
                {errors.examName && (
                  <p className="text-sm text-red-500">{errors.examName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectId">Subject *</Label>
                <Select
                  onValueChange={(value) => setValue("subjectId", value)}
                  defaultValue=""
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subjectId && (
                  <p className="text-sm text-red-500">{errors.subjectId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  {...register("description")} 
                  rows={3} 
                  placeholder="Enter exam description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    min="1" 
                    {...register("duration")} 
                    placeholder="60"
                  />
                  {errors.duration && (
                    <p className="text-sm text-red-500">{errors.duration.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passingMarks">Passing Marks</Label>
                  <Input 
                    id="passingMarks" 
                    type="number" 
                    min="0" 
                    {...register("passingMarks")} 
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gradeLevel">Grade Level</Label>
                <Input 
                  id="gradeLevel" 
                  {...register("gradeLevel")} 
                  placeholder="e.g., 10, 12, or leave blank for all" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduleTime">Schedule Time</Label>
                <Input 
                  id="scheduleTime" 
                  type="datetime-local" 
                  {...register("scheduleTime")} 
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="isActive" {...register("isActive")} />
                  <Label htmlFor="isActive">Active immediately</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="retakeAllowed" {...register("retakeAllowed")} />
                  <Label htmlFor="retakeAllowed">Allow retake</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Marks:</span>
                <span className="text-2xl font-bold text-primary">{totalMarks}</span>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.keys(selectedQuestions).length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No questions selected. Select questions from the right panel.
                  </p>
                ) : (
                  Object.entries(selectedQuestions).map(([id, marks]) => {
                    const question = questions?.find((q: any) => q.id === parseInt(id));
                    return (
                      <div key={id} className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
                            {question?.question}
                          </p>
                        </div>
                        <Input
                          type="number"
                          min="1"
                          value={marks}
                          onChange={(e) => updateMarks(parseInt(id), parseInt(e.target.value))}
                          className="w-20"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(parseInt(id))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit((data) => createExam.mutate(data))}
            disabled={createExam.isPending || Object.keys(selectedQuestions).length === 0}
          >
            {createExam.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Exam"
            )}
          </Button>
        </div>

        {/* Right column - Question bank */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Question Bank</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    placeholder="Search questions..."
                    className="pl-9"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>

                <Select
                  value={filters.chapterId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, chapterId: value }))}
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
                  onValueChange={(value) => setFilters(prev => ({ ...prev, difficulty: value }))}
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

                <Select
                  value={filters.gradeLevel}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, gradeLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {[6,7,8,9,10,11,12].map(g => (
                      <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Questions list */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {questionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !questions || questions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No questions found matching the filters.</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Try adjusting your filters or create new questions.
                    </p>
                  </div>
                ) : (
                  questions.map((q: any) => (
                    <div
                      key={q.id}
                      className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-primary dark:hover:border-primary transition-colors bg-white dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white mb-2">
                            {q.question}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Badge className={difficultyColors[q.difficulty]}>
                              {q.difficulty}
                            </Badge>
                            <Badge variant="outline">{q.marks} marks</Badge>
                            {q.subject?.name && (
                              <span className="text-gray-600 dark:text-gray-400">
                                {q.subject.name}
                              </span>
                            )}
                            {q.chapter?.name && (
                              <>
                                <span className="text-gray-400 dark:text-gray-600">›</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {q.chapter.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => addQuestion(q)}
                          disabled={selectedQuestions[q.id] !== undefined}
                          variant={selectedQuestions[q.id] !== undefined ? "secondary" : "default"}
                          size="sm"
                          className="shrink-0"
                        >
                          {selectedQuestions[q.id] !== undefined ? (
                            "Added"
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Summary */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Showing {questions?.length || 0} questions
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Object.keys(selectedQuestions).length} selected
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}