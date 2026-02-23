// app/admin/subjects/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, Trash2, BookOpen, Layers, 
  ChevronRight, FileText 
} from "lucide-react";
import Link from "next/link";

export default function AdminSubjectsPage() {
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isChapterOpen, setIsChapterOpen] = useState(false);
  const [isSubconceptOpen, setIsSubconceptOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectDesc, setSubjectDesc] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [chapterDesc, setChapterDesc] = useState("");
  const [subconceptName, setSubconceptName] = useState("");
  const [subconceptDesc, setSubconceptDesc] = useState("");

  // Queries
  const { data: subjects, refetch: refetchSubjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => {
      const res = await fetch("/api/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects");
      return res.json();
    },
  });

  const { data: chapters, refetch: refetchChapters, isLoading: chaptersLoading } = useQuery({
    queryKey: ["admin-chapters", selectedSubject?.id],
    queryFn: async () => {
      if (!selectedSubject?.id) return [];
      const res = await fetch(`/api/chapters?subjectId=${selectedSubject.id}`);
      if (!res.ok) throw new Error("Failed to fetch chapters");
      return res.json();
    },
    enabled: !!selectedSubject?.id,
  });

  const { data: subconcepts, refetch: refetchSubconcepts, isLoading: subconceptsLoading } = useQuery({
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
      toast({ title: "Subject created successfully" });
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
      toast({ title: "Chapter created successfully" });
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
      toast({ title: "Subconcept created successfully" });
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

  const statCards = [
    { 
      label: "Total Subjects", 
      value: subjects?.length ?? 0, 
      icon: BookOpen,
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400"
    },
    { 
      label: "Total Chapters", 
      value: subjects?.reduce((acc: number, s: any) => acc + (s._count?.chapters || 0), 0) ?? 0, 
      icon: Layers,
      bg: "bg-green-500/10",
      text: "text-green-600 dark:text-green-400"
    },
    { 
      label: "Total Questions", 
      value: subjects?.reduce((acc: number, s: any) => acc + (s._count?.questions || 0), 0) ?? 0, 
      icon: FileText,
      bg: "bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400"
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text)]">Academic Hierarchy</h1>
        <p className="text-[var(--text2)] mt-2">Manage Subjects, Chapters, and Sub-concepts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.text}`} />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--text)]">{stat.value}</div>
                <p className="text-sm text-[var(--text2)] mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Subjects Column */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <h2 className="font-semibold text-[var(--text)]">Subjects</h2>
            <button
              onClick={() => setIsSubjectOpen(true)}
              className="p-2 text-[var(--text2)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {subjectsLoading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : subjects?.length === 0 ? (
              <div className="p-8 text-center text-[var(--text2)]">
                No subjects yet
              </div>
            ) : (
              subjects?.map((subject: any) => (
                <div
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject)}
                  className={`p-4 cursor-pointer hover:bg-[var(--surface2)] transition-colors flex justify-between items-center ${
                    selectedSubject?.id === subject.id ? 'bg-[var(--accent-bg)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-[var(--accent)]" />
                    <span className="text-[var(--text)]">{subject.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete subject "${subject.name}"?`)) {
                        deleteSubject.mutate(subject.id);
                      }
                    }}
                    className="p-1 text-[var(--text2)] hover:text-[var(--red)] hover:bg-[var(--red-bg)] rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chapters Column */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <h2 className="font-semibold text-[var(--text)]">
              {selectedSubject ? (
                <div className="flex items-center gap-2">
                  <span>{selectedSubject.name}</span>
                  <ChevronRight size={14} className="text-[var(--text3)]" />
                  <span className="text-[var(--text2)]">Chapters</span>
                </div>
              ) : (
                "Chapters"
              )}
            </h2>
            {selectedSubject && (
              <button
                onClick={() => setIsChapterOpen(true)}
                className="p-2 text-[var(--text2)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
          <div className="divide-y divide-[var(--border)]">
            {!selectedSubject ? (
              <div className="p-8 text-center text-[var(--text2)]">
                Select a subject first
              </div>
            ) : chaptersLoading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : chapters?.length === 0 ? (
              <div className="p-8 text-center text-[var(--text2)]">
                No chapters yet
              </div>
            ) : (
              chapters?.map((chapter: any) => (
                <div
                  key={chapter.id}
                  onClick={() => setSelectedChapter(chapter)}
                  className={`p-4 cursor-pointer hover:bg-[var(--surface2)] transition-colors flex justify-between items-center ${
                    selectedChapter?.id === chapter.id ? 'bg-[var(--accent-bg)]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Layers size={16} className="text-[var(--accent)]" />
                    <span className="text-[var(--text)]">{chapter.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete chapter "${chapter.name}"?`)) {
                        deleteChapter.mutate(chapter.id);
                      }
                    }}
                    className="p-1 text-[var(--text2)] hover:text-[var(--red)] hover:bg-[var(--red-bg)] rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Subconcepts Column */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
            <h2 className="font-semibold text-[var(--text)]">
              {selectedChapter ? (
                <div className="flex items-center gap-2">
                  <span>{selectedChapter.name}</span>
                  <ChevronRight size={14} className="text-[var(--text3)]" />
                  <span className="text-[var(--text2)]">Sub-concepts</span>
                </div>
              ) : (
                "Sub-concepts"
              )}
            </h2>
            {selectedChapter && (
              <button
                onClick={() => setIsSubconceptOpen(true)}
                className="p-2 text-[var(--text2)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
          <div className="divide-y divide-[var(--border)]">
            {!selectedChapter ? (
              <div className="p-8 text-center text-[var(--text2)]">
                Select a chapter first
              </div>
            ) : subconceptsLoading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : subconcepts?.length === 0 ? (
              <div className="p-8 text-center text-[var(--text2)]">
                No sub-concepts yet
              </div>
            ) : (
              subconcepts?.map((sc: any) => (
                <div
                  key={sc.id}
                  className="p-4 flex justify-between items-center hover:bg-[var(--surface2)] transition-colors"
                >
                  <span className="text-[var(--text)]">{sc.name}</span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete sub-concept "${sc.name}"?`)) {
                        deleteSubconcept.mutate(sc.id);
                      }
                    }}
                    className="p-1 text-[var(--text2)] hover:text-[var(--red)] hover:bg-[var(--red-bg)] rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Modals (simplified for brevity - add your dialog components here) */}
    </div>
  );
}