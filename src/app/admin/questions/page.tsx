"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, Pencil, Trash2, Search, Filter, 
  Eye, ChevronDown, ChevronUp, Copy, FileQuestion,
  BookOpen, Layers, Clock, CheckCircle, XCircle
} from "lucide-react";

export default function AdminQuestionsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    subjectId: "all",
    chapterId: "all",
    difficulty: "all",
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Debounce search to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

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
    queryKey: ["admin-questions", filters, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.subjectId !== "all") params.append("subjectId", filters.subjectId);
      if (filters.chapterId !== "all") params.append("chapterId", filters.chapterId);
      if (filters.difficulty !== "all") params.append("difficulty", filters.difficulty);
      if (debouncedSearch) params.append("search", debouncedSearch);
      
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

  const difficultyColors: Record<string, string> = {
    easy: "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20",
    medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20",
    hard: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
  };

  const stats = {
    total: questions?.length || 0,
    easy: questions?.filter((q: any) => q.difficulty === "easy").length || 0,
    medium: questions?.filter((q: any) => q.difficulty === "medium").length || 0,
    hard: questions?.filter((q: any) => q.difficulty === "hard").length || 0,
    subjects: new Set(questions?.map((q: any) => q.subject?.name)).size || 0,
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Question Bank</h1>
          <p className="text-[var(--text2)] mt-2 text-lg">Manage and organize all questions</p>
        </div>
        <Link href="/admin/questions/create">
          <button className="px-6 py-3 bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-dim)] transition-all flex items-center gap-2">
            <Plus size={20} /> Create New Question
          </button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: "Total", val: stats.total, icon: FileQuestion, color: "blue" },
          { label: "Easy", val: stats.easy, icon: CheckCircle, color: "green" },
          { label: "Medium", val: stats.medium, icon: Clock, color: "yellow" },
          { label: "Hard", val: stats.hard, icon: XCircle, color: "red" },
          { label: "Subjects", val: stats.subjects, icon: Layers, color: "purple" }
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center`}>
                <stat.icon size={16} className={`text-${stat.color}-600`} />
              </div>
              <span className="text-xs text-[var(--text2)]">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text)]">{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text3)]" />
            <input
              type="text"
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--input-bg)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select
            value={filters.subjectId}
            onChange={(e) => setFilters({ ...filters, subjectId: e.target.value, chapterId: "all" })}
            className="px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--input-bg)]"
          >
            <option value="all">All Subjects</option>
            {subjects?.map((s: any) => <option key={s.id} value={s.id.toString()}>{s.name}</option>)}
          </select>

          <select
            value={filters.chapterId}
            onChange={(e) => setFilters({ ...filters, chapterId: e.target.value })}
            disabled={filters.subjectId === "all"}
            className="px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] disabled:opacity-50"
          >
            <option value="all">All Chapters</option>
            {chapters?.map((c: any) => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
          </select>

          <select
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            className="px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--input-bg)]"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {questions?.map((q: any) => (
              <div key={q.id} className="hover:bg-[var(--surface2)] transition-colors">
                <div className="p-6 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${difficultyColors[q.difficulty]}`}>{q.difficulty}</span>
                      <span className="text-xs text-[var(--text2)]">ID: {q.id} • {q.marks} Marks</span>
                    </div>
                    <p className="text-lg font-medium text-[var(--text)]">{q.question}</p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => setExpandedId(expandedId === q.id ? null : q.id)} className="p-2 hover:bg-[var(--accent-bg)] rounded-lg">
                      {expandedId === q.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <Link href={`/admin/questions/${q.id}/edit`} className="p-2 hover:bg-[var(--accent-bg)] rounded-lg"><Pencil size={18} /></Link>
                    <button onClick={() => confirm("Delete?") && deleteMutation.mutate(q.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {expandedId === q.id && (
                  <div className="px-6 pb-6 pt-4 border-t border-[var(--border)] bg-[var(--surface2)]/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">Options</h4>
                        <div className="space-y-2">
                          {[
                            { letter: 'A', text: q.optionA, img: q.optionAImage },
                            { letter: 'B', text: q.optionB, img: q.optionBImage },
                            { letter: 'C', text: q.optionC, img: q.optionCImage },
                            { letter: 'D', text: q.optionD, img: q.optionDImage },
                          ].filter(o => o.text).map((opt) => (
                            <div key={opt.letter} className={`p-3 rounded-lg border ${q.correctAnswer.includes(opt.letter) ? 'bg-green-500/10 border-green-500/30' : 'bg-[var(--surface)] border-[var(--border)]'}`}>
                              <div className="flex gap-3">
                                <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs ${q.correctAnswer.includes(opt.letter) ? 'bg-green-500 text-white' : 'bg-[var(--border)]'}`}>{opt.letter}</span>
                                <div>
                                  <p className="text-sm">{opt.text}</p>
                                  {opt.img && <img src={opt.img} className="mt-2 max-h-32 rounded" alt="" />}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Explanation</h4>
                        <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-sm text-[var(--text2)]">
                          {q.explanation || "No explanation provided."}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}