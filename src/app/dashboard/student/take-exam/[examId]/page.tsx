// src/app/(dashboard)/student/take-exam/[examId]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react"; // Added useRef
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Clock, AlertCircle } from "lucide-react";

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const examId = params.examId as string;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  
  // Bug Fix 12: Prevent infinite start loop
  const hasStarted = useRef(false);

  const { data: exam, isLoading } = useQuery({
    queryKey: ["exam", examId],
    queryFn: async () => {
      const res = await fetch(`/api/student/exams/${examId}`);
      if (!res.ok) throw new Error("Failed to fetch exam");
      return res.json();
    },
  });

  const startExamMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/student/exams/${examId}/start`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to start exam");
      return res.json();
    },
    onSuccess: (data) => {
      setAttemptId(data.attemptId);
      setTimeLeft(exam.duration * 60);
    },
  });

  const submitExamMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/student/exams/${examId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit exam");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Exam submitted successfully!",
      });
      router.push(`/student/results/${data.resultId}`);
    },
  });

  // Fix Bug 12 — prevent infinite loop:
  useEffect(() => {
    if (exam && !hasStarted.current) {
      hasStarted.current = true;
      startExamMutation.mutate();
    }
  }, [exam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fix Bug 13 — prevent double submit:
  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
      if (!submitExamMutation.isPending) {
        submitExamMutation.mutate();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitExamMutation.isPending]); // Included isPending in deps

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Exam not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (window.confirm("Are you sure you want to submit the exam?")) {
      submitExamMutation.mutate();
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{exam.examName}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestionIndex + 1} of {exam.questions.length}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
          <Clock className="h-5 w-5" />
          <span className="font-mono text-lg">{timeLeft !== null ? formatTime(timeLeft) : "00:00:00"}</span>
        </div>
      </div>

      <Progress value={progress} className="mb-6" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQuestion.question}
          </CardTitle>
          <CardDescription>
            Marks: {currentQuestion.marks}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="A" id="optionA" />
              <Label htmlFor="optionA" className="cursor-pointer">A. {currentQuestion.optionA}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="B" id="optionB" />
              <Label htmlFor="optionB" className="cursor-pointer">B. {currentQuestion.optionB}</Label>
            </div>
            {currentQuestion.optionC && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="C" id="optionC" />
                <Label htmlFor="optionC" className="cursor-pointer">C. {currentQuestion.optionC}</Label>
              </div>
            )}
            {currentQuestion.optionD && (
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="D" id="optionD" />
                <Label htmlFor="optionD" className="cursor-pointer">D. {currentQuestion.optionD}</Label>
              </div>
            )}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        <div className="flex gap-2">
          {currentQuestionIndex === exam.questions.length - 1 ? (
            <Button 
              onClick={handleSubmit} 
              variant="default" 
              disabled={submitExamMutation.isPending}
            >
              {submitExamMutation.isPending ? "Submitting..." : "Submit Exam"}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!answers[currentQuestion.id]}>
              Next
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm text-muted-foreground mb-2">Question Navigator</p>
        <div className="flex flex-wrap gap-2">
          {exam.questions.map((q: any, index: number) => (
            <Button
              key={q.id}
              variant={currentQuestionIndex === index ? "default" : answers[q.id] ? "secondary" : "outline"}
              size="sm"
              className="w-10 h-10"
              onClick={() => setCurrentQuestionIndex(index)}
            >
              {index + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}