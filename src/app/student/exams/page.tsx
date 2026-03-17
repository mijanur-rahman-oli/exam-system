"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { BookOpen, Clock, Trophy, PlayCircle, Search } from "lucide-react";

export default function StudentExamsPage() {
  const [search, setSearch] = useState("");

  const { data: exams, isLoading } = useQuery({
    queryKey: ["upcoming-exams"],
    queryFn: () => fetch("/api/student/upcoming-exams").then((r) => r.json()),
  });

  const list = Array.isArray(exams) ? exams : [];
  const filtered = list.filter((e: any) =>
    !search ||
    e.examName.toLowerCase().includes(search.toLowerCase()) ||
    e.subject?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>
            Available Exams
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text2)", marginTop: "0.25rem" }}>
            {isLoading ? "Loading…" : `${filtered.length} exam${filtered.length !== 1 ? "s" : ""} available`}
          </p>
        </div>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exams…"
            style={{
              paddingLeft: "2.1rem", paddingRight: "0.875rem", height: "2.25rem",
              borderRadius: "0.5rem", border: "1.5px solid var(--border)",
              background: "var(--input-bg)", color: "var(--text)", fontSize: "0.82rem",
              outline: "none", width: "220px", transition: "border-color 0.15s",
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
          />
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem", height: "160px", opacity: 0.4 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", padding: "3.5rem", textAlign: "center",
        }}>
          <BookOpen size={36} style={{ color: "var(--text3)", margin: "0 auto 1rem", display: "block" }} />
          <p style={{ fontWeight: 700, color: "var(--text2)", margin: 0 }}>
            {search ? "No exams match your search" : "No exams available right now"}
          </p>
          <p style={{ fontSize: "0.78rem", color: "var(--text3)", marginTop: "0.4rem" }}>
            {search ? "Try a different search term" : "Check back later — new exams will appear here"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "1rem" }}>
          {filtered.map((exam: any) => (
            <div
              key={exam.id}
              style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: "1.25rem",
                display: "flex", flexDirection: "column", gap: "0.875rem",
                boxShadow: "var(--shadow)", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Title row */}
              <div>
                {exam.subject?.name && (
                  <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 0.3rem" }}>
                    {exam.subject.name}
                  </p>
                )}
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1.4 }}>
                  {exam.examName}
                </h3>
                {exam.description && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text3)", margin: "0.35rem 0 0", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
                    {exam.description}
                  </p>
                )}
              </div>

              {/* Meta pills */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", color: "var(--text2)", background: "var(--surface2)", padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                  <Clock size={10} /> {exam.duration} min
                </span>
                {exam.totalMarks && (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", color: "var(--text2)", background: "var(--surface2)", padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                    <Trophy size={10} /> {exam.totalMarks} marks
                  </span>
                )}
                {exam.gradeLevel && (
                  <span style={{ fontSize: "0.7rem", color: "var(--text2)", background: "var(--surface2)", padding: "0.2rem 0.6rem", borderRadius: "999px" }}>
                    Grade {exam.gradeLevel}
                  </span>
                )}
              </div>

              {/* CTA */}
              <Link href={`/student/take-exam/${exam.id}`} style={{ textDecoration: "none" }}>
                <button style={{
                  width: "100%", padding: "0.6rem", borderRadius: "0.5rem",
                  background: "var(--accent)", border: "none", color: "#fff",
                  fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                  transition: "opacity 0.15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                >
                  <PlayCircle size={14} /> Start Exam
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}