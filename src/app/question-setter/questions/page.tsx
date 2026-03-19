"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp, FileQuestion, Layers, Clock, CheckCircle, XCircle } from "lucide-react";

// ─── KaTeX renderer ───────────────────────────────────────────────────────────
function KaTeXDisplay({ text, inline = false }: { text: string; inline?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current || !text) return;
    import("katex").then((katex) => {
      let html = text
        .replace(/\$\$(.+?)\$\$/gs, (_, expr) => {
          try { return katex.default.renderToString(expr, { displayMode: true, throwOnError: false }); } catch { return _; }
        })
        .replace(/\$(.+?)\$/g, (_, expr) => {
          try { return katex.default.renderToString(expr, { displayMode: false, throwOnError: false }); } catch { return _; }
        });
      if (ref.current) ref.current.innerHTML = html;
    });
  }, [text]);
  return <span ref={ref} style={{ fontSize: inline ? "0.85rem" : "1rem", lineHeight: 1.6, color: "var(--text)" }} />;
}

export default function AdminQuestionsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({ subjectId: "all", chapterId: "all", difficulty: "all" });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: subjects } = useQuery({ queryKey: ["subjects"], queryFn: () => fetch("/api/subjects").then(r => r.json()) });
  const { data: chapters } = useQuery({
    queryKey: ["chapters", filters.subjectId],
    queryFn: () => fetch(`/api/chapters?subjectId=${filters.subjectId}`).then(r => r.json()),
    enabled: filters.subjectId !== "all",
  });

  const { data: questions, refetch, isLoading } = useQuery({
    queryKey: ["admin-questions", filters, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.subjectId !== "all") params.append("subjectId", filters.subjectId);
      if (filters.chapterId !== "all") params.append("chapterId", filters.chapterId);
      if (filters.difficulty !== "all") params.append("difficulty", filters.difficulty);
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("createdByMe", "true");
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
    onSuccess: () => { toast({ title: "Question deleted" }); refetch(); },
    onError: () => toast({ title: "Error", description: "Failed to delete", variant: "destructive" }),
  });

  const diffColors: Record<string, { bg: string; color: string }> = {
    easy:   { bg: "var(--green-bg)", color: "var(--green)" },
    medium: { bg: "var(--amber-bg)", color: "var(--amber)" },
    hard:   { bg: "var(--red-bg)",   color: "var(--red)"   },
  };

  const stats = {
    total:    questions?.length || 0,
    easy:     questions?.filter((q: any) => q.difficulty === "easy").length   || 0,
    medium:   questions?.filter((q: any) => q.difficulty === "medium").length || 0,
    hard:     questions?.filter((q: any) => q.difficulty === "hard").length   || 0,
    subjects: new Set(questions?.map((q: any) => q.subject?.name)).size       || 0,
  };

  return (
 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* KaTeX CSS */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "0.65rem", fontWeight: 700, margin: 0, color: "var(--text)" }}>Question Bank</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text2)", marginTop: "0.25rem" }}>Manage and organize all questions</p>
        </div>
        <Link href="/question-setter/questions/create">
          <button style={{ padding: "0.6rem 1.2rem", borderRadius: "0.5rem", background: "var(--accent)", border: "none", color: "#fff", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus size={16} /> Create Question
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "0.875rem" }}>
        {[
          { label: "Total",    val: stats.total,    Icon: FileQuestion, color: "var(--accent)", bg: "var(--accent-bg)" },
          { label: "Easy",     val: stats.easy,     Icon: CheckCircle,  color: "var(--green)",  bg: "var(--green-bg)"  },
          { label: "Medium",   val: stats.medium,   Icon: Clock,        color: "var(--amber)",  bg: "var(--amber-bg)"  },
          { label: "Hard",     val: stats.hard,     Icon: XCircle,      color: "var(--red)",    bg: "var(--red-bg)"    },
          { label: "Subjects", val: stats.subjects, Icon: Layers,       color: "var(--accent)", bg: "var(--accent-bg)" },
        ].map(({ label, val, Icon, color, bg }) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem 1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <div style={{ width: "1.75rem", height: "1.75rem", borderRadius: "0.4rem", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={13} color={color} />
              </div>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" }}>{label}</span>
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text)" }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem", display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, position: "relative", minWidth: "200px" }}>
          <Search size={13} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
          <input type="text" placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", height: "2.25rem", paddingLeft: "2.1rem", paddingRight: "0.875rem", borderRadius: "0.5rem", border: "1.5px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }} />
        </div>
        {[
          { key: "subjectId", label: "All Subjects", options: subjects?.map((s: any) => ({ val: String(s.id), label: s.name })) || [] },
          { key: "chapterId", label: "All Chapters", options: chapters?.map((c: any) => ({ val: String(c.id), label: c.name })) || [], disabled: filters.subjectId === "all" },
          { key: "difficulty", label: "All Difficulties", options: ["easy","medium","hard"].map(d => ({ val: d, label: d.charAt(0).toUpperCase()+d.slice(1) })) },
        ].map(({ key, label, options, disabled }) => (
          <select key={key} value={(filters as any)[key]} disabled={disabled}
            onChange={(e) => setFilters(f => ({ ...f, [key]: e.target.value, ...(key === "subjectId" ? { chapterId: "all" } : {}) }))}
            style={{ height: "2.25rem", padding: "0 0.875rem", borderRadius: "0.5rem", border: "1.5px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontSize: "0.82rem", outline: "none", opacity: disabled ? 0.5 : 1 }}>
            <option value="all">{label}</option>
            {options.map((o: any) => <option key={o.val} value={o.val}>{o.label}</option>)}
          </select>
        ))}
      </div>

      {/* Questions list */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <div style={{ width: "2rem", height: "2rem", border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          </div>
        ) : !questions?.length ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)", fontSize: "0.85rem" }}>
            No questions found.{" "}
            <Link href="/question-setter/questions/create" style={{ color: "var(--accent)" }}>Create the first one</Link>
          </div>
        ) : questions.map((q: any, i: number) => {
          const dc = diffColors[q.difficulty] ?? diffColors.medium;
          const expanded = expandedId === q.id;
          return (
            <div key={q.id} style={{ borderBottom: i < questions.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "flex-start", gap: "0.875rem", transition: "background 0.12s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                    <span style={{ padding: "0.18rem 0.5rem", borderRadius: "999px", fontSize: "0.65rem", fontWeight: 700, background: dc.bg, color: dc.color }}>{q.difficulty}</span>
                    <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>#{q.id} · {q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                    {q.subject?.name && <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>· {q.subject.name}</span>}
                  </div>
                  {/* ✅ KaTeX renders math in question text */}
                  <KaTeXDisplay text={q.question} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                  <button onClick={() => setExpandedId(expanded ? null : q.id)}
                    style={{ padding: "0.35rem", borderRadius: "0.375rem", border: "1px solid var(--border)", background: "none", color: "var(--text2)", cursor: "pointer" }}>
                    {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  <Link href={`/question-setter/questions/${q.id}/edit`}>
                    <button style={{ padding: "0.35rem", borderRadius: "0.375rem", border: "1px solid var(--border)", background: "none", color: "var(--text2)", cursor: "pointer" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-bg)"; e.currentTarget.style.color = "var(--accent)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text2)"; }}>
                      <Pencil size={14} />
                    </button>
                  </Link>
                  <button onClick={() => confirm("Delete this question?") && deleteMutation.mutate(q.id)}
                    style={{ padding: "0.35rem", borderRadius: "0.375rem", border: "1px solid var(--border)", background: "none", color: "var(--text2)", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red-bg)"; e.currentTarget.style.color = "var(--red)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text2)"; }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {expanded && (
                <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--border)", background: "var(--surface2)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                    <div>
                      <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text3)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Options</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                        {[
                          { letter: "A", text: q.optionA },
                          { letter: "B", text: q.optionB },
                          { letter: "C", text: q.optionC },
                          { letter: "D", text: q.optionD },
                        ].filter(o => o.text).map(opt => {
                          const isCorrect = q.correctAnswer?.split(",").includes(opt.letter);
                          return (
                            <div key={opt.letter} style={{ padding: "0.5rem 0.75rem", borderRadius: "0.4rem", background: isCorrect ? "var(--green-bg)" : "var(--surface)", border: `1px solid ${isCorrect ? "var(--green)" : "var(--border)"}`, display: "flex", gap: "0.5rem", alignItems: "center" }}>
                              <span style={{ width: "1.25rem", height: "1.25rem", borderRadius: "50%", background: isCorrect ? "var(--green)" : "var(--surface2)", color: isCorrect ? "#fff" : "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 }}>{opt.letter}</span>
                              <KaTeXDisplay text={opt.text} inline />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text3)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Explanation</p>
                      <div style={{ padding: "0.75rem", borderRadius: "0.4rem", background: "var(--surface)", border: "1px solid var(--border)", fontSize: "0.82rem", color: "var(--text2)" }}>
                        {q.explanation ? <KaTeXDisplay text={q.explanation} /> : "No explanation provided."}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}