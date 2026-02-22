"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Search, Check, X, ChevronDown, Clock, Calendar, RotateCcw, Zap } from "lucide-react";
import Link from "next/link";

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  examName:     z.string().min(3, "Exam name required"),
  gradeLevel:   z.string().min(1, "Grade required"),
  subjectId:    z.string().min(1, "Subject required"),
  chapterId:    z.string().optional(),
  subconceptId: z.string().optional(),
  scheduleTime: z.string().optional(),
  duration:     z.coerce.number().min(5, "Min 5 minutes").default(60),
  retakeAllowed: z.boolean().default(false),
  isActive:     z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

// ─── Shared input style ───────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%", height: "2.1rem",
  padding: "0 0.75rem", borderRadius: "0.5rem",
  background: "var(--input-bg)", border: "1.5px solid var(--border)",
  color: "var(--text)", fontSize: "0.82rem", outline: "none",
  boxSizing: "border-box", transition: "border-color 0.15s",
};

function Input({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      {label && <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>{label}</span>}
      <input
        {...props}
        style={{ ...inp, ...(error ? { borderColor: "var(--red)" } : {}) }}
        onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; props.onFocus?.(e); }}
        onBlur={(e) => { e.target.style.borderColor = error ? "var(--red)" : "var(--border)"; props.onBlur?.(e); }}
      />
      {error && <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>{error}</span>}
    </div>
  );
}

function Sel({ label, children, error, disabled, value, onChange }: {
  label?: string; children: React.ReactNode; error?: string;
  disabled?: boolean; value?: string; onChange?: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      {label && <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>{label}</span>}
      <select
        value={value} onChange={e => onChange?.(e.target.value)} disabled={disabled}
        style={{ ...inp, height: "2.1rem", appearance: "none", opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "auto" }}
        onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
        onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>{error}</span>}
    </div>
  );
}

function Toggle({ label, checked, onChange, desc }: { label: string; checked: boolean; onChange: (v: boolean) => void; desc?: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: "1rem" }}>
      <div>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>{label}</div>
        {desc && <div style={{ fontSize: "0.7rem", color: "var(--text3)", marginTop: "0.1rem" }}>{desc}</div>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: "2.5rem", height: "1.35rem", borderRadius: "999px",
          background: checked ? "var(--accent)" : "var(--surface3)",
          border: `1.5px solid ${checked ? "var(--accent)" : "var(--border)"}`,
          position: "relative", transition: "all 0.2s", flexShrink: 0,
        }}
      >
        <div style={{
          width: "1rem", height: "1rem", borderRadius: "50%",
          background: "#fff", position: "absolute",
          top: "50%", transform: `translateX(${checked ? "1.2rem" : "0.1rem"}) translateY(-50%)`,
          transition: "transform 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
        }} />
      </div>
    </label>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CreateExamPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selSubject, setSelSubject] = useState("");
  const [selChapter, setSelChapter] = useState("");
  const [selSubconcept, setSelSubconcept] = useState("");
  const [selGrade, setSelGrade] = useState("");
  const [search, setSearch] = useState("");

  // Selected question ids with per-question marks
  const [selected, setSelected] = useState<Record<number, { marks: number }>>({});

  // Queries for dropdowns
  const { data: subjects }    = useQuery({ queryKey: ["subjects"],               queryFn: () => fetch("/api/subjects").then(r => r.json()) });
  const { data: chapters }    = useQuery({ queryKey: ["chapters", selSubject],    queryFn: () => fetch(`/api/chapters?subjectId=${selSubject}`).then(r => r.json()), enabled: !!selSubject });
  const { data: subconcepts } = useQuery({ queryKey: ["subconcepts", selChapter], queryFn: () => fetch(`/api/subconcepts?chapterId=${selChapter}`).then(r => r.json()), enabled: !!selChapter });

  // Question browser query
  const { data: questions, isLoading: qLoading } = useQuery({
    queryKey: ["question-browser", selGrade, selSubject, selChapter, selSubconcept],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selGrade)      params.set("gradeLevel", selGrade);
      if (selSubject)    params.set("subjectId", selSubject);
      if (selChapter)    params.set("chapterId", selChapter);
      if (selSubconcept) params.set("subconceptId", selSubconcept);
      return fetch(`/api/questions?${params}`).then(r => r.json());
    },
    enabled: !!(selGrade && selSubject),
  });

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { duration: 60, retakeAllowed: false, isActive: true },
  });

  const retake   = watch("retakeAllowed");
  const isActive = watch("isActive");

  const filteredQ = (questions ?? []).filter((q: any) =>
    !search || q.question.toLowerCase().includes(search.toLowerCase())
  );

  const toggleQ = (id: number) => {
    setSelected(prev => {
      const n = { ...prev };
      if (n[id]) delete n[id]; else n[id] = { marks: 1 };
      return n;
    });
  };

  const totalMarks = Object.values(selected).reduce((s, v) => s + v.marks, 0);

  const onSubmit = async (data: FormData) => {
    const selCount = Object.keys(selected).length;
    if (selCount === 0) {
      toast({ title: "Select at least one question", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const questions = Object.entries(selected).map(([id, v]) => ({
        questionId: parseInt(id), marks: v.marks,
      }));
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, questions }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast({ title: "Exam created!" });
      router.push("/teacher/exams");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const diffBadge = (d: string) => ({
    easy:   { bg: "var(--green-bg)",  color: "var(--green)",  label: "Easy"   },
    medium: { bg: "var(--amber-bg)",  color: "var(--amber)",  label: "Med"    },
    hard:   { bg: "var(--red-bg)",    color: "var(--red)",    label: "Hard"   },
  }[d] ?? { bg: "var(--surface2)", color: "var(--text3)", label: d });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/teacher/exams">
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", display: "flex" }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>Create Exam</h1>
            <p style={{ fontSize: "0.78rem", color: "var(--text3)", margin: 0 }}>Filter questions then configure exam settings</p>
          </div>
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          style={{
            padding: "0.5rem 1.25rem", borderRadius: "0.5rem",
            background: loading ? "var(--accent-dim)" : "var(--accent)",
            border: "none", color: "#fff", fontWeight: 700,
            fontSize: "0.82rem", cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating…" : `Create Exam (${Object.keys(selected).length} Qs, ${totalMarks} pts)`}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.25rem", alignItems: "start" }}>
        {/* ── Left: question browser ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Filter bar */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "1.1rem 1.25rem",
          }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>
              Browse Question Bank
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.65rem" }}>
              <Sel label="Grade" value={selGrade} onChange={setSelGrade}>
                <option value="">All grades</option>
                {[6,7,8,9,10,11,12].map(g => <option key={g} value={String(g)}>Grade {g}</option>)}
              </Sel>

              <Sel label="Subject" value={selSubject} onChange={v => { setSelSubject(v); setSelChapter(""); setSelSubconcept(""); }}>
                <option value="">Select subject</option>
                {subjects?.map((s: any) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </Sel>

              <Sel label="Chapter" value={selChapter} onChange={v => { setSelChapter(v); setSelSubconcept(""); }} disabled={!selSubject}>
                <option value="">All chapters</option>
                {chapters?.map((c: any) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </Sel>

              <Sel label="Subconcept" value={selSubconcept} onChange={setSelSubconcept} disabled={!selChapter}>
                <option value="">All subconcepts</option>
                {subconcepts?.map((sc: any) => <option key={sc.id} value={String(sc.id)}>{sc.name}</option>)}
              </Sel>
            </div>
          </div>

          {/* Questions list */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", overflow: "hidden",
          }}>
            <div style={{
              padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text2)" }}>
                {qLoading ? "Loading…" : `${filteredQ.length} questions`}
              </span>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search questions…"
                  style={{ ...inp, paddingLeft: "1.85rem", width: "220px", height: "1.9rem" }}
                />
              </div>
            </div>

            <div style={{ maxHeight: "520px", overflowY: "auto" }}>
              {!selSubject ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)", fontSize: "0.85rem" }}>
                  Select a subject to browse questions
                </div>
              ) : filteredQ.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)", fontSize: "0.85rem" }}>
                  No questions found with these filters
                </div>
              ) : filteredQ.map((q: any) => {
                const isSelected = !!selected[q.id];
                const db = diffBadge(q.difficulty);
                return (
                  <div
                    key={q.id}
                    style={{
                      padding: "0.875rem 1.25rem",
                      borderBottom: "1px solid var(--border)",
                      background: isSelected ? "var(--accent-bg)" : "transparent",
                      transition: "background 0.12s",
                      display: "flex", alignItems: "flex-start", gap: "0.875rem",
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleQ(q.id)}
                      style={{
                        flexShrink: 0, marginTop: "0.15rem",
                        width: "1.25rem", height: "1.25rem",
                        borderRadius: "0.3rem", border: `2px solid ${isSelected ? "var(--accent)" : "var(--border2)"}`,
                        background: isSelected ? "var(--accent)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all 0.12s",
                      }}
                    >
                      {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: "0.82rem", color: "var(--text)", margin: 0,
                        lineHeight: 1.5, display: "-webkit-box",
                        WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {q.question}
                      </p>
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem", borderRadius: "999px", background: db.bg, color: db.color }}>
                          {db.label}
                        </span>
                        <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>
                          {q.marks} pt{q.marks !== 1 ? "s" : ""}
                        </span>
                        {q.chapter?.name && (
                          <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>
                            {q.chapter.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Per-question marks override */}
                    {isSelected && (
                      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>marks</span>
                        <input
                          type="number" min={1} max={20}
                          value={selected[q.id]?.marks ?? 1}
                          onChange={e => setSelected(prev => ({ ...prev, [q.id]: { marks: parseInt(e.target.value) || 1 } }))}
                          style={{ ...inp, width: "3rem", height: "1.75rem", textAlign: "center", padding: "0 0.25rem" }}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right: exam settings ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", position: "sticky", top: "1.5rem" }}>

          {/* Basic info */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "1.1rem 1.25rem",
            display: "flex", flexDirection: "column", gap: "0.875rem",
          }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              Exam Settings
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>Exam Name</span>
              <input {...register("examName")}
                placeholder="e.g. Chapter 3 Test"
                style={{ ...inp }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
              {errors.examName && <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>{errors.examName.message}</span>}
            </div>

            <Controller name="gradeLevel" control={control} render={({ field }) => (
              <Sel label="Grade Level" value={field.value} onChange={field.onChange} error={errors.gradeLevel?.message}>
                <option value="">Select grade</option>
                {[6,7,8,9,10,11,12].map(g => <option key={g} value={String(g)}>Grade {g}</option>)}
              </Sel>
            )} />

            <Controller name="subjectId" control={control} render={({ field }) => (
              <Sel label="Subject" value={field.value} onChange={field.onChange} error={errors.subjectId?.message}>
                <option value="">Select subject</option>
                {subjects?.map((s: any) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </Sel>
            )} />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>
                <Clock size={11} style={{ display: "inline", marginRight: "0.3rem" }} />
                Duration (min)
              </span>
              <input type="number" min={5} {...register("duration")}
                style={{ ...inp }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
              {errors.duration && <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>{errors.duration.message}</span>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>
                <Calendar size={11} style={{ display: "inline", marginRight: "0.3rem" }} />
                Schedule Time
              </span>
              <input type="datetime-local" {...register("scheduleTime")}
                style={{ ...inp }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>
          </div>

          {/* Toggles */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "1rem 1.25rem",
            display: "flex", flexDirection: "column", gap: "1rem",
          }}>
            <Controller name="isActive" control={control} render={({ field }) => (
              <Toggle label="Publish immediately" desc="Students can see and attempt this exam"
                checked={field.value} onChange={field.onChange} />
            )} />
            <div style={{ height: "1px", background: "var(--border)" }} />
            <Controller name="retakeAllowed" control={control} render={({ field }) => (
              <Toggle label="Allow retakes" desc="Students can attempt more than once"
                checked={field.value} onChange={field.onChange} />
            )} />
          </div>

          {/* Summary */}
          {Object.keys(selected).length > 0 && (
            <div style={{
              background: "var(--accent-bg)", border: "1px solid var(--accent-dim)",
              borderRadius: "var(--radius)", padding: "0.875rem 1rem",
            }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent)", margin: "0 0 0.5rem" }}>
                Selected Questions
              </p>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--accent)" }}>
                {Object.keys(selected).length}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text2)", marginTop: "0.2rem" }}>
                Total: {totalMarks} marks
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}