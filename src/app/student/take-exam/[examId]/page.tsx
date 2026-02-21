"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Clock, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

type Answer = { questionId: number; selectedAnswer: string };

export default function TakeExamPage() {
  const { examId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [examStarted, setExamStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialized = useRef(false);

  // Fetch exam details
  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ["exam-take", examId],
    queryFn: async () => {
      const res = await fetch(`/api/student/exams/${examId}`);
      if (!res.ok) throw new Error("Failed to fetch exam");
      return res.json();
    },
  });

  // Start exam mutation
  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/student/exams/${examId}/start`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to start exam");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setAttemptId(data.attemptId);
      setTimeLeft(data.duration * 60);
      setExamStarted(true);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Submit exam
  const submitExam = useCallback(async (forced = false) => {
    if (isSubmitting || !attemptId) return;
    setIsSubmitting(true);

    const formattedAnswers: Answer[] = Object.entries(answers).map(([qId, ans]) => ({
      questionId: parseInt(qId),
      selectedAnswer: ans,
    }));

    try {
      const res = await fetch(`/api/student/exams/${examId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers: formattedAnswers }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit exam");
      }

      const data = await res.json();
      if (forced) toast({ title: "Time's up!", description: "Your exam has been auto-submitted." });
      else toast({ title: "Exam submitted!", description: `Your score: ${data.score}` });

      router.push(`/student/results/${data.resultId}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setIsSubmitting(false);
    }
  }, [attemptId, answers, examId, isSubmitting, router, toast]);

  // Start exam on mount (once)
  useEffect(() => {
    if (initialized.current || !exam) return;
    initialized.current = true;
    startMutation.mutate();
  }, [exam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    if (!examStarted || timeLeft === null) return;

    if (timeLeft <= 0) {
      submitExam(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeLeft, submitExam]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const questions = exam?.examQuestions ?? [];
  const currentQuestion = questions[currentIndex]?.question;
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const isLowTime = timeLeft !== null && timeLeft < 120; // < 2 min

  if (examLoading || startMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Exam Unavailable</h2>
            <p className="text-muted-foreground mb-4">
              This exam has no questions or is not available.
            </p>
            <Button onClick={() => router.push("/student")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const options = [
    { key: "A", text: currentQuestion?.optionA },
    { key: "B", text: currentQuestion?.optionB },
    { key: "C", text: currentQuestion?.optionC },
    { key: "D", text: currentQuestion?.optionD },
  ].filter((o) => o.text);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg truncate max-w-sm">{exam.examName}</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {totalQuestions}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-lg ${isLowTime ? "bg-red-100 text-red-700 animate-pulse" : "bg-blue-100 text-blue-700"}`}>
            <Clock className="h-5 w-5" />
            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
          </div>
        </div>
        <div className="px-6 pb-2">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-1">{answeredCount} of {totalQuestions} answered</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 max-w-4xl">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Question panel */}
          <div className="md:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-normal leading-relaxed">
                  <span className="font-bold text-blue-600 mr-2">Q{currentIndex + 1}.</span>
                  {currentQuestion?.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {options.map((opt) => {
                  const questionId = questions[currentIndex]?.questionId;
                  const isSelected = answers[questionId] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setAnswers((prev) => ({ ...prev, [questionId]: opt.key }))}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <span className={`font-bold mr-2 ${isSelected ? "text-blue-600" : "text-muted-foreground"}`}>
                        {opt.key}.
                      </span>
                      {opt.text}
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />Previous
              </Button>

              {currentIndex === totalQuestions - 1 ? (
                <Button
                  onClick={() => {
                    const unanswered = totalQuestions - answeredCount;
                    if (unanswered > 0) {
                      if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
                    } else {
                      if (!confirm("Submit your exam?")) return;
                    }
                    submitExam(false);
                  }}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "Submitting..." : "Submit Exam"}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
                >
                  Next<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>

          {/* Question grid navigator */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-1.5">
                  {questions.map((_: any, idx: number) => {
                    const qId = questions[idx]?.questionId;
                    const isAnswered = !!answers[qId];
                    const isCurrent = idx === currentIndex;
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-8 w-full rounded text-xs font-medium transition-all ${
                          isCurrent
                            ? "ring-2 ring-blue-500 bg-blue-100 text-blue-700"
                            : isAnswered
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-green-100 border border-green-300" />Answered
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" />Not answered
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-blue-100 border border-blue-400" />Current
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}