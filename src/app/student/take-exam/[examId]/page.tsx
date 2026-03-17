"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from "lucide-react";

type Answer = { questionId: number; selectedAnswer: string };

export default function TakeExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers,      setAnswers]      = useState<Record<number, string>>({});
  const [timeLeft,     setTimeLeft]     = useState<number | null>(null);
  const [attemptId,    setAttemptId]    = useState<number | null>(null);
  const [examStarted,  setExamStarted]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startError,   setStartError]   = useState("");
  const initialized = useRef(false);

  // Fetch exam (no correct answers)
  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ["exam-take", examId],
    queryFn: async () => {
      const res = await fetch(`/api/student/exams/${examId}`);
      if (!res.ok) throw new Error("Failed to fetch exam");
      return res.json();
    },
  });

  // Start exam
  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/student/exams/${examId}/start`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to start exam");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setAttemptId(data.attemptId);
      setTimeLeft(data.remaining ?? data.duration * 60);
      setExamStarted(true);
    },
    onError: (err: any) => setStartError(err.message),
  });

  // Submit
  const submitExam = useCallback(async (forced = false) => {
    if (isSubmitting || !attemptId) return;
    setIsSubmitting(true);

    const formatted: Answer[] = Object.entries(answers).map(([qId, ans]) => ({
      questionId: parseInt(qId),
      selectedAnswer: ans,
    }));

    try {
      const res = await fetch(`/api/student/exams/${examId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers: formatted }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submit failed");
      }
      const data = await res.json();
      router.push(`/student/results/${data.resultId}`);
    } catch (err: any) {
      alert(err.message);
      setIsSubmitting(false);
    }
  }, [attemptId, answers, examId, isSubmitting, router]);

  // Auto-start once exam data is loaded
  useEffect(() => {
    if (initialized.current || !exam || examLoading) return;
    initialized.current = true;
    startMutation.mutate();
  }, [exam, examLoading]); // eslint-disable-line

  // Countdown
  useEffect(() => {
    if (!examStarted || timeLeft === null || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((p) => {
        if (p === null || p <= 1) { clearInterval(t); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [examStarted, timeLeft]);

  // Auto-submit on timeout
  useEffect(() => {
    if (examStarted && timeLeft === 0) submitExam(true);
  }, [timeLeft]); // eslint-disable-line

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const questions    = exam?.examQuestions ?? [];
  const total        = questions.length;
  const curr         = questions[currentIndex];
  const qId          = curr?.question?.id;
  const answered     = Object.keys(answers).length;
  const progress     = total > 0 ? (answered / total) * 100 : 0;
  const isLowTime    = timeLeft !== null && timeLeft < 120;

  const opts = curr ? [
    { key: "A", text: curr.question?.optionA },
    { key: "B", text: curr.question?.optionB },
    { key: "C", text: curr.question?.optionC },
    { key: "D", text: curr.question?.optionD },
  ].filter((o) => o.text) : [];

  // ── Loading / error states ────────────────────────────────────────────────
  if (examLoading || startMutation.isPending || !examStarted || !exam) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "1rem" }}>
        <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--text3)", fontSize: "0.85rem" }}>Loading exam…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (startError) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "2rem", maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <AlertCircle size={36} color="var(--red)" style={{ margin: "0 auto 1rem", display: "block" }} />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", margin: "0 0 0.5rem" }}>Cannot Start Exam</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text2)", marginBottom: "1.25rem" }}>{startError}</p>
          <button
            onClick={() => router.push("/student/exams")}
            style={{ padding: "0.6rem 1.5rem", borderRadius: "0.5rem", background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  if (examStarted && total === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "2rem", textAlign: "center" }}>
          <AlertCircle size={36} color="var(--red)" style={{ margin: "0 auto 1rem", display: "block" }} />
          <p style={{ color: "var(--text2)" }}>This exam has no questions or is unavailable.</p>
          <button onClick={() => router.push("/student/exams")} style={{ marginTop: "1rem", padding: "0.5rem 1.25rem", borderRadius: "0.4rem", background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── Exam UI ───────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", margin: "-2rem" }}>

      {/* Sticky header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "0.875rem 2rem", boxShadow: "var(--shadow)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text)", margin: 0, maxWidth: "400px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {exam.examName}
            </h2>
            <p style={{ fontSize: "0.72rem", color: "var(--text3)", margin: 0 }}>
              Q{currentIndex + 1} of {total} · {answered} answered
            </p>
          </div>

          {/* Timer */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.5rem 1.1rem", borderRadius: "999px",
            fontWeight: 800, fontSize: "1.1rem", fontFamily: "monospace",
            background: isLowTime ? "var(--red-bg)" : "var(--accent-bg)",
            color: isLowTime ? "var(--red)" : "var(--accent)",
            border: `1px solid ${isLowTime ? "var(--red)" : "var(--accent-dim)"}`,
            animation: isLowTime ? "pulse 1s infinite" : "none",
          }}>
            <Clock size={15} />
            {timeLeft !== null ? fmt(timeLeft) : "--:--"}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: "3px", background: "var(--border)", borderRadius: "2px", marginTop: "0.75rem" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "var(--accent)", borderRadius: "2px", transition: "width 0.3s" }} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "2rem", display: "grid", gridTemplateColumns: "1fr 200px", gap: "1.5rem", alignItems: "start" }}>

        {/* Question + options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Question card */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem", boxShadow: "var(--shadow)" }}>
            <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "var(--text)", margin: 0 }}>
              <span style={{ fontWeight: 800, color: "var(--accent)", marginRight: "0.5rem" }}>Q{currentIndex + 1}.</span>
              {curr?.question?.question}
            </p>
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {opts.map((opt) => {
              const selected = answers[qId] === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setAnswers((p) => ({ ...p, [qId]: opt.key }))}
                  style={{
                    textAlign: "left", padding: "0.875rem 1.1rem",
                    borderRadius: "0.625rem", cursor: "pointer", transition: "all 0.12s",
                    border: `2px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                    background: selected ? "var(--accent-bg)" : "var(--surface)",
                    display: "flex", alignItems: "center", gap: "0.875rem",
                    fontSize: "0.88rem", color: "var(--text)",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.borderColor = "var(--border2)";
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  <div style={{
                    width: "1.75rem", height: "1.75rem", borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${selected ? "var(--accent)" : "var(--border2)"}`,
                    background: selected ? "var(--accent)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.7rem", fontWeight: 800,
                    color: selected ? "#fff" : "var(--text3)",
                    transition: "all 0.12s",
                  }}>
                    {selected ? <CheckCircle size={12} /> : opt.key}
                  </div>
                  {opt.text}
                </button>
              );
            })}
          </div>

          {/* Prev / Next */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem" }}>
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              style={{
                display: "flex", alignItems: "center", gap: "0.35rem",
                padding: "0.55rem 1.1rem", borderRadius: "0.5rem",
                border: "1.5px solid var(--border)", background: "none",
                color: "var(--text2)", cursor: currentIndex === 0 ? "not-allowed" : "pointer",
                opacity: currentIndex === 0 ? 0.4 : 1, fontWeight: 600, fontSize: "0.82rem",
              }}
            >
              <ChevronLeft size={15} /> Previous
            </button>

            {currentIndex < total - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))}
                style={{
                  display: "flex", alignItems: "center", gap: "0.35rem",
                  padding: "0.55rem 1.1rem", borderRadius: "0.5rem",
                  border: "none", background: "var(--accent)",
                  color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem",
                }}
              >
                Next <ChevronRight size={15} />
              </button>
            ) : (
              <button
                onClick={() => {
                  const unanswered = total - answered;
                  const msg = unanswered > 0
                    ? `You have ${unanswered} unanswered question(s). Submit anyway?`
                    : "Submit your exam?";
                  if (confirm(msg)) submitExam(false);
                }}
                disabled={isSubmitting}
                style={{
                  padding: "0.55rem 1.5rem", borderRadius: "0.5rem",
                  border: "none", background: isSubmitting ? "var(--border)" : "var(--green)",
                  color: "#fff", cursor: isSubmitting ? "not-allowed" : "pointer",
                  fontWeight: 700, fontSize: "0.82rem", opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? "Submitting…" : "Submit Exam ✓"}
              </button>
            )}
          </div>
        </div>

        {/* Question navigator */}
        <div style={{ position: "sticky", top: "80px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem", boxShadow: "var(--shadow)" }}>
          <p style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.75rem" }}>
            Navigator
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "0.3rem", marginBottom: "1rem" }}>
            {questions.map((_: any, idx: number) => {
              const qid    = questions[idx]?.question?.id;
              const isAns  = !!answers[qid];
              const isCurr = idx === currentIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    height: "2rem", borderRadius: "0.35rem",
                    fontSize: "0.7rem", fontWeight: 700, border: "none", cursor: "pointer",
                    background: isCurr ? "var(--accent)" : isAns ? "var(--green-bg)" : "var(--surface2)",
                    color: isCurr ? "#fff" : isAns ? "var(--green)" : "var(--text3)",
                    outline: isCurr ? "2px solid var(--accent-dim)" : "none",
                    transition: "all 0.1s",
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.68rem", color: "var(--text3)" }}>
            {[
              { bg: "var(--accent)", color: "#fff", label: "Current" },
              { bg: "var(--green-bg)", color: "var(--green)", label: "Answered" },
              { bg: "var(--surface2)", color: "var(--text3)", label: "Not answered" },
            ].map(({ bg, color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: "0.75rem", height: "0.75rem", borderRadius: "0.2rem", background: bg, display: "inline-block", border: "1px solid var(--border)" }} />
                {label}
              </div>
            ))}
          </div>

          {/* Submit from sidebar */}
          <button
            onClick={() => {
              const unanswered = total - answered;
              const msg = unanswered > 0
                ? `${unanswered} unanswered. Submit anyway?`
                : "Submit your exam?";
              if (confirm(msg)) submitExam(false);
            }}
            disabled={isSubmitting}
            style={{
              marginTop: "1rem", width: "100%", padding: "0.55rem",
              borderRadius: "0.45rem", border: "none",
              background: "var(--green)", color: "#fff",
              fontWeight: 700, fontSize: "0.78rem", cursor: "pointer",
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            Submit ({answered}/{total})
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
      `}</style>
    </div>
  );
}