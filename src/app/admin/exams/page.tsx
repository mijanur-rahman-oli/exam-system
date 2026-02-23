// app/admin/exams/page.tsx
"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { 
  Plus, Trash2, Eye, Edit, ToggleLeft, ToggleRight,
  Calendar, Users, Clock, BookOpen, FileQuestion, AlertCircle
} from "lucide-react";

export default function AdminExamsPage() {
  const { toast } = useToast();

  const { data: exams, refetch, isLoading } = useQuery({
    queryKey: ["admin-exams"],
    queryFn: async () => {
      const res = await fetch("/api/exams");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch exams");
      }
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
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update exam");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "Exam status updated successfully" 
      });
      refetch();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update exam", 
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/exams/${id}`, { 
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to delete exam");
        }
        return data;
      } else {
        // Handle non-JSON response
        if (!res.ok) {
          throw new Error("Failed to delete exam");
        }
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "Exam deleted successfully" 
      });
      refetch();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete exam", 
        variant: "destructive" 
      });
    },
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? "bg-[var(--green-bg)] text-[var(--green)] border border-[var(--green)]/20"
      : "bg-[var(--surface2)] text-[var(--text2)] border border-[var(--border)]";
  };

  const statCards = [
    { 
      title: "Total Exams", 
      value: exams?.length ?? 0, 
      icon: BookOpen,
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-900/50"
    },
    { 
      title: "Active Exams", 
      value: exams?.filter((e: any) => e.isActive).length ?? 0, 
      icon: ToggleRight,
      bg: "bg-green-500/10",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-900/50"
    },
    { 
      title: "Total Questions", 
      value: exams?.reduce((acc: number, e: any) => acc + (e.examQuestions?.length || 0), 0) ?? 0, 
      icon: FileQuestion,
      bg: "bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-200 dark:border-purple-900/50"
    },
    { 
      title: "Avg. Duration", 
      value: exams?.length 
        ? Math.round(exams.reduce((acc: number, e: any) => acc + e.duration, 0) / exams.length)
        : 0, 
      suffix: "min",
      icon: Clock,
      bg: "bg-orange-500/10",
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-200 dark:border-orange-900/50"
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Exam Management</h1>
          <p className="text-[var(--text2)] mt-2">Create and manage all exams in the system</p>
        </div>
        <Link href="/admin/exams/create">
          <button className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dim)] transition-colors flex items-center gap-2">
            <Plus size={20} />
            Create New Exam
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <span className="text-xs text-[var(--text3)]">Total</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--text)]">
                  {stat.value} {stat.suffix && <span className="text-sm text-[var(--text2)] ml-1">{stat.suffix}</span>}
                </div>
                <p className="text-sm text-[var(--text2)] mt-1">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Exams Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">All Exams</h2>
        </div>
        
        {exams?.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-[var(--text3)]" />
            <p className="text-[var(--text2)] mb-4">No exams created yet</p>
            <Link href="/admin/exams/create">
              <button className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dim)] transition-colors inline-flex items-center gap-2">
                <Plus size={16} />
                Create your first exam
              </button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--surface2)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Exam Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Questions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Total Marks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {exams?.map((exam: any) => (
                  <tr key={exam.id} className="hover:bg-[var(--surface2)] transition-colors">
                    <td className="px-6 py-4 text-sm text-[var(--text2)]">{exam.id}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[var(--text)]">{exam.examName}</div>
                      {exam.description && (
                        <div className="text-xs text-[var(--text3)] mt-1 line-clamp-1">{exam.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text2)]">{exam.subject?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-[var(--text2)]">{exam.duration} min</td>
                    <td className="px-6 py-4 text-sm text-[var(--text2)]">{exam.examQuestions?.length ?? 0}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[var(--text)]">{exam.totalMarks ?? '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.isActive)}`}>
                        {exam.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/exams/${exam.id}`}>
                          <button className="p-2 text-[var(--text2)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors">
                            <Eye size={16} />
                          </button>
                        </Link>
                        <Link href={`/admin/exams/${exam.id}/edit`}>
                          <button className="p-2 text-[var(--text2)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors">
                            <Edit size={16} />
                          </button>
                        </Link>
                        <button
                          onClick={() => toggleMutation.mutate({ id: exam.id, isActive: !exam.isActive })}
                          className={`p-2 rounded-lg transition-colors ${
                            exam.isActive 
                              ? 'text-[var(--green)] hover:bg-[var(--green-bg)]' 
                              : 'text-[var(--text2)] hover:bg-[var(--surface2)]'
                          }`}
                          title={exam.isActive ? "Deactivate" : "Activate"}
                        >
                          {exam.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${exam.examName}"? This action cannot be undone.`)) {
                              deleteMutation.mutate(exam.id);
                            }
                          }}
                          className="p-2 text-[var(--text2)] hover:text-[var(--red)] hover:bg-[var(--red-bg)] rounded-lg transition-colors"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 size={16} />
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