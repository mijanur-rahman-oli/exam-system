"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  chapterId: z.string().optional(),
  question: z.string().min(5, "Question text is required"),
  optionA: z.string().min(1, "Option A is required"),
  optionB: z.string().min(1, "Option B is required"),
  optionC: z.string().optional(),
  optionD: z.string().optional(),
  correctAnswer: z.enum(["A", "B", "C", "D"], { required_error: "Select the correct answer" }),
  explanation: z.string().optional(),
  marks: z.coerce.number().min(1, "Marks must be at least 1").default(1),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

type FormData = z.infer<typeof schema>;

export default function CreateQuestionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await fetch("/api/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects");
      return res.json();
    },
  });

  const { data: chapters } = useQuery({
    queryKey: ["chapters", selectedSubject],
    queryFn: async () => {
      const res = await fetch(`/api/chapters?subjectId=${selectedSubject}`);
      if (!res.ok) throw new Error("Failed to fetch chapters");
      return res.json();
    },
    enabled: !!selectedSubject,
  });

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { marks: 1, difficulty: "medium" },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          subjectId: parseInt(data.subjectId),
          chapterId: data.chapterId ? parseInt(data.chapterId) : undefined,
          optionC: data.optionC || undefined,
          optionD: data.optionD || undefined,
          explanation: data.explanation || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create question");
      }
      toast({ title: "Success", description: "Question created successfully" });
      router.push("/question-setter/questions");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/question-setter/questions">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back to Questions</Button>
        </Link>
        <h1 className="text-3xl font-bold">Create Question</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Question Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Subject & Chapter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Controller name="subjectId" control={control} render={({ field }) => (
                  <Select
                    onValueChange={(v) => { field.onChange(v); setSelectedSubject(v); }}
                    value={field.value}
                  >
                    <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects?.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {errors.subjectId && <p className="text-sm text-red-500">{errors.subjectId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Chapter (Optional)</Label>
                <Controller name="chapterId" control={control} render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedSubject || !chapters?.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedSubject ? "Select subject first" : "Select chapter"} />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters?.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>

            {/* Question text */}
            <div className="space-y-2">
              <Label htmlFor="question">Question *</Label>
              <Textarea
                id="question"
                rows={3}
                placeholder="Enter the question text..."
                {...register("question")}
                disabled={isLoading}
              />
              {errors.question && <p className="text-sm text-red-500">{errors.question.message}</p>}
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="optionA">Option A *</Label>
                <Input id="optionA" placeholder="Enter option A" {...register("optionA")} disabled={isLoading} />
                {errors.optionA && <p className="text-sm text-red-500">{errors.optionA.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="optionB">Option B *</Label>
                <Input id="optionB" placeholder="Enter option B" {...register("optionB")} disabled={isLoading} />
                {errors.optionB && <p className="text-sm text-red-500">{errors.optionB.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="optionC">Option C (Optional)</Label>
                <Input id="optionC" placeholder="Enter option C" {...register("optionC")} disabled={isLoading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="optionD">Option D (Optional)</Label>
                <Input id="optionD" placeholder="Enter option D" {...register("optionD")} disabled={isLoading} />
              </div>
            </div>

            {/* Correct answer, difficulty, marks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Correct Answer *</Label>
                <Controller name="correctAnswer" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select answer" /></SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D"].map((v) => (
                        <SelectItem key={v} value={v}>Option {v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
                {errors.correctAnswer && <p className="text-sm text-red-500">{errors.correctAnswer.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Difficulty *</Label>
                <Controller name="difficulty" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marks">Marks *</Label>
                <Input
                  id="marks"
                  type="number"
                  min={1}
                  {...register("marks")}
                  disabled={isLoading}
                />
                {errors.marks && <p className="text-sm text-red-500">{errors.marks.message}</p>}
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Textarea
                id="explanation"
                rows={2}
                placeholder="Explain why this is the correct answer..."
                {...register("explanation")}
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Link href="/question-setter/questions">
                <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Question"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}