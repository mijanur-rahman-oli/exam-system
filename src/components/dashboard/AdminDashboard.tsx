// components/dashboard/AdminDashboard.tsx
"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { 
  Users, 
  BookOpen, 
  FileQuestion, 
  TrendingUp, 
  Layers, 
  Award,
  GraduationCap,
  Calendar,
  CheckCircle
} from "lucide-react";

export function AdminDashboard() {
  const { data: session } = useSession();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: recentUsers } = useQuery({
    queryKey: ["admin-recent-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users?limit=5");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const { data: recentExams } = useQuery({
    queryKey: ["admin-recent-exams"],
    queryFn: async () => {
      const res = await fetch("/api/exams?limit=5");
      if (!res.ok) throw new Error("Failed to fetch exams");
      return res.json();
    },
  });

  const statCards = [
    { 
      title: "Total Users", 
      value: stats?.totalUsers ?? 0, 
      icon: Users, 
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400"
    },
    { 
      title: "Total Exams", 
      value: stats?.totalExams ?? 0, 
      icon: BookOpen, 
      gradient: "from-green-500 to-green-600",
      bg: "bg-green-500/10",
      text: "text-green-600 dark:text-green-400"
    },
    { 
      title: "Questions", 
      value: stats?.totalQuestions ?? 0, 
      icon: FileQuestion, 
      gradient: "from-purple-500 to-purple-600",
      bg: "bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400"
    },
    { 
      title: "Exam Attempts", 
      value: stats?.totalAttempts ?? 0, 
      icon: TrendingUp, 
      gradient: "from-orange-500 to-orange-600",
      bg: "bg-orange-500/10",
      text: "text-orange-600 dark:text-orange-400"
    },
    { 
      title: "Subjects", 
      value: stats?.totalSubjects ?? 0, 
      icon: Layers, 
      gradient: "from-indigo-500 to-indigo-600",
      bg: "bg-indigo-500/10",
      text: "text-indigo-600 dark:text-indigo-400"
    },
    { 
      title: "Avg. Score", 
      value: `${stats?.avgScore ?? 0}%`, 
      icon: Award, 
      gradient: "from-pink-500 to-pink-600",
      bg: "bg-pink-500/10",
      text: "text-pink-600 dark:text-pink-400"
    },
  ];

  const userStats = [
    { 
      label: "Students", 
      value: stats?.studentCount ?? 0, 
      icon: GraduationCap,
      color: "bg-purple-500",
      textColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30"
    },
    { 
      label: "Teachers", 
      value: stats?.teacherCount ?? 0, 
      icon: Users,
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30"
    },
    { 
      label: "Question Setters", 
      value: stats?.questionSetterCount ?? 0, 
      icon: FileQuestion,
      color: "bg-green-500",
      textColor: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30"
    },
    { 
      label: "Admins", 
      value: stats?.adminCount ?? 0, 
      icon: Award,
      color: "bg-red-500",
      textColor: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/30"
    },
  ];

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    teacher: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    question_setter: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    student: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Admin Dashboard</h1>
          <p className="text-[var(--text2)] mt-2">
            Welcome back, <span className="font-semibold text-[var(--accent)]">{session?.user?.username}</span>! Here's what's happening in your system.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] text-sm flex items-center gap-2">
            <Calendar size={14} />
            {new Date().toLocaleDateString()}
          </div>
          <div className="px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] text-sm flex items-center gap-2">
            <CheckCircle size={14} className="text-[var(--green)]" />
            System Online
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.text}`} />
                </div>
                <span className="text-xs text-[var(--text3)]">Total</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--text)]">{stat.value}</div>
                <p className="text-sm text-[var(--text2)] mt-1">{stat.title}</p>
              </div>
              <div className="mt-4 h-1 w-full bg-[var(--border)] rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${stat.gradient}`}
                  style={{ width: '75%' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Users by Role & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Users by Role Card */}
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[var(--text)]">Users by Role</h2>
            <span className="px-2 py-1 rounded-full bg-[var(--accent-bg)] text-[var(--accent)] text-xs font-medium">
              Total: {stats?.totalUsers ?? 0}
            </span>
          </div>
          <div className="space-y-4">
            {userStats.map((stat) => {
              const Icon = stat.icon;
              const percentage = ((stat.value / (stats?.totalUsers || 1)) * 100).toFixed(1);
              return (
                <div key={stat.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-3.5 w-3.5 ${stat.textColor}`} />
                      </div>
                      <span className="text-sm font-medium text-[var(--text)]">
                        {stat.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-[var(--text2)]">{percentage}%</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stat.bgColor} ${stat.textColor}`}>
                        {stat.value}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-[var(--border)] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stat.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <h2 className="text-lg font-semibold text-[var(--text)] mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/users">
              <div className="p-4 rounded-lg border-2 border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] transition-all cursor-pointer text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-[var(--accent)]" />
                <span className="text-sm font-medium text-[var(--text)]">Manage Users</span>
              </div>
            </Link>
            <Link href="/admin/subjects">
              <div className="p-4 rounded-lg border-2 border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] transition-all cursor-pointer text-center">
                <Layers className="h-6 w-6 mx-auto mb-2 text-[var(--accent)]" />
                <span className="text-sm font-medium text-[var(--text)]">Subjects & Chapters</span>
              </div>
            </Link>
            <Link href="/admin/exams/create">
              <div className="p-4 rounded-lg border-2 border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] transition-all cursor-pointer text-center">
                <BookOpen className="h-6 w-6 mx-auto mb-2 text-[var(--accent)]" />
                <span className="text-sm font-medium text-[var(--text)]">Create Exam</span>
              </div>
            </Link>
            <Link href="/admin/questions/create">
              <div className="p-4 rounded-lg border-2 border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] transition-all cursor-pointer text-center">
                <FileQuestion className="h-6 w-6 mx-auto mb-2 text-[var(--accent)]" />
                <span className="text-sm font-medium text-[var(--text)]">Add Question</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Users */}
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text)]">Recent Users</h2>
            <Link href="/admin/users" className="text-sm text-[var(--accent)] hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers?.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--surface2)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--surface2)] flex items-center justify-center">
                    <span className="text-sm font-medium text-[var(--text)]">
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{user.username}</p>
                    <p className="text-xs text-[var(--text2)]">{user.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            ))}
            {(!recentUsers || recentUsers.length === 0) && (
              <p className="text-center text-[var(--text2)] py-4">No recent users</p>
            )}
          </div>
        </div>

        {/* Recent Exams */}
        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text)]">Recent Exams</h2>
            <Link href="/admin/exams" className="text-sm text-[var(--accent)] hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentExams?.map((exam: any) => (
              <div key={exam.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--surface2)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--accent-bg)]">
                    <BookOpen className="h-4 w-4 text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">{exam.examName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[var(--text2)]">{exam.duration} mins</span>
                      <span className="text-xs text-[var(--text2)]">•</span>
                      <span className="text-xs text-[var(--text2)]">{exam.examQuestions?.length || 0} questions</span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  exam.isActive 
                    ? 'bg-[var(--green-bg)] text-[var(--green)]' 
                    : 'bg-[var(--surface2)] text-[var(--text2)]'
                }`}>
                  {exam.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
            {(!recentExams || recentExams.length === 0) && (
              <p className="text-center text-[var(--text2)] py-4">No recent exams</p>
            )}
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="p-6 rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--surface2)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-6">System Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-[var(--accent)]">{stats?.totalSubjects ?? 0}</div>
            <div className="text-sm text-[var(--text2)] mt-1 flex items-center justify-center gap-1">
              <Layers size={14} />
              Subjects
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[var(--green)]">{stats?.totalChapters ?? 0}</div>
            <div className="text-sm text-[var(--text2)] mt-1 flex items-center justify-center gap-1">
              <BookOpen size={14} />
              Chapters
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[var(--amber)]">{stats?.totalSubconcepts ?? 0}</div>
            <div className="text-sm text-[var(--text2)] mt-1 flex items-center justify-center gap-1">
              <FileQuestion size={14} />
              Sub-concepts
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-[var(--red)]">{stats?.activeExams ?? 0}</div>
            <div className="text-sm text-[var(--text2)] mt-1 flex items-center justify-center gap-1">
              <TrendingUp size={14} />
              Active Exams
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}