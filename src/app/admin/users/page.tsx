// app/admin/users/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { 
  Search, Trash2, ShieldCheck, UserPlus, 
  Users, GraduationCap, UserCog, Shield 
} from "lucide-react";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "student",
    phone: "",
    grade: "",
    fullName: "",
    subject: "",
  });

  const { data: users, refetch, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => {
      toast({ title: "User deleted successfully" });
      refetch();
    },
    onError: () => toast({ title: "Error", description: "Failed to delete user", variant: "destructive" }),
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/users/${id}/verify`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to verify user");
    },
    onSuccess: () => {
      toast({ title: "User verified successfully" });
      refetch();
    },
    onError: () => toast({ title: "Error", description: "Failed to verify user", variant: "destructive" }),
  });

  const filtered = users?.filter((u: any) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { 
      label: "Total Users", 
      value: users?.length ?? 0, 
      icon: Users,
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400"
    },
    { 
      label: "Students", 
      value: users?.filter((u: any) => u.role === "student").length ?? 0, 
      icon: GraduationCard,
      bg: "bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400"
    },
    { 
      label: "Teachers", 
      value: users?.filter((u: any) => u.role === "teacher").length ?? 0, 
      icon: UserCog,
      bg: "bg-green-500/10",
      text: "text-green-600 dark:text-green-400"
    },
    { 
      label: "Admins", 
      value: users?.filter((u: any) => u.role === "admin").length ?? 0, 
      icon: Shield,
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400"
    },
  ];

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
    teacher: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
    question_setter: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
    student: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800",
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">User Management</h1>
          <p className="text-[var(--text2)] mt-2">Create and manage all system users</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dim)] transition-colors flex items-center gap-2"
        >
          <UserPlus size={20} />
          Add User
        </button>
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
                <div className="text-2xl font-bold text-[var(--text)]">{stat.value}</div>
                <p className="text-sm text-[var(--text2)] mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text3)]" />
        <input
          type="text"
          placeholder="Search by username or email..."
          className="w-full max-w-md pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] placeholder:text-[var(--text3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text)]">All Users ({filtered?.length ?? 0})</h2>
        </div>

        {filtered?.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto mb-4 text-[var(--text3)]" />
            <p className="text-[var(--text2)]">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--surface2)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Verified</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered?.map((user: any) => (
                  <tr key={user.id} className="hover:bg-[var(--surface2)] transition-colors">
                    <td className="px-6 py-4 text-sm text-[var(--text2)]">{user.id}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[var(--text)]">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text2)]">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${roleColors[user.role]}`}>
                        {user.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.isVerified 
                          ? 'bg-[var(--green-bg)] text-[var(--green)] border border-[var(--green)]/20' 
                          : 'bg-[var(--amber-bg)] text-[var(--amber)] border border-[var(--amber)]/20'
                      }`}>
                        {user.isVerified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text2)]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {!user.isVerified && (
                          <button
                            onClick={() => verifyMutation.mutate(user.id)}
                            className="p-2 text-[var(--green)] hover:bg-[var(--green-bg)] rounded-lg transition-colors"
                            title="Verify user"
                          >
                            <ShieldCheck size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Delete user "${user.username}"? This cannot be undone.`)) {
                              deleteMutation.mutate(user.id);
                            }
                          }}
                          className="p-2 text-[var(--text2)] hover:text-[var(--red)] hover:bg-[var(--red-bg)] rounded-lg transition-colors"
                          title="Delete user"
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

function GraduationCard(props: any) {
  return <GraduationCap {...props} />;
}