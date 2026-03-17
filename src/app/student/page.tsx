"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  BookOpen, Award, Clock, TrendingUp,
  ChevronRight, PlayCircle, Trophy,
} from "lucide-react";

export default function StudentDashboard() {
  const { data: session } = useSession();

  const { data: stats } = useQuery({
    queryKey: ["student-stats"],
    queryFn: async () => {
      const r = await fetch("/api/student/stats");
      if (!r.ok) throw new Error("stats failed");
      return r.json();
    },
  });

  const { data: upcoming } = useQuery({
    queryKey: ["upcoming-exams"],
    queryFn: async () => {
      const r = await fetch("/api/student/upcoming-exams");
      if (!r.ok) throw new Error("upcoming failed");
      return r.json();
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["recent-results"],
    queryFn: async () => {
      const r = await fetch("/api/student/recent-results?limit=5");
      if (!r.ok) throw new Error("results failed");
      return r.json();
    },
  });

  const username = session?.user?.username ?? "Student";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>
          Welcome back, {username} 👋
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text2)", marginTop: "0.25rem" }}>
          Here's your exam activity at a glance
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
        {[
          { label: "Available",  value: stats?.totalExams     ?? 0,     Icon: BookOpen,   color: "var(--accent)", bg: "var(--accent-bg)" },
          { label: "Completed",  value: stats?.completedExams ?? 0,     Icon: Award,      color: "var(--green)",  bg: "var(--green-bg)"  },
          { label: "Pending",    value: stats?.pendingExams   ?? 0,     Icon: Clock,      color: "var(--amber)",  bg: "var(--amber-bg)"  },
          { label: "Avg Score",  value: `${stats?.averageScore ?? 0}%`, Icon: TrendingUp, color: "var(--accent)", bg: "var(--accent-bg)" },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "1.25rem",
            display: "flex", gap: "1rem", alignItems: "center",
            boxShadow: "var(--shadow)",
          }}>
            <div style={{
              width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem",
              background: bg, display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
            }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text2)", marginTop: "0.2rem" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column lower section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

        {/* Available exams */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Available Exams
            </span>
            <Link href="/student/exams" style={{ fontSize: "0.72rem", color: "var(--accent)", textDecoration: "none" }}>
              View all →
            </Link>
          </div>

          {!upcoming || upcoming.length === 0 ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text3)", fontSize: "0.82rem" }}>
              No exams available right now
            </div>
          ) : (
            upcoming.slice(0, 5).map((exam: any) => (
              <Link key={exam.id} href={`/student/take-exam/${exam.id}`} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    padding: "0.875rem 1.25rem",
                    borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center",
                    gap: "0.875rem", cursor: "pointer", transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{
                    width: "2rem", height: "2rem", borderRadius: "0.45rem",
                    background: "var(--accent-bg)", display: "flex",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <PlayCircle size={14} color="var(--accent)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {exam.examName}
                    </p>
                    <p style={{ fontSize: "0.68rem", color: "var(--text3)", margin: "0.15rem 0 0" }}>
                      {exam.subject?.name} · {exam.duration} min{exam.totalMarks ? ` · ${exam.totalMarks} marks` : ""}
                    </p>
                  </div>
                  <ChevronRight size={14} color="var(--text3)" />
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Recent results */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Recent Results
            </span>
            <Link href="/student/results" style={{ fontSize: "0.72rem", color: "var(--accent)", textDecoration: "none" }}>
              View all →
            </Link>
          </div>

          {!recent || recent.length === 0 ? (
            <div style={{ padding: "2.5rem", textAlign: "center" }}>
              <Trophy size={28} style={{ color: "var(--text3)", margin: "0 auto 0.75rem", display: "block" }} />
              <p style={{ fontSize: "0.82rem", color: "var(--text3)", margin: 0 }}>
                No results yet —{" "}
                <Link href="/student/exams" style={{ color: "var(--accent)" }}>take an exam</Link>
              </p>
            </div>
          ) : (
            recent.map((r: any) => {
              const pct   = r.score ?? 0;
              const color = pct >= 75 ? "var(--green)" : pct >= 50 ? "var(--amber)" : "var(--red)";
              return (
                <Link key={r.id} href={`/student/results/${r.id}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      padding: "0.875rem 1.25rem",
                      borderBottom: "1px solid var(--border)",
                      display: "flex", alignItems: "center",
                      gap: "0.875rem", cursor: "pointer", transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.examName}
                      </p>
                      <p style={{ fontSize: "0.68rem", color: "var(--text3)", margin: "0.15rem 0 0" }}>
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: "1rem", color, flexShrink: 0 }}>{pct}%</span>
                    <ChevronRight size={14} color="var(--text3)" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}