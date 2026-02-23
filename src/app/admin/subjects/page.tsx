// app/admin/subjects/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit, ChevronRight, BookOpen, Layers } from "lucide-react";

export default function AdminSubjectsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("subjects");
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);

  // Subjects
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectDesc, setSubjectDesc] = useState("");

  // Chapters
  const [isChapterOpen, setIsChapterOpen] = useState(false);
  const [chapterName, setChapterName] = useState("");
  const [chapterDesc, setChapterDesc] = useState("");

  // Subconcepts
  const [isSubconceptOpen, setIsSubconceptOpen] = useState(false);
  const [subconceptName, setSubconceptName] = useState("");
  const [subconceptDesc, setSubconceptDesc] = useState("");

  // Queries
  const { data: subjects, refetch: refetchSubjects } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => {
      const res = await fetch("/api/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects");
      return res.json();
    },
  });

  const { data: chapters, refetch: refetchChapters } = useQuery({
    queryKey: ["admin-chapters", selectedSubject?.id],
    queryFn: async () => {
      if (!selectedSubject?.id) return [];
      const res = await fetch(`/api/chapters?subjectId=${selectedSubject.id}`);
      if (!res.ok) throw new Error("Failed to fetch chapters");
      return res.json();
    },
    enabled: !!selectedSubject?.id,
  });

  const { data: subconcepts, refetch: refetchSubconcepts } = useQuery({
    queryKey: ["admin-subconcepts", selectedChapter?.id],
    queryFn: async () => {
      if (!selectedChapter?.id) return [];
      const res = await fetch(`/api/subconcepts?chapterId=${selectedChapter.id}`);
      if (!res.ok) throw new Error("Failed to fetch subconcepts");
      return res.json();
    },
    enabled: !!selectedChapter?.id,
  });

  // Mutations
  const createSubject = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: subjectName, description: subjectDesc }),
      });
      if (!res.ok) throw new Error("Failed to create subject");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Subject created" });
      setIsSubjectOpen(false);
      setSubjectName("");
      setSubjectDesc("");
      refetchSubjects();
    },
  });

  const deleteSubject = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete subject");
    },
    onSuccess: () => {
      toast({ title: "Subject deleted" });
      refetchSubjects();
      if (selectedSubject) setSelectedSubject(null);
    },
  });

  const createChapter = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedSubject.id,
          name: chapterName,
          description: chapterDesc,
        }),
      });
      if (!res.ok) throw new Error("Failed to create chapter");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Chapter created" });
      setIsChapterOpen(false);
      setChapterName("");
      setChapterDesc("");
      refetchChapters();
    },
  });

  const deleteChapter = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/chapters/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete chapter");
    },
    onSuccess: () => {
      toast({ title: "Chapter deleted" });
      refetchChapters();
      if (selectedChapter) setSelectedChapter(null);
    },
  });

  const createSubconcept = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/subconcepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId: selectedChapter.id,
          name: subconceptName,
          description: subconceptDesc,
        }),
      });
      if (!res.ok) throw new Error("Failed to create subconcept");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Subconcept created" });
      setIsSubconceptOpen(false);
      setSubconceptName("");
      setSubconceptDesc("");
      refetchSubconcepts();
    },
  });

  const deleteSubconcept = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/subconcepts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete subconcept");
    },
    onSuccess: () => {
      toast({ title: "Subconcept deleted" });
      refetchSubconcepts();
    },
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Academic Hierarchy</h1>
        <p className="text-muted-foreground mt-1">Manage Subjects, Chapters, and Sub-concepts</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left sidebar - Subject list */}
        <div className="col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Subjects</CardTitle>
              <Dialog open={isSubjectOpen} onOpenChange={setIsSubjectOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder="Subject name"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                    />
                    <Textarea
                      placeholder="Description (optional)"
                      value={subjectDesc}
                      onChange={(e) => setSubjectDesc(e.target.value)}
                    />
                    <Button
                      onClick={() => createSubject.mutate()}
                      disabled={!subjectName.trim()}
                      className="w-full"
                    >
                      Create Subject
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {subjects?.map((subject: any) => (
                  <div
                    key={subject.id}
                    className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 ${
                      selectedSubject?.id === subject.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedSubject(subject)}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{subject.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete subject "${subject.name}"?`)) {
                          deleteSubject.mutate(subject.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle - Chapters */}
        <div className="col-span-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {selectedSubject ? (
                  <div className="flex items-center gap-2">
                    <span>{selectedSubject.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Chapters</span>
                  </div>
                ) : (
                  "Chapters"
                )}
              </CardTitle>
              {selectedSubject && (
                <Dialog open={isChapterOpen} onOpenChange={setIsChapterOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Chapter to {selectedSubject.name}</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input
                        placeholder="Chapter name"
                        value={chapterName}
                        onChange={(e) => setChapterName(e.target.value)}
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        value={chapterDesc}
                        onChange={(e) => setChapterDesc(e.target.value)}
                      />
                      <Button
                        onClick={() => createChapter.mutate()}
                        disabled={!chapterName.trim()}
                        className="w-full"
                      >
                        Create Chapter
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {!selectedSubject ? (
                <p className="text-center text-muted-foreground py-8">Select a subject first</p>
              ) : (
                <div className="divide-y">
                  {chapters?.map((chapter: any) => (
                    <div
                      key={chapter.id}
                      className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 ${
                        selectedChapter?.id === chapter.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedChapter(chapter)}
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span>{chapter.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete chapter "${chapter.name}"?`)) {
                            deleteChapter.mutate(chapter.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right - Subconcepts */}
        <div className="col-span-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {selectedChapter ? (
                  <div className="flex items-center gap-2">
                    <span>{selectedChapter.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Sub-concepts</span>
                  </div>
                ) : (
                  "Sub-concepts"
                )}
              </CardTitle>
              {selectedChapter && (
                <Dialog open={isSubconceptOpen} onOpenChange={setIsSubconceptOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Sub-concept to {selectedChapter.name}</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input
                        placeholder="Sub-concept name"
                        value={subconceptName}
                        onChange={(e) => setSubconceptName(e.target.value)}
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        value={subconceptDesc}
                        onChange={(e) => setSubconceptDesc(e.target.value)}
                      />
                      <Button
                        onClick={() => createSubconcept.mutate()}
                        disabled={!subconceptName.trim()}
                        className="w-full"
                      >
                        Create Sub-concept
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {!selectedChapter ? (
                <p className="text-center text-muted-foreground py-8">Select a chapter first</p>
              ) : (
                <div className="divide-y">
                  {subconcepts?.map((sc: any) => (
                    <div key={sc.id} className="flex items-center justify-between p-3">
                      <span>{sc.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete sub-concept "${sc.name}"?`)) {
                            deleteSubconcept.mutate(sc.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}