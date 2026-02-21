"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
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
  examName: z.string().min(3, "Exam name must be at least 3 characters"),
  description: z.string().optional(),
  subjectId: z.string().min(1, "Subject is required"),
  gradeLevel: z.string().optional(),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  totalMarks: z.coerce.number().min(1).optional(),
  passingMarks: z.coerce.number().min(1).optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditExamPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ["exam", id],
    queryFn: async () => {
      const res = await fetch(`/api/exams/${id}`);
      if (!res.ok) throw new Error("Failed to fetch exam");
      return res.json();
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await fetch("/api/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects");
      return res.json();
    },
  });

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Populate form once exam data is loaded
  useEffect(() => {
    if (exam) {
      reset({
        examName: exam.examName,
        description: exam.description ?? "",
        subjectId: String(exam.subjectId),
        gradeLevel: exam.gradeLevel ?? "",
        duration: exam.duration,
        totalMarks: exam.totalMarks ?? undefined,
        passingMarks: exam.passingMarks ?? undefined,
      });
    }
  }, [exam, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/exams/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, subjectId: parseInt(data.subjectId) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update exam");
      }
      toast({ title: "Success", description: "Exam updated successfully" });
      router.push(`/teacher/exams/${id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (examLoading) return <div className="flex items-center justify-center min-h-screen"><p>Loading...</p></div>;

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/teacher/exams/${id}`}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit Exam</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Exam Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="examName">Exam Name *</Label>
              <Input id="examName" {...register("examName")} disabled={isSubmitting} />
              {errors.examName && <p className="text-sm text-red-500">{errors.examName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} disabled={isSubmitting} rows={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Controller name="subjectId" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
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
                <Label htmlFor="gradeLevel">Grade Level</Label>
                <Input id="gradeLevel" {...register("gradeLevel")} disabled={isSubmitting} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input id="duration" type="number" min={1} {...register("duration")} disabled={isSubmitting} />
                {errors.duration && <p className="text-sm text-red-500">{errors.duration.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks</Label>
                <Input id="totalMarks" type="number" min={1} {...register("totalMarks")} disabled={isSubmitting} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passingMarks">Passing Marks</Label>
                <Input id="passingMarks" type="number" min={1} {...register("passingMarks")} disabled={isSubmitting} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href={`/teacher/exams/${id}`}>
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}