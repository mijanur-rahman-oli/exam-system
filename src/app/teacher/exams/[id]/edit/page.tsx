"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { ArrowLeft, Check, Search, Clock, Calendar, Trash2, Save } from "lucide-react";

const schema = z.object({
  examName:     z.string().min(3),
  gradeLevel:   z.string().min(1),
  subjectId:    z.string().min(1),
  scheduleTime: z.string().optional(),
  duration:     z.coerce.number().min(5).default(60),
  retakeAllowed: z.boolean().default(false),
  isActive:     z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

const inp: React.CSSProperties = {
  width: "100%", height: "2.1rem", padding: "0 0.75rem",
  borderRadius: "0.5rem", background: "var(--input-bg)",
  border: "1.5px solid var(--border)", color: "var(--text)",
  fontSize: "0.82rem", outline: "none", boxSizing: "border-box",
  transition: "border-color 0.15s",
};

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
          width: "1rem", height: "1rem", borderRadius: "50%", background: "#fff",
          position: "absolute", top: "50%",
          transform: `translateX(${checked ? "1.2rem" : "0.1rem"}) translateY(-50%)`,
          transition: "transform 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
        }} />
      </div>
    </label>
  );
}

export default function EditExamPage() {
  const params = useParams();
  const examId = parseInt(params.id as string);
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<number, { marks: number }>>({});

  // Fetch exam
  const { data: exam } = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => fetch(`/api/exams/${examId}`).then(r => r.json()),
  });

  // Fetch all questions for this exam's subject
  const { data: questions } = useQuery({
    queryKey: ["exam-questions-pool", exam?.subjectId],
    queryFn: () => fetch(`/api/questions?subjectId=${exam.subjectId}`).then(r => r.json()),
    enabled: !!exam?.subjectId,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetch("/api/subjects").then(r => r.json()),
  });

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Pre-fill form when exam loads
  useEffect(() => {
    if (!exam) return;
    reset({
      examName:     exam.examName,
      gradeLevel:   String(exam.gradeLevel ?? ""),
      subjectId:    String(exam.subjectId),
      duration:     exam.duration,
      scheduleTime: exam.scheduleTime
        ? new Date(exam.scheduleTime).toISOString().slice(0, 16)
        : "",
      retakeAllowed: exam.retakeAllowed,
      isActive:     exam.isActive,
    });

    // Pre-select existing questions
    const presel: Record<number, { marks: number }> = {};
    exam.examQuestions?.forEach((eq: any) => {
      presel[eq.questionId] = { marks: eq.marks };
    });
    setSelected(presel);
  }, [exam, reset]);

  const toggleQ = (id: number, defaultMarks = 1) => {
    setSelected(prev => {
      const n = { ...prev };
      if (n[id]) delete n[id]; else n[id] = { marks: defaultMarks };
      return n;
    });
  };

  const onSubmit = async (data: FormData) => {
    if (Object.keys(selected).length === 0) {
      toast({ title: "Select at least one question", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const questionList = Object.entries(selected).map(([id, v]) => ({
        questionId: parseInt(id), marks: v.marks,
      }));
      const res = await fetch(`/api/exams/${examId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, questions: questionList }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      qc.invalidateQueries({ queryKey: ["exam", examId] });
      toast({ title: "Exam updated!" });
      router.push("/teacher/exams");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const retakeAllowed = watch("retakeAllowed");
  const isActive      = watch("isActive");
  const totalMarks    = Object.values(selected).reduce((s, v) => s + v.marks, 0);

  const diffBadge = (d: string) => ({
    easy:   { bg: "var(--green-bg)", color: "var(--green)"  },
    medium: { bg: "var(--amber-bg)", color: "var(--amber)"  },
    hard:   { bg: "var(--red-bg)",   color: "var(--red)"    },
  }[d] ?? { bg: "var(--surface2)", color: "var(--text3)" });

  const filteredQ = (questions ?? []).filter((q: any) =>
    !search || q.question.toLowerCase().includes(search.toLowerCase())
  );

  if (!exam) return (
    <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>Loading…</div>
  );

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
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>Edit Exam</h1>
            <p style={{ fontSize: "0.78rem", color: "var(--text3)", margin: 0 }}>
              {exam.examName}
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.5rem 1.25rem", borderRadius: "0.5rem",
            background: loading ? "var(--accent-dim)" : "var(--accent)",
            border: "none", color: "#fff", fontWeight: 700,
            fontSize: "0.82rem", cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          <Save size={14} />
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.25rem", alignItems: "start" }}>
        {/* Question picker */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", overflow: "hidden",
        }}>
          <div style={{
            padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text2)" }}>
                {filteredQ.length} questions in this subject
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--text3)", marginLeft: "0.75rem" }}>
                {Object.keys(selected).length} selected · {totalMarks} marks
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search questions…"
                style={{ ...inp, paddingLeft: "1.85rem", width: "200px", height: "1.9rem" }}
              />
            </div>
          </div>

          <div style={{ maxHeight: "560px", overflowY: "auto" }}>
            {filteredQ.map((q: any) => {
              const isSelected = !!selected[q.id];
              const db = diffBadge(q.difficulty ?? "medium");
              return (
                <div
                  key={q.id}
                  style={{
                    padding: "0.875rem 1.25rem",
                    borderBottom: "1px solid var(--border)",
                    background: isSelected ? "var(--accent-bg)" : "transparent",
                    display: "flex", alignItems: "flex-start", gap: "0.875rem",
                    transition: "background 0.12s",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleQ(q.id, q.marks)}
                    style={{
                      flexShrink: 0, marginTop: "0.15rem",
                      width: "1.25rem", height: "1.25rem", borderRadius: "0.3rem",
                      border: `2px solid ${isSelected ? "var(--accent)" : "var(--border2)"}`,
                      background: isSelected ? "var(--accent)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", transition: "all 0.12s",
                    }}
                  >
                    {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: "0.82rem", color: "var(--text)", margin: 0, lineHeight: 1.5,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {q.question}
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.35rem" }}>
                      <span style={{
                        fontSize: "0.62rem", padding: "0.12rem 0.4rem",
                        borderRadius: "999px", background: db.bg, color: db.color,
                      }}>
                        {q.difficulty}
                      </span>
                      <span style={{ fontSize: "0.62rem", color: "var(--text3)" }}>
                        {q.chapter?.name}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>marks</span>
                      <input
                        type="number" min={1} max={20}
                        value={selected[q.id]?.marks ?? 1}
                        onChange={e => setSelected(prev => ({ ...prev, [q.id]: { marks: parseInt(e.target.value) || 1 } }))}
                        onClick={e => e.stopPropagation()}
                        style={{ ...inp, width: "3rem", height: "1.75rem", textAlign: "center", padding: "0 0.25rem" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", position: "sticky", top: "1.5rem" }}>
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
              <input {...register("examName")} style={{ ...inp }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>Grade Level</span>
              <select {...register("gradeLevel")} style={{ ...inp, appearance: "none" }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              >
                <option value="">Select</option>
                {[6,7,8,9,10,11,12].map(g => <option key={g} value={String(g)}>Grade {g}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>Subject</span>
              <select {...register("subjectId")} style={{ ...inp, appearance: "none" }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              >
                {subjects?.map((s: any) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>
                <Clock size={11} style={{ display: "inline", marginRight: "0.3rem" }} />
                Duration (min)
              </span>
              <input type="number" {...register("duration")} style={{ ...inp }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>
                <Calendar size={11} style={{ display: "inline", marginRight: "0.3rem" }} />
                Schedule Time
              </span>
              <input type="datetime-local" {...register("scheduleTime")} style={{ ...inp }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>
          </div>

          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "1rem 1.25rem",
            display: "flex", flexDirection: "column", gap: "1rem",
          }}>
            <Controller name="isActive" control={control} render={({ field }) => (
              <Toggle label="Active (published)" desc="Students can attempt this exam"
                checked={field.value} onChange={field.onChange} />
            )} />
            <div style={{ height: "1px", background: "var(--border)" }} />
            <Controller name="retakeAllowed" control={control} render={({ field }) => (
              <Toggle label="Allow retakes" desc="Students can attempt multiple times"
                checked={field.value} onChange={field.onChange} />
            )} />
          </div>

          {Object.keys(selected).length > 0 && (
            <div style={{
              background: "var(--accent-bg)", border: "1px solid var(--accent-dim)",
              borderRadius: "var(--radius)", padding: "0.875rem 1rem",
            }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--accent)" }}>
                {Object.keys(selected).length}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text2)" }}>
                questions · {totalMarks} marks total
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}