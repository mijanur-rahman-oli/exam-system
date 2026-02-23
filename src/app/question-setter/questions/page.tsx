// app/question-setter/questions/page.tsx
"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, Search, Filter } from "lucide-react";
import { useState } from "react";

export default function QuestionsListPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("");

  const { data: questions, isLoading, refetch } = useQuery({
    queryKey: ["qs-questions", search, difficulty],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("createdByMe", "true");
      if (search) params.append("search", search);
      if (difficulty) params.append("difficulty", difficulty);
      
      const res = await fetch(`/api/questions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Question deleted" });
      refetch();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const difficultyColors = {
    easy: { bg: "var(--green-bg)", color: "var(--green)" },
    medium: { bg: "var(--amber-bg)", color: "var(--amber)" },
    hard: { bg: "var(--red-bg)", color: "var(--red)" },
  };

  if (isLoading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>
        Loading questions...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
            My Questions
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text2)", marginTop: "0.25rem" }}>
            Manage your question bank
          </p>
        </div>
        <Link href="/question-setter/questions/create">
          <button style={{
            padding: "0.6rem 1.2rem", borderRadius: "0.5rem",
            background: "var(--accent)", border: "none", color: "#fff",
            fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <Plus size={16} /> New Question
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "1rem",
        display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, position: "relative", minWidth: "200px" }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", height: "2.4rem", padding: "0 2rem",
              borderRadius: "0.5rem", border: "1px solid var(--border)",
              background: "var(--input-bg)", color: "var(--text)",
              fontSize: "0.85rem", outline: "none",
            }}
          />
        </div>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          style={{
            height: "2.4rem", padding: "0 1rem", borderRadius: "0.5rem",
            border: "1px solid var(--border)", background: "var(--input-bg)",
            color: "var(--text)", fontSize: "0.85rem", outline: "none",
            minWidth: "120px",
          }}
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Questions list */}
      {!questions?.length ? (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", padding: "3rem",
          textAlign: "center", color: "var(--text3)",
        }}>
          No questions yet.{" "}
          <Link href="/question-setter/questions/create" style={{ color: "var(--accent)" }}>
            Create your first question
          </Link>
        </div>
      ) : (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, color: "var(--text2)" }}>Question</th>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", fontSize: "0.7rem", fontWeight: 700, color: "var(--text2)" }}>Subject</th>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "center", fontSize: "0.7rem", fontWeight: 700, color: "var(--text2)" }}>Difficulty</th>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "center", fontSize: "0.7rem", fontWeight: 700, color: "var(--text2)" }}>Marks</th>
                <th style={{ padding: "0.75rem 1.25rem", textAlign: "right", fontSize: "0.7rem", fontWeight: 700, color: "var(--text2)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q: any, i: number) => {
                const colors = difficultyColors[q.difficulty as keyof typeof difficultyColors];
                return (
                  <tr key={q.id} style={{
                    borderBottom: i < questions.length - 1 ? "1px solid var(--border)" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <div style={{ fontSize: "0.85rem", color: "var(--text)", maxWidth: "400px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {q.question}
                      </div>
                      {q.chapter && (
                        <div style={{ fontSize: "0.7rem", color: "var(--text3)", marginTop: "0.25rem" }}>
                          {q.chapter.name} {q.subconcept && `› ${q.subconcept.name}`}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", fontSize: "0.8rem", color: "var(--text2)" }}>
                      {q.subject?.name}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "center" }}>
                      <span style={{
                        padding: "0.2rem 0.6rem", borderRadius: "999px",
                        fontSize: "0.7rem", fontWeight: 600,
                        background: colors.bg, color: colors.color,
                      }}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "center", fontSize: "0.8rem", color: "var(--text2)" }}>
                      {q.marks}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <Link href={`/question-setter/questions/${q.id}/edit`}>
                          <button style={{
                            padding: "0.4rem", borderRadius: "0.375rem",
                            border: "1px solid var(--border)", background: "none",
                            color: "var(--text2)", cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--accent-bg)";
                            e.currentTarget.style.borderColor = "var(--accent)";
                            e.currentTarget.style.color = "var(--accent)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "none";
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--text2)";
                          }}
                          >
                            <Pencil size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => {
                            if (window.confirm("Delete this question? This action cannot be undone.")) {
                              deleteMutation.mutate(q.id);
                            }
                          }}
                          style={{
                            padding: "0.4rem", borderRadius: "0.375rem",
                            border: "1px solid var(--border)", background: "none",
                            color: "var(--text2)", cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--red-bg)";
                            e.currentTarget.style.borderColor = "var(--red)";
                            e.currentTarget.style.color = "var(--red)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "none";
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--text2)";
                          }}
                        >
                          <Trash2 size={14} />
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
  );
}