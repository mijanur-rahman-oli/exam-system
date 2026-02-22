"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, ChevronDown, ChevronRight, TrendingUp, Users, Award } from "lucide-react";

export default function ViewResultsPage() {
  const [search,        setSearch]        = useState("");
  const [gradeFilter,   setGradeFilter]   = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [examFilter,    setExamFilter]    = useState("");
  const [expanded,      setExpanded]      = useState<Record<string, boolean>>({});

  const { data: results, isLoading } = useQuery({
    queryKey: ["teacher-results", gradeFilter, subjectFilter, examFilter],
    queryFn: () => {
      const p = new URLSearchParams();
      if (gradeFilter)   p.set("grade", gradeFilter);
      if (subjectFilter) p.set("subject", subjectFilter);
      if (examFilter)    p.set("exam", examFilter);
      return fetch(`/api/teacher/results?${p}`).then(r => r.json());
    },
  });

  const { data: filterOptions } = useQuery({
    queryKey: ["result-filter-options"],
    queryFn: () => fetch("/api/teacher/result-filters").then(r => r.json()),
  });

  // Group by grade
  const grouped: Record<string, any[]> = {};
  (results ?? []).forEach((r: any) => {
    if (search) {
      const q = search.toLowerCase();
      if (!r.studentName?.toLowerCase().includes(q) && !r.examName?.toLowerCase().includes(q)) return;
    }
    const grade = r.studentGrade ?? "Unknown";
    if (!grouped[grade]) grouped[grade] = [];
    grouped[grade].push(r);
  });

  const grades = Object.keys(grouped).sort();

  const inp: React.CSSProperties = {
    background: "var(--input-bg)", border: "1.5px solid var(--border)",
    color: "var(--text)", borderRadius: "0.5rem", outline: "none",
    fontSize: "0.8rem", padding: "0 0.75rem", height: "2rem",
    transition: "border-color 0.15s",
  };

  const avgScore = (rows: any[]) => {
    if (!rows.length) return 0;
    return (rows.reduce((s, r) => s + (r.score ?? 0), 0) / rows.length).toFixed(1);
  };

  const scoreColor = (pct: number) =>
    pct >= 75 ? "var(--green)" : pct >= 50 ? "var(--amber)" : "var(--red)";

  const scoreBg = (pct: number) =>
    pct >= 75 ? "var(--green-bg)" : pct >= 50 ? "var(--amber-bg)" : "var(--red-bg)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
            Student Results
          </h1>
          <p style={{ fontSize: "0.78rem", color: "var(--text3)", margin: 0 }}>
            Class-wise breakdown of all exam attempts
          </p>
        </div>
        <button
          onClick={() => {/* CSV export */}}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.45rem 0.9rem", borderRadius: "0.5rem",
            background: "var(--surface)", border: "1px solid var(--border)",
            color: "var(--text2)", fontSize: "0.78rem", cursor: "pointer",
            fontWeight: 600,
          }}
        >
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      {results && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {[
            { label: "Total Attempts",  value: results.length,                icon: TrendingUp, color: "var(--accent)", bg: "var(--accent-bg)" },
            { label: "Students",        value: new Set(results.map((r: any) => r.studentId)).size, icon: Users, color: "var(--green)", bg: "var(--green-bg)" },
            { label: "Avg Score",       value: `${avgScore(results)}%`,        icon: Award,      color: "var(--amber)", bg: "var(--amber-bg)" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "1rem 1.25rem",
              display: "flex", alignItems: "center", gap: "1rem",
            }}>
              <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={16} color={color} />
              </div>
              <div>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--text)" }}>{value}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text3)" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius)", padding: "0.875rem 1.25rem",
        display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center",
      }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search size={13} style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search student or exam…"
            style={{ ...inp, paddingLeft: "1.85rem", width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
          style={{ ...inp, width: "130px", appearance: "none" }}>
          <option value="">All grades</option>
          {filterOptions?.grades?.map((g: string) => <option key={g} value={g}>Grade {g}</option>)}
        </select>
        <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
          style={{ ...inp, width: "150px", appearance: "none" }}>
          <option value="">All subjects</option>
          {filterOptions?.subjects?.map((s: string) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={examFilter} onChange={e => setExamFilter(e.target.value)}
          style={{ ...inp, width: "180px", appearance: "none" }}>
          <option value="">All exams</option>
          {filterOptions?.exams?.map((e: string) => <option key={e} value={e}>{e}</option>)}
        </select>
        {(gradeFilter || subjectFilter || examFilter || search) && (
          <button
            onClick={() => { setSearch(""); setGradeFilter(""); setSubjectFilter(""); setExamFilter(""); }}
            style={{ ...inp, width: "auto", padding: "0 0.75rem", cursor: "pointer", color: "var(--red)", borderColor: "var(--red)", background: "var(--red-bg)" }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Results grouped by grade */}
      {isLoading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>Loading results…</div>
      ) : grades.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
          No results found
        </div>
      ) : grades.map(grade => {
        const rows = grouped[grade];
        const isOpen = expanded[grade] !== false; // default open
        const avg = parseFloat(avgScore(rows));
        return (
          <div key={grade} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", overflow: "hidden",
          }}>
            {/* Grade header */}
            <div
              onClick={() => setExpanded(prev => ({ ...prev, [grade]: !isOpen }))}
              style={{
                padding: "0.875rem 1.25rem",
                borderBottom: isOpen ? "1px solid var(--border)" : "none",
                display: "flex", alignItems: "center", gap: "0.75rem",
                cursor: "pointer", background: "var(--surface2)",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface3)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--surface2)")}
            >
              {isOpen ? <ChevronDown size={15} color="var(--text3)" /> : <ChevronRight size={15} color="var(--text3)" />}
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text)" }}>
                Grade {grade}
              </span>
              <span style={{
                fontSize: "0.7rem", padding: "0.15rem 0.55rem", borderRadius: "999px",
                background: "var(--accent-bg)", color: "var(--accent)", fontWeight: 700,
              }}>
                {rows.length} attempt{rows.length !== 1 ? "s" : ""}
              </span>
              <div style={{
                marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.75rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <div style={{ width: "80px", height: "5px", borderRadius: "999px", background: "var(--surface3)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(avg, 100)}%`, background: scoreColor(avg), borderRadius: "999px", transition: "width 0.4s" }} />
                  </div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: scoreColor(avg) }}>
                    {avg}% avg
                  </span>
                </div>
              </div>
            </div>

            {/* Table */}
            {isOpen && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Student", "Exam", "Subject", "Score", "Submitted"].map(h => (
                        <th key={h} style={{
                          padding: "0.55rem 1rem", textAlign: "left",
                          fontSize: "0.64rem", fontWeight: 700,
                          color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r: any, i: number) => {
                      const pct = r.score ?? 0;
                      return (
                        <tr
                          key={i}
                          style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "0.7rem 1rem", fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>
                            {r.studentName}
                          </td>
                          <td style={{ padding: "0.7rem 1rem", fontSize: "0.78rem", color: "var(--text2)" }}>
                            {r.examName}
                          </td>
                          <td style={{ padding: "0.7rem 1rem", fontSize: "0.78rem", color: "var(--text2)" }}>
                            {r.subjectName}
                          </td>
                          <td style={{ padding: "0.7rem 1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              <div style={{ width: "60px", height: "4px", borderRadius: "999px", background: "var(--surface3)", overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: scoreColor(pct), borderRadius: "999px" }} />
                              </div>
                              <span style={{
                                fontSize: "0.75rem", fontWeight: 700,
                                color: scoreColor(pct),
                                background: scoreBg(pct),
                                padding: "0.15rem 0.45rem", borderRadius: "0.3rem",
                              }}>
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "0.7rem 1rem", fontSize: "0.75rem", color: "var(--text3)" }}>
                            {r.submittedAt
                              ? new Date(r.submittedAt).toLocaleDateString("en-US", {
                                  month: "short", day: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                                })
                              : "—"}
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
      })}
    </div>
  );
}