"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, Search, Edit2, Trash2, Play, Square, Clock, Users } from "lucide-react";

export default function ManageExamsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data: exams, isLoading } = useQuery({
    queryKey: ["teacher-exams"],
    queryFn: () => fetch("/api/teacher/exams").then(r => r.json()),
  });

  const toggleActive = async (id: number, cur: boolean) => {
    await fetch(`/api/exams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !cur }),
    });
    qc.invalidateQueries({ queryKey: ["teacher-exams"] });
    toast({ title: cur ? "Exam deactivated" : "Exam activated!" });
  };

  const deleteExam = async (id: number) => {
    if (!confirm("Delete this exam? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      qc.invalidateQueries({ queryKey: ["teacher-exams"] });
      toast({ title: "Exam deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const filtered = (exams ?? []).filter((e: any) => {
    const matchSearch = !search || e.examName.toLowerCase().includes(search.toLowerCase());
    const matchGrade  = !gradeFilter || String(e.gradeLevel) === gradeFilter;
    const matchStatus = !statusFilter || (statusFilter === "active" ? e.isActive : !e.isActive);
    return matchSearch && matchGrade && matchStatus;
  });

  const inp: React.CSSProperties = {
    background: "var(--input-bg)", border: "1.5px solid var(--border)",
    color: "var(--text)", borderRadius: "0.5rem", outline: "none",
    fontSize: "0.8rem", padding: "0 0.75rem", height: "2rem",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
            Manage Exams
          </h1>
          <p style={{ fontSize: "0.78rem", color: "var(--text3)", margin: 0 }}>
            {filtered.length} exam{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/teacher/exams/create">
          <button style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.5rem 1rem", borderRadius: "0.5rem",
            background: "var(--accent)", border: "none",
            color: "#fff", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
          }}>
            <PlusCircle size={14} /> Create Exam
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
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search exams…"
            style={{ ...inp, paddingLeft: "1.85rem", width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
          style={{ ...inp, width: "130px", appearance: "none" }}>
          <option value="">All grades</option>
          {[6,7,8,9,10,11,12].map(g => <option key={g} value={String(g)}>Grade {g}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ ...inp, width: "130px", appearance: "none" }}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
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
            No exams found.{" "}
            <Link href="/teacher/exams/create" style={{ color: "var(--accent)" }}>Create one →</Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
                  {["Exam Name", "Subject", "Grade", "Questions", "Total Marks", "Duration", "Scheduled", "Status", "Actions"].map(h => (
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
                {filtered.map((exam: any) => (
                  <tr
                    key={exam.id}
                    style={{ borderBottom: "1px solid var(--border)", transition: "background 0.12s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "0.8rem 1rem" }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text)" }}>
                        {exam.examName}
                      </div>
                      {exam.retakeAllowed && (
                        <span style={{ fontSize: "0.62rem", color: "var(--text3)" }}>↩ retakes allowed</span>
                      )}
                    </td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.78rem", color: "var(--text2)" }}>
                      {exam.subject?.name ?? "—"}
                    </td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.78rem", color: "var(--text2)" }}>
                      Gr. {exam.gradeLevel}
                    </td>
                    <td style={{ padding: "0.8rem 1rem" }}>
                      <span style={{
                        fontSize: "0.78rem", fontWeight: 700,
                        color: "var(--accent)", background: "var(--accent-bg)",
                        padding: "0.15rem 0.5rem", borderRadius: "0.3rem",
                      }}>
                        {exam._count?.examQuestions ?? exam.examQuestions?.length ?? 0}
                      </span>
                    </td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.78rem", color: "var(--text2)" }}>
                      {exam.totalMarks ?? "—"}
                    </td>
                    <td style={{ padding: "0.8rem 1rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", color: "var(--text2)" }}>
                        <Clock size={11} />{exam.duration} min
                      </span>
                    </td>
                    <td style={{ padding: "0.8rem 1rem", fontSize: "0.75rem", color: "var(--text2)" }}>
                      {exam.scheduleTime
                        ? new Date(exam.scheduleTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </td>
                    <td style={{ padding: "0.8rem 1rem" }}>
                      <span style={{
                        fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.04em",
                        padding: "0.2rem 0.55rem", borderRadius: "999px",
                        background: exam.isActive ? "var(--green-bg)" : "var(--surface3)",
                        color: exam.isActive ? "var(--green)" : "var(--text3)",
                        border: `1px solid ${exam.isActive ? "var(--green)" : "var(--border)"}`,
                      }}>
                        {exam.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "0.8rem 1rem" }}>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "nowrap" }}>
                        {/* Edit */}
                        <Link href={`/teacher/exams/${exam.id}/edit`}>
                          <button style={{
                            padding: "0.28rem 0.55rem", borderRadius: "0.35rem",
                            background: "var(--surface2)", border: "1px solid var(--border)",
                            color: "var(--text2)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem",
                            fontSize: "0.7rem", fontWeight: 600,
                          }}>
                            <Edit2 size={11} /> Edit
                          </button>
                        </Link>

                        {/* Activate / Deactivate */}
                        <button
                          onClick={() => toggleActive(exam.id, exam.isActive)}
                          style={{
                            padding: "0.28rem 0.55rem", borderRadius: "0.35rem", fontSize: "0.7rem",
                            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem",
                            background: exam.isActive ? "var(--amber-bg)" : "var(--green-bg)",
                            border: `1px solid ${exam.isActive ? "var(--amber)" : "var(--green)"}`,
                            color: exam.isActive ? "var(--amber)" : "var(--green)",
                          }}
                        >
                          {exam.isActive ? <><Square size={10} /> Stop</> : <><Play size={10} /> Start</>}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteExam(exam.id)}
                          disabled={deleting === exam.id}
                          style={{
                            padding: "0.28rem 0.55rem", borderRadius: "0.35rem", fontSize: "0.7rem",
                            fontWeight: 600, cursor: deleting === exam.id ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", gap: "0.25rem",
                            background: "var(--red-bg)", border: "1px solid var(--red)", color: "var(--red)",
                          }}
                        >
                          <Trash2 size={10} />
                          {deleting === exam.id ? "…" : "Del"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}