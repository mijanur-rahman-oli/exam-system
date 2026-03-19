"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus, Trash2, Eye, Edit, ToggleLeft, ToggleRight,
  Calendar, Clock, BookOpen, FileQuestion, Trophy
} from "lucide-react";

export default function AdminExamsPage() {
  const { toast } = useToast();

  const { data: exams, refetch, isLoading } = useQuery({
    queryKey: ["admin-exams"],
    queryFn: async () => {
      const res = await fetch("/api/exams");
      if (!res.ok) throw new Error("Failed to fetch exams");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/exams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to update exam");
      return res.json();
    },
    onSuccess: () => { toast({ title: "Exam status updated" }); refetch(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
      const ct  = res.headers.get("content-type");
      const data = ct?.includes("application/json") ? await res.json() : { success: true };
      if (!res.ok) throw new Error(data.error || "Failed to delete exam");
      return data;
    },
    onSuccess: () => { toast({ title: "Exam deleted" }); refetch(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const getStatusStyle = (isActive: boolean) =>
    isActive
      ? { background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green)" }
      : { background: "var(--surface2)", color: "var(--text2)", border: "1px solid var(--border)" };

  const statCards = [
    { title: "Total Exams",     value: exams?.length ?? 0,                                                                          Icon: BookOpen,    color: "var(--accent)", bg: "var(--accent-bg)" },
    { title: "Active Exams",    value: exams?.filter((e: any) => e.isActive).length ?? 0,                                           Icon: ToggleRight, color: "var(--green)",  bg: "var(--green-bg)"  },
    { title: "Total Questions", value: exams?.reduce((acc: number, e: any) => acc + (e.examQuestions?.length || 0), 0) ?? 0,        Icon: FileQuestion, color: "var(--amber)", bg: "var(--amber-bg)"  },
    { title: "Avg. Duration",   value: exams?.length ? `${Math.round(exams.reduce((a: number, e: any) => a + e.duration, 0) / exams.length)} min` : "0 min", Icon: Clock, color: "var(--accent)", bg: "var(--accent-bg)" },
  ];

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <div style={{ width: "2rem", height: "2rem", border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Exam Management</h1>
          <p className="text-[var(--text2)] mt-2">Create and manage all exams in the system</p>
        </div>
        <Link href="/admin/exams/create">
          <button className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
            <Plus size={20} /> Create New Exam
          </button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map(({ title, value, Icon, color, bg }) => (
          <div key={title} className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} color={color} />
              </div>
              <span className="text-xs text-[var(--text3)]">Total</span>
            </div>
            <div className="text-2xl font-bold text-[var(--text)]">{value}</div>
            <p className="text-sm text-[var(--text2)] mt-1">{title}</p>
          </div>
        ))}
      </div>

      {/* Exams table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">All Exams</h2>
        </div>

        {!exams?.length ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-[var(--text3)]" />
            <p className="text-[var(--text2)] mb-4">No exams created yet</p>
            <Link href="/admin/exams/create">
              <button className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg inline-flex items-center gap-2">
                <Plus size={16} /> Create your first exam
              </button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead className="bg-[var(--surface2)] border-b border-[var(--border)]">
                <tr>
                  {["ID", "Exam Name", "Subject", "Duration", "Questions", "Total Marks", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exams.map((exam: any) => (
                  <tr key={exam.id} className="border-b border-[var(--border)] hover:bg-[var(--surface2)] transition-colors">
                    <td className="px-6 py-4 text-sm text-[var(--text2)]">{exam.id}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[var(--text)]">{exam.examName}</div>
                      {exam.description && <div className="text-xs text-[var(--text3)] mt-1 line-clamp-1">{exam.description}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text2)]">{exam.subject?.name || "—"}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text2)]">{exam.duration} min</td>
                    <td className="px-6 py-4 text-sm text-[var(--text2)]">{exam.examQuestions?.length ?? 0}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--text)]">{exam.totalMarks ?? "—"}</td>
                    <td className="px-6 py-4">
                      <span style={{ ...getStatusStyle(exam.isActive), padding: "0.2rem 0.75rem", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700 }}>
                        {exam.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        {/* Leaderboard */}
                        <Link href={`/admin/exams/${exam.id}/leaderboard`}>
                          <button
                            className="p-2 rounded-lg transition-colors text-[var(--text2)] hover:text-[var(--amber)] hover:bg-[var(--amber-bg)]"
                            title="Leaderboard"
                          >
                            <Trophy size={15} />
                          </button>
                        </Link>

                        {/* View */}
                        <Link href={`/admin/exams/${exam.id}`}>
                          <button className="p-2 rounded-lg transition-colors text-[var(--text2)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)]" title="View">
                            <Eye size={15} />
                          </button>
                        </Link>

                        {/* Edit */}
                        <Link href={`/admin/exams/${exam.id}/edit`}>
                          <button className="p-2 rounded-lg transition-colors text-[var(--text2)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)]" title="Edit">
                            <Edit size={15} />
                          </button>
                        </Link>

                        {/* Toggle active */}
                        <button
                          onClick={() => toggleMutation.mutate({ id: exam.id, isActive: !exam.isActive })}
                          className={`p-2 rounded-lg transition-colors ${exam.isActive ? "text-[var(--green)] hover:bg-[var(--green-bg)]" : "text-[var(--text2)] hover:bg-[var(--surface2)]"}`}
                          title={exam.isActive ? "Deactivate" : "Activate"}
                        >
                          {exam.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => { if (window.confirm(`Delete "${exam.examName}"? This cannot be undone.`)) deleteMutation.mutate(exam.id); }}
                          className="p-2 rounded-lg transition-colors text-[var(--text2)] hover:text-[var(--red)] hover:bg-[var(--red-bg)]"
                          disabled={deleteMutation.isPending}
                          title="Delete"
                        >
                          <Trash2 size={15} />
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