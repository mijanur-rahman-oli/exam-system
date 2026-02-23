// app/admin/users/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { 
  Users, Search, Trash2, ShieldCheck, UserPlus,
  GraduationCap, UserCog, Shield, X, CheckCircle,
  Mail, Phone, Calendar, Eye, EyeOff
} from "lucide-react";
import Link from "next/link";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
  phone?: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    phone: "",
    grade: "",
    fullName: "",
    subject: "",
  });

  // Fetch users
  const { data: users, refetch, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch users");
      }
      return res.json();
    },
  });

  // Create user mutation
  const createUser = useMutation({
    mutationFn: async () => {
      // Validate passwords match
      if (newUser.password !== newUser.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          phone: newUser.phone || null,
          grade: newUser.grade || null,
          fullName: newUser.fullName || null,
          subject: newUser.subject || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }
      return data;
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "User created successfully" 
      });
      setIsCreateOpen(false);
      setNewUser({
        username: "", email: "", password: "", confirmPassword: "",
        role: "student", phone: "", grade: "", fullName: "", subject: "",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/users/${id}`, { 
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }
      return data;
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "User deleted successfully" 
      });
      refetch();
      if (selectedUser) setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Verify user mutation
  const verifyUser = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/users/${id}/verify`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify user");
      }
      return data;
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "User verified successfully" 
      });
      refetch();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Filter users based on search
  const filteredUsers = users?.filter((u: User) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Stats for the dashboard
  const stats = {
    total: users?.length || 0,
    students: users?.filter((u: User) => u.role === "student").length || 0,
    teachers: users?.filter((u: User) => u.role === "teacher").length || 0,
    questionSetters: users?.filter((u: User) => u.role === "question_setter").length || 0,
    admins: users?.filter((u: User) => u.role === "admin").length || 0,
    verified: users?.filter((u: User) => u.isVerified).length || 0,
  };

  const roleColors: Record<string, { bg: string; text: string; icon: any }> = {
    admin: { 
      bg: "bg-red-500/10", 
      text: "text-red-600 dark:text-red-400",
      icon: Shield
    },
    teacher: { 
      bg: "bg-blue-500/10", 
      text: "text-blue-600 dark:text-blue-400",
      icon: UserCog
    },
    question_setter: { 
      bg: "bg-green-500/10", 
      text: "text-green-600 dark:text-green-400",
      icon: GraduationCap
    },
    student: { 
      bg: "bg-purple-500/10", 
      text: "text-purple-600 dark:text-purple-400",
      icon: Users
    },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-[var(--surface)] rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">User Management</h1>
          <p className="text-[var(--text2)] mt-2 text-lg">
            Create, manage, and verify user accounts
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="group relative px-6 py-3 bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-dim)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2"
        >
          <UserPlus size={20} />
          Add New User
          <span className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-[var(--text2)]">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">{stats.total}</p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users size={16} className="text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs text-[var(--text2)]">Students</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">{stats.students}</p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <UserCog size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-[var(--text2)]">Teachers</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">{stats.teachers}</p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <GraduationCap size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs text-[var(--text2)]">Question Setters</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">{stats.questionSetters}</p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Shield size={16} className="text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs text-[var(--text2)]">Admins</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">{stats.admins}</p>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs text-[var(--text2)]">Verified</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">{stats.verified}</p>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text3)]" />
          <input
            type="text"
            placeholder="Search users by username or email..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] placeholder:text-[var(--text3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 p-1 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "grid" 
                ? 'bg-[var(--accent)] text-white' 
                : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="3" y="3" width="5" height="5" rx="1" />
              <rect x="12" y="3" width="5" height="5" rx="1" />
              <rect x="3" y="12" width="5" height="5" rx="1" />
              <rect x="12" y="12" width="5" height="5" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${
              viewMode === "list" 
                ? 'bg-[var(--accent)] text-white' 
                : 'text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <rect x="3" y="3" width="14" height="2" rx="1" />
              <rect x="3" y="9" width="14" height="2" rx="1" />
              <rect x="3" y="15" width="14" height="2" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Users Grid/List */}
      {filteredUsers?.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <Users className="h-16 w-16 mx-auto mb-4 text-[var(--text3)]" />
          <p className="text-[var(--text2)] text-lg mb-4">No users found</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dim)] transition-colors inline-flex items-center gap-2"
          >
            <UserPlus size={20} />
            Create your first user
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers?.map((user: User) => {
            const roleStyle = roleColors[user.role] || roleColors.student;
            const RoleIcon = roleStyle.icon;
            
            return (
              <div
                key={user.id}
                className="group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Status indicator */}
                <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
                  user.isVerified ? 'bg-[var(--green)]' : 'bg-[var(--amber)]'
                }`}>
                  <span className={`absolute inset-0 rounded-full animate-ping ${
                    user.isVerified ? 'bg-[var(--green)]' : 'bg-[var(--amber)]'
                  } opacity-75`}></span>
                </div>

                {/* Header with role color */}
                <div className={`h-2 w-full ${roleStyle.bg}`} />

                <div className="p-6">
                  {/* Avatar */}
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${roleStyle.bg} border-2 border-[var(--border)] flex items-center justify-center`}>
                    <span className="text-2xl font-bold text-[var(--text)]">
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>

                  {/* User info */}
                  <h3 className="text-lg font-semibold text-[var(--text)] text-center mb-1">
                    {user.username}
                  </h3>
                  
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 ${roleStyle.bg} ${roleStyle.text}`}>
                      <RoleIcon size={12} />
                      {user.role.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      user.isVerified 
                        ? 'bg-[var(--green-bg)] text-[var(--green)]' 
                        : 'bg-[var(--amber-bg)] text-[var(--amber)]'
                    }`}>
                      {user.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[var(--text2)]">
                      <Mail size={14} />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-[var(--text2)]">
                        <Phone size={14} />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[var(--text2)]">
                      <Calendar size={14} />
                      <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-[var(--border)]">
                    {!user.isVerified && (
                      <button
                        onClick={() => verifyUser.mutate(user.id)}
                        className="p-2 rounded-lg text-[var(--green)] hover:bg-[var(--green-bg)] transition-all"
                        title="Verify user"
                      >
                        <ShieldCheck size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${user.username}"? This action cannot be undone.`)) {
                          deleteUser.mutate(user.id);
                        }
                      }}
                      className="p-2 rounded-lg text-[var(--red)] hover:bg-[var(--red-bg)] transition-all"
                      title="Delete user"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--surface2)] border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-[var(--text2)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredUsers?.map((user: User) => {
                const roleStyle = roleColors[user.role] || roleColors.student;
                const RoleIcon = roleStyle.icon;
                
                return (
                  <tr key={user.id} className="hover:bg-[var(--surface2)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${roleStyle.bg} flex items-center justify-center`}>
                          <span className="text-sm font-medium text-[var(--text)]">
                            {user.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text)]">{user.username}</p>
                          <p className="text-xs text-[var(--text2)]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${roleStyle.bg} ${roleStyle.text}`}>
                        <RoleIcon size={12} />
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.isVerified 
                          ? 'bg-[var(--green-bg)] text-[var(--green)]' 
                          : 'bg-[var(--amber-bg)] text-[var(--amber)]'
                      }`}>
                        {user.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text2)]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {!user.isVerified && (
                          <button
                            onClick={() => verifyUser.mutate(user.id)}
                            className="p-2 rounded-lg text-[var(--green)] hover:bg-[var(--green-bg)] transition-all"
                            title="Verify user"
                          >
                            <ShieldCheck size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Delete user "${user.username}"?`)) {
                              deleteUser.mutate(user.id);
                            }
                          }}
                          className="p-2 rounded-lg text-[var(--red)] hover:bg-[var(--red-bg)] transition-all"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
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

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCreateOpen(false)} />
          <div className="relative w-full max-w-2xl bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <h2 className="text-xl font-semibold text-[var(--text)]">Create New User</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--text)] transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createUser.mutate();
              }}
              className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text)]">
                    Username <span className="text-[var(--red)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                    placeholder="johndoe"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text)]">
                    Email <span className="text-[var(--red)]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text)]">
                    Password <span className="text-[var(--red)]">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text)]">
                    Confirm Password <span className="text-[var(--red)]">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text)]">
                    Role <span className="text-[var(--red)]">*</span>
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="question_setter">Question Setter</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text)]">Phone Number</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              {(newUser.role === "student" || newUser.role === "teacher" || newUser.role === "question_setter") && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text)]">Full Name</label>
                    <input
                      type="text"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  {newUser.role === "student" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text)]">Grade</label>
                      <input
                        type="text"
                        value={newUser.grade}
                        onChange={(e) => setNewUser({ ...newUser, grade: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                        placeholder="10th Grade"
                      />
                    </div>
                  )}

                  {(newUser.role === "teacher" || newUser.role === "question_setter") && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text)]">Subject Specialization</label>
                      <input
                        type="text"
                        value={newUser.subject}
                        onChange={(e) => setNewUser({ ...newUser, subject: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                        placeholder="Mathematics"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:bg-[var(--surface2)] hover:text-[var(--text)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUser.isPending}
                  className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dim)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {createUser.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}