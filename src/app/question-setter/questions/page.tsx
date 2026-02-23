"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, Search, Edit2, Trash2, BookOpen } from "lucide-react";

export default function ManageQuestionsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search,     setSearch]     = useState("");
  const [subjFilter, setSubjFilter] = useState("");
  const [diffFilter, setDiffFilter] = useState("");
  const [deleting,   setDeleting]   = useState<number | null>(null);

  const { data: questions, isLoading } = useQuery({
    queryKey: ["my-questions"],
    queryFn: () => fetch("/api/questions?createdByMe=true").then(r => r.json()),
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetch("/api/subjects").then(r => r.json()),
  });

  const deleteQ = async (id: number) => {
    if (!confirm("Delete this question?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      qc.invalidateQueries({ queryKey: ["my-questions"] });
      toast({ title: "Question deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally { setDeleting(null); }
  };

  const filtered = (questions ?? []).filter((q: any) => {
    const matchSearch = !search ||
      q.question.toLowerCase().includes(search.toLowerCase());
    const matchSubj = !subjFilter || String(q.subjectId) === subjFilter;
    const matchDiff = !diffFilter || q.difficulty === diffFilter;
    return matchSearch && matchSubj && matchDiff;
  });

  const inp: React.CSSProperties = {
    background: "var(--input-bg)", border: "1.5px solid var(--border)",
    color: "var(--text)", borderRadius: "0.5rem", outline: "none",
    fontSize: "0.8rem", padding: "0 0.75rem", height: "2rem",
    transition: "border-color 0.15s",
  };

  const diffStyle: Record<string, { bg: string; color: string }> = {
    easy:   { bg: "var(--green-bg)", color: "var(--green)" },
    medium: { bg: "var(--amber-bg)", color: "var(--amber)" },
    hard:   { bg: "var(--red-bg)",   color: "var(--red)"   },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
            My Questions
          </h1>
          <p style={{ fontSize: "0.78rem", color: "var(--text3)", margin: 0 }}>
            {filtered.length} question{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/question-setter/questions/create">
          <button style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.5rem 1rem", borderRadius: "0.5rem",
            background: "var(--accent)", border: "none",
            color: "#fff", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
          }}>
            <PlusCircle size={14} /> Add Question
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "0.875rem 1.25rem",
        display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center",
      }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={13} style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search questions…"
            style={{ ...inp, paddingLeft: "1.85rem", width: "100%", boxSizing: "border-box" }} />
        </div>
        <select value={subjFilter} onChange={e => setSubjFilter(e.target.value)}
          style={{ ...inp, width: "150px", appearance: "none" }}>
          <option value="">All subjects</option>
          {subjects?.map((s: any) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
        </select>
        <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)}
          style={{ ...inp, width: "130px", appearance: "none" }}>
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        {(search || subjFilter || diffFilter) && (
          <button onClick={() => { setSearch(""); setSubjFilter(""); setDiffFilter(""); }}
            style={{ ...inp, width: "auto", padding: "0 0.75rem", cursor: "pointer", color: "var(--red)", borderColor: "var(--red)", background: "var(--red-bg)" }}>
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", overflow: "hidden",
      }}>
        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)", fontSize: "0.85rem" }}>
            No questions found.{" "}
            <Link href="/question-setter/questions/create" style={{ color: "var(--accent)" }}>
              Create one →
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
                  {["Question", "Subject", "Chapter", "Difficulty", "Marks", "Type", "Actions"].map(h => (
                    <th key={h} style={{
                      padding: "0.65rem 1rem", textAlign: "left",
                      fontSize: "0.65rem", fontWeight: 700,
                      color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em",
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((q: any) => {
                  const ds = diffStyle[q.difficulty] ?? { bg: "var(--surface2)", color: "var(--text3)" };
                  return (
                    <tr key={q.id}
                      style={{ borderBottom: "1px solid var(--border)", transition: "background 0.12s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "0.8rem 1rem", maxWidth: "320px" }}>
                        <p style={{
                          fontSize: "0.8rem", fontWeight: 500, color: "var(--text)", margin: 0,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>{q.question}</p>
                        {q.questionImage && (
                          <span style={{ fontSize: "0.62rem", color: "var(--text3)", display: "flex", alignItems: "center", gap: "0.2rem", marginTop: "0.2rem" }}>
                            <BookOpen size={9} /> has image
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "0.8rem 1rem", fontSize: "0.78rem", color: "var(--text2)", whiteSpace: "nowrap" }}>
                        {q.subject?.name ?? "—"}
                      </td>
                      <td style={{ padding: "0.8rem 1rem", fontSize: "0.75rem", color: "var(--text3)", whiteSpace: "nowrap" }}>
                        {q.chapter?.name ?? <span style={{ fontStyle: "italic", color: "var(--text3)" }}>General</span>}
                      </td>
                      <td style={{ padding: "0.8rem 1rem" }}>
                        <span style={{
                          fontSize: "0.67rem", fontWeight: 700, padding: "0.18rem 0.5rem",
                          borderRadius: "999px", background: ds.bg, color: ds.color,
                          textTransform: "capitalize",
                        }}>{q.difficulty}</span>
                      </td>
                      <td style={{ padding: "0.8rem 1rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--accent)" }}>
                        {q.marks}
                      </td>
                      <td style={{ padding: "0.8rem 1rem" }}>
                        {q.isMultipleAnswer ? (
                          <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem", borderRadius: "999px", background: "var(--accent-bg)", color: "var(--accent)", border: "1px solid var(--accent-dim)" }}>
                            MSQ
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>Single</span>
                        )}
                      </td>
                      <td style={{ padding: "0.8rem 1rem" }}>
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                          <Link href={`/question-setter/questions/${q.id}/edit`}>
                            <button style={{
                              padding: "0.28rem 0.55rem", borderRadius: "0.35rem",
                              background: "var(--surface2)", border: "1px solid var(--border)",
                              color: "var(--text2)", cursor: "pointer",
                              display: "flex", alignItems: "center", gap: "0.25rem",
                              fontSize: "0.7rem", fontWeight: 600,
                            }}>
                              <Edit2 size={11} /> Edit
                            </button>
                          </Link>
                          <button
                            onClick={() => deleteQ(q.id)}
                            disabled={deleting === q.id}
                            style={{
                              padding: "0.28rem 0.55rem", borderRadius: "0.35rem",
                              background: "var(--red-bg)", border: "1px solid var(--red)",
                              color: "var(--red)", cursor: deleting === q.id ? "not-allowed" : "pointer",
                              display: "flex", alignItems: "center", gap: "0.25rem",
                              fontSize: "0.7rem", fontWeight: 600,
                            }}>
                            <Trash2 size={11} />
                            {deleting === q.id ? "…" : "Del"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}