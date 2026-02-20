// src/app/(dashboard)/question-setter/questions/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../../components/ui/dialog";
import { useToast } from "../../../../components/ui/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { QuestionFormData } from "../../../../types";

export default function QuestionsPage() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");

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
      if (!selectedSubject) return [];
      const res = await fetch(`/api/chapters?subjectId=${selectedSubject}`);
      if (!res.ok) throw new Error("Failed to fetch chapters");
      return res.json();
    },
    enabled: !!selectedSubject,
  });

  const { data: questions, refetch } = useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const res = await fetch("/api/questions");
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create question");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question created successfully",
      });
      setIsOpen(false);
      refetch();
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: QuestionFormData }) => {
      const res = await fetch(`/api/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update question");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
      setIsOpen(false);
      setEditingQuestion(null);
      refetch();
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete question");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: QuestionFormData = {
      subjectId: parseInt(formData.get("subjectId") as string),
      chapterId: formData.get("chapterId") ? parseInt(formData.get("chapterId") as string) : undefined,
      question: formData.get("question") as string,
      optionA: formData.get("optionA") as string,
      optionB: formData.get("optionB") as string,
      optionC: formData.get("optionC") as string || undefined,
      optionD: formData.get("optionD") as string || undefined,
      correctAnswer: formData.get("correctAnswer") as string,
      explanation: formData.get("explanation") as string || undefined,
      marks: parseInt(formData.get("marks") as string),
      difficulty: formData.get("difficulty") as "easy" | "medium" | "hard",
    };

    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Question Bank</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? "Edit Question" : "Create New Question"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subjectId">Subject</Label>
                  <Select
                    name="subjectId"
                    defaultValue={editingQuestion?.subjectId?.toString()}
                    onValueChange={setSelectedSubject}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((subject: any) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chapterId">Chapter (Optional)</Label>
                  <Select
                    name="chapterId"
                    defaultValue={editingQuestion?.chapterId?.toString()}
                    onValueChange={setSelectedChapter}
                    disabled={!selectedSubject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      {chapters?.map((chapter: any) => (
                        <SelectItem key={chapter.id} value={chapter.id.toString()}>
                          {chapter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  name="question"
                  defaultValue={editingQuestion?.question}
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="optionA">Option A *</Label>
                  <Input
                    id="optionA"
                    name="optionA"
                    defaultValue={editingQuestion?.optionA}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="optionB">Option B *</Label>
                  <Input
                    id="optionB"
                    name="optionB"
                    defaultValue={editingQuestion?.optionB}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="optionC">Option C</Label>
                  <Input
                    id="optionC"
                    name="optionC"
                    defaultValue={editingQuestion?.optionC || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="optionD">Option D</Label>
                  <Input
                    id="optionD"
                    name="optionD"
                    defaultValue={editingQuestion?.optionD || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="correctAnswer">Correct Answer</Label>
                  <Select
                    name="correctAnswer"
                    defaultValue={editingQuestion?.correctAnswer}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    name="difficulty"
                    defaultValue={editingQuestion?.difficulty || "medium"}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marks">Marks</Label>
                  <Input
                    id="marks"
                    name="marks"
                    type="number"
                    min="1"
                    defaultValue={editingQuestion?.marks || 1}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation">Explanation (Optional)</Label>
                <Textarea
                  id="explanation"
                  name="explanation"
                  defaultValue={editingQuestion?.explanation || ""}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingQuestion ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions?.map((question: any) => (
                <TableRow key={question.id}>
                  <TableCell>{question.id}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {question.question}
                  </TableCell>
                  <TableCell>{question.subject?.name}</TableCell>
                  <TableCell>{question.marks}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.difficulty}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingQuestion(question);
                          setIsOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm("Are you sure?")) {
                            deleteQuestionMutation.mutate(question.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}