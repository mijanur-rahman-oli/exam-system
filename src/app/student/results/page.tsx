"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Trophy, TrendingUp, BookOpen, ChevronRight } from "lucide-react";

export default function StudentResultsPage() {
  const { data: results, isLoading } = useQuery({
    queryKey: ["all-results"],
    queryFn: () => fetch("/api/student/recent-results?limit=100").then((r) => r.json()),
  });

  const list = Array.isArray(results) ? results : [];
  const avg  = list.length ? Math.round(list.reduce((s: number, r: any) => s + r.score, 0) / list.length) : 0;
  const best = list.length ? Math.max(...list.map((r: any) => r.score)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>My Results</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text2)", marginTop: "0.25rem" }}>Track your performance over time</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
        {[
          { label: "Exams Taken",   value: list.length,  Icon: BookOpen,   color: "var(--accent)", bg: "var(--accent-bg)" },
          { label: "Average Score", value: `${avg}%`,    Icon: TrendingUp, color: "var(--amber)",  bg: "var(--amber-bg)"  },
          { label: "Best Score",    value: `${best}%`,   Icon: Trophy,     color: "var(--green)",  bg: "var(--green-bg)"  },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "1.25rem",
            display: "flex", gap: "1rem", alignItems: "center",
            boxShadow: "var(--shadow)",
          }}>
            <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text2)", marginTop: "0.2rem" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Results table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
        <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            All Attempts ({list.length})
          </span>
        </div>

        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)", fontSize: "0.85rem" }}>Loading…</div>
        ) : list.length === 0 ? (
          <div style={{ padding: "3.5rem", textAlign: "center" }}>
            <Trophy size={36} style={{ color: "var(--text3)", margin: "0 auto 1rem", display: "block" }} />
            <p style={{ fontWeight: 700, color: "var(--text2)", margin: 0 }}>No results yet</p>
            <p style={{ fontSize: "0.78rem", color: "var(--text3)", margin: "0.4rem 0 1.25rem" }}>
              Complete an exam to see your results here
            </p>
            <Link href="/student/exams">
              <button style={{ padding: "0.55rem 1.25rem", borderRadius: "0.45rem", background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
                Browse Exams
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                  {["Exam", "Score", "Performance", "Date", ""].map((h) => (
                    <th key={h} style={{
                      padding: "0.625rem 1.1rem", textAlign: "left",
                      fontSize: "0.65rem", fontWeight: 700, color: "var(--text3)",
                      textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((r: any) => {
                  const pct   = r.score ?? 0;
                  const color = pct >= 75 ? "var(--green)" : pct >= 50 ? "var(--amber)" : "var(--red)";
                  const label = pct >= 75 ? "Excellent" : pct >= 50 ? "Pass" : "Needs Work";
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.12s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface2)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: "0.875rem 1.1rem", fontWeight: 600, color: "var(--text)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.examName}
                      </td>
                      <td style={{ padding: "0.875rem 1.1rem" }}>
                        <span style={{ fontSize: "1.1rem", fontWeight: 800, color }}>{pct}%</span>
                      </td>
                      <td style={{ padding: "0.875rem 1.1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div style={{ width: "80px", height: "5px", borderRadius: "3px", background: "var(--surface3)" }}>
                            <div style={{ width: `${pct}%`, height: "100%", borderRadius: "3px", background: color, transition: "width 0.3s" }} />
                          </div>
                          <span style={{ fontSize: "0.68rem", color, fontWeight: 600 }}>{label}</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1.1rem", color: "var(--text3)", whiteSpace: "nowrap" }}>
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: "0.875rem 1.1rem" }}>
                        <Link href={`/student/results/${r.id}`} style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.75rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                          Details <ChevronRight size={12} />
                        </Link>
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