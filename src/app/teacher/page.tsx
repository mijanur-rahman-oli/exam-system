"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PlusCircle, ClipboardList, FileEdit, BarChart2, Play, Clock, Users, BookOpen, TrendingUp } from "lucide-react";

export default function TeacherDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["teacher-stats"],
    queryFn: () => fetch("/api/teacher/stats").then(r => r.json()),
  });

  const { data: recentExams } = useQuery({
    queryKey: ["teacher-recent-exams"],
    queryFn: () => fetch("/api/teacher/exams?limit=5").then(r => r.json()),
  });

  const statCards = [
    { label: "Exams Created",        value: stats?.totalExams      ?? 0, icon: ClipboardList, color: "var(--accent)",  bg: "var(--accent-bg)"  },
    { label: "Total Attempts",        value: stats?.totalAttempts   ?? 0, icon: TrendingUp,    color: "var(--green)",   bg: "var(--green-bg)"   },
    { label: "Students",              value: stats?.uniqueStudents  ?? 0, icon: Users,         color: "var(--amber)",   bg: "var(--amber-bg)"   },
    { label: "Questions Written",     value: stats?.totalQuestions  ?? 0, icon: BookOpen,      color: "var(--red)",     bg: "var(--red-bg)"     },
  ];

  const quickActions = [
    { href: "/teacher/exams/create",     label: "Create Exam",    Icon: PlusCircle,  desc: "Set up a new exam with questions" },
    { href: "/teacher/questions/create", label: "Add Question",   Icon: FileEdit,    desc: "Write a question for your bank"  },
    { href: "/teacher/exams",            label: "Manage Exams",   Icon: ClipboardList, desc: "Edit, activate, or delete exams" },
    { href: "/teacher/results",          label: "View Results",   Icon: BarChart2,   desc: "See student scores and analytics" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>
          Teacher Dashboard
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text2)", marginTop: "0.25rem" }}>
          Manage your exams, questions, and track student progress
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "1.25rem",
            display: "flex", flexDirection: "column", gap: "0.75rem",
            boxShadow: "var(--shadow)",
          }}>
            <div style={{
              width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem",
              background: bg, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>
                {value}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text2)", marginTop: "0.2rem", letterSpacing: "0.03em" }}>
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>
          Quick Actions
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.875rem" }}>
          {quickActions.map(({ href, label, Icon, desc }) => (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <div style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: "1.1rem 1.1rem",
                cursor: "pointer", transition: "all 0.15s",
                display: "flex", flexDirection: "column", gap: "0.6rem",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <Icon size={18} color="var(--accent)" />
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text)" }}>{label}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text3)", marginTop: "0.2rem" }}>{desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent exams */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
          <h2 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
            Recent Exams
          </h2>
          <Link href="/teacher/exams" style={{ fontSize: "0.75rem", color: "var(--accent)", textDecoration: "none" }}>
            View all →
          </Link>
        </div>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          {!recentExams?.length ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text3)", fontSize: "0.85rem" }}>
              No exams yet —{" "}
              <Link href="/teacher/exams/create" style={{ color: "var(--accent)" }}>create your first one</Link>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Exam Name", "Subject", "Grade", "Schedule", "Duration", "Status", "Actions"].map(h => (
                    <th key={h} style={{
                      padding: "0.7rem 1rem", textAlign: "left",
                      fontSize: "0.68rem", fontWeight: 700,
                      color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentExams?.map((exam: any) => (
                  <tr key={exam.id} style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--text)" }}>
                      {exam.examName}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text2)" }}>
                      {exam.subject?.name}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text2)" }}>
                      Grade {exam.gradeLevel}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.78rem", color: "var(--text2)" }}>
                      {exam.scheduleTime
                        ? new Date(exam.scheduleTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.78rem", color: "var(--text2)" }}>
                      {exam.duration} min
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <StatusBadge active={exam.isActive} />
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <Link href={`/teacher/exams/${exam.id}/edit`}>
                          <Btn>Edit</Btn>
                        </Link>
                        <ToggleActiveBtn examId={exam.id} isActive={exam.isActive} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.04em",
      padding: "0.2rem 0.55rem", borderRadius: "999px",
      background: active ? "var(--green-bg)" : "var(--surface2)",
      color: active ? "var(--green)" : "var(--text3)",
      border: `1px solid ${active ? "var(--green)" : "var(--border)"}`,
    }}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Btn({ children, onClick, danger }: { children: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.28rem 0.65rem", borderRadius: "0.375rem", fontSize: "0.72rem",
        fontWeight: 600, cursor: "pointer", border: "1px solid",
        background: danger ? "var(--red-bg)" : "var(--surface2)",
        borderColor: danger ? "var(--red)" : "var(--border)",
        color: danger ? "var(--red)" : "var(--text2)",
        transition: "all 0.12s",
      }}
    >
      {children}
    </button>
  );
}

function ToggleActiveBtn({ examId, isActive }: { examId: number; isActive: boolean }) {
  const toggle = async () => {
    await fetch(`/api/exams/${examId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    window.location.reload();
  };
  return (
    <button
      onClick={toggle}
      style={{
        padding: "0.28rem 0.65rem", borderRadius: "0.375rem", fontSize: "0.72rem",
        fontWeight: 600, cursor: "pointer", border: "1px solid",
        background: isActive ? "var(--amber-bg)" : "var(--green-bg)",
        borderColor: isActive ? "var(--amber)" : "var(--green)",
        color: isActive ? "var(--amber)" : "var(--green)",
        transition: "all 0.12s",
      }}
    >
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}