"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Search, Check } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  examName:      z.string().min(3, "Exam name is required"),
  gradeLevel:    z.string().min(1, "Grade is required"),
  subjectId:     z.string().min(1, "Subject is required"),
  scheduleTime:  z.string().optional(),
  duration:      z.coerce.number().min(5, "Minimum 5 minutes"),
  retakeAllowed: z.boolean().default(false),
  isActive:      z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export default function CreateExamPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading,          setLoading]         = useState(false);
  const [search,           setSearch]          = useState("");
  const [selected,         setSelected]        = useState<Record<number, number>>({});
  const [browseSubject,    setBrowseSubject]    = useState("");
  const [browseChapter,    setBrowseChapter]    = useState("");
  const [browseSubconcept, setBrowseSubconcept] = useState("");
  const [browseGrade,      setBrowseGrade]      = useState("");

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetch("/api/subjects").then((r) => r.json()),
  });

  const { data: chapters } = useQuery({
    queryKey: ["chapters", browseSubject],
    queryFn: () => fetch(`/api/chapters?subjectId=${browseSubject}`).then((r) => r.json()),
    enabled: !!browseSubject,
  });

  const { data: subconcepts } = useQuery({
    queryKey: ["subconcepts", browseChapter],
    queryFn: () => fetch(`/api/subconcepts?chapterId=${browseChapter}`).then((r) => r.json()),
    enabled: !!browseChapter,
  });

  const { data: questions, isLoading: qLoading } = useQuery({
    queryKey: ["qbrowser", browseGrade, browseSubject, browseChapter, browseSubconcept],
    queryFn: () => {
      const p = new URLSearchParams();
      if (browseGrade)      p.set("gradeLevel",  browseGrade);
      if (browseSubject)    p.set("subjectId",    browseSubject);
      if (browseChapter)    p.set("chapterId",    browseChapter);
      if (browseSubconcept) p.set("subconceptId", browseSubconcept);
      return fetch(`/api/questions?${p}`).then((r) => r.json());
    },
    enabled: !!browseSubject,
  });

  const {
    register, handleSubmit, control, watch, setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { duration: 60, retakeAllowed: false, isActive: true },
  });

  useEffect(() => {
    if (browseSubject) setValue("subjectId", browseSubject, { shouldValidate: true });
  }, [browseSubject, setValue]);

  useEffect(() => {
    if (browseGrade) setValue("gradeLevel", browseGrade, { shouldValidate: true });
  }, [browseGrade, setValue]);

  const isActive      = watch("isActive");
  const retakeAllowed = watch("retakeAllowed");

  const filteredQ     = (Array.isArray(questions) ? questions : []).filter((q: any) =>
    !search || q.question.toLowerCase().includes(search.toLowerCase())
  );
  const selectedCount = Object.keys(selected).length;
  const totalMarks    = Object.values(selected).reduce((s, m) => s + m, 0);

  const toggleQ = (id: number, defaultMarks: number) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id] !== undefined) delete next[id];
      else next[id] = defaultMarks || 1;
      return next;
    });
  };

  const onSubmit = async (data: FormData) => {
    if (selectedCount === 0) {
      toast({ title: "Select at least one question", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...data,
        questions: Object.entries(selected).map(([id, marks]) => ({
          questionId: parseInt(id),
          marks,
        })),
      };
      const res  = await fetch("/api/exams", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create exam");
      toast({ title: "Exam created successfully!" });
      router.push("/teacher/exams");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onInvalid = (errs: any) => {
    const msgs = Object.values(errs).map((e: any) => e.message).filter(Boolean);
    toast({ title: "Please fill required fields", description: msgs[0] ?? "Check the settings panel", variant: "destructive" });
  };

  const inp: React.CSSProperties = {
    width: "100%", height: "2.1rem", padding: "0 0.75rem",
    borderRadius: "0.5rem", background: "var(--input-bg)",
    border: "1.5px solid var(--border)", color: "var(--text)",
    fontSize: "0.82rem", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const diffColor: Record<string, { bg: string; color: string }> = {
    easy:   { bg: "var(--green-bg)", color: "var(--green)" },
    medium: { bg: "var(--amber-bg)", color: "var(--amber)" },
    hard:   { bg: "var(--red-bg)",   color: "var(--red)"   },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/teacher/exams">
            <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", display: "flex", padding: "0.25rem" }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>Create Exam</h1>
            <p style={{ fontSize: "0.78rem", color: "var(--text3)", margin: 0 }}>Select questions, then fill exam settings on the right</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit(onSubmit, onInvalid)}
          disabled={loading}
          style={{
            padding: "0.5rem 1.25rem", borderRadius: "0.5rem",
            background: loading ? "var(--accent-dim)" : "var(--accent)",
            border: "none", color: "#fff", fontWeight: 700,
            fontSize: "0.82rem", cursor: loading ? "not-allowed" : "pointer", flexShrink: 0,
          }}
        >
          {loading ? "Creating…" : `Create Exam${selectedCount > 0 ? ` (${selectedCount} Qs, ${totalMarks} pts)` : ""}`}
        </button>
      </div>

      {/* Validation error banner */}
      {Object.keys(errors).length > 0 && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "var(--red-bg)", border: "1px solid var(--red)", fontSize: "0.78rem", color: "var(--red)" }}>
          {Object.values(errors).map((e: any, i) => <div key={i}>· {e.message}</div>)}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.25rem", alignItems: "start" }}>

        {/* ════ LEFT: question browser ════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Filters */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem 1.25rem" }}>
            <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              Filter Question Bank
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.6rem" }}>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text2)" }}>Grade</span>
                <select value={browseGrade} onChange={(e) => setBrowseGrade(e.target.value)} style={{ ...inp, appearance: "none" as any }}>
                  <option value="">Any grade</option>
                  {[6,7,8,9,10,11,12].map((g) => <option key={g} value={String(g)}>Grade {g}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text2)" }}>Subject</span>
                <select value={browseSubject} onChange={(e) => { setBrowseSubject(e.target.value); setBrowseChapter(""); setBrowseSubconcept(""); }} style={{ ...inp, appearance: "none" as any }}>
                  <option value="">Select subject</option>
                  {(subjects ?? []).map((s: any) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text2)" }}>Chapter</span>
                <select value={browseChapter} onChange={(e) => { setBrowseChapter(e.target.value); setBrowseSubconcept(""); }} disabled={!browseSubject} style={{ ...inp, appearance: "none" as any, opacity: !browseSubject ? 0.5 : 1 }}>
                  <option value="">All chapters</option>
                  {(chapters ?? []).map((c: any) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--text2)" }}>Subconcept</span>
                <select value={browseSubconcept} onChange={(e) => setBrowseSubconcept(e.target.value)} disabled={!browseChapter} style={{ ...inp, appearance: "none" as any, opacity: !browseChapter ? 0.5 : 1 }}>
                  <option value="">All</option>
                  {(subconcepts ?? []).map((sc: any) => <option key={sc.id} value={String(sc.id)}>{sc.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Question list */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text2)" }}>
                {qLoading ? "Loading…" : `${filteredQ.length} question${filteredQ.length !== 1 ? "s" : ""}`}
                {selectedCount > 0 && <span style={{ color: "var(--accent)", marginLeft: "0.5rem" }}>· {selectedCount} selected</span>}
              </span>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ ...inp, paddingLeft: "1.85rem", width: "200px" }} />
              </div>
            </div>

            <div style={{ maxHeight: "500px", overflowY: "auto" }}>
              {!browseSubject ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)", fontSize: "0.85rem" }}>
                  Select a subject above to browse questions
                </div>
              ) : qLoading ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>Loading…</div>
              ) : filteredQ.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>No questions found</div>
              ) : filteredQ.map((q: any) => {
                const isSel = selected[q.id] !== undefined;
                const dc    = diffColor[q.difficulty] ?? { bg: "var(--surface2)", color: "var(--text3)" };
                return (
                  <div
                    key={q.id}
                    onClick={() => toggleQ(q.id, q.marks)}
                    style={{
                      padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)",
                      background: isSel ? "var(--accent-bg)" : "transparent",
                      cursor: "pointer", display: "flex", alignItems: "flex-start", gap: "0.875rem",
                    }}
                  >
                    <div style={{
                      flexShrink: 0, marginTop: "0.2rem",
                      width: "1.2rem", height: "1.2rem", borderRadius: "0.3rem",
                      border: `2px solid ${isSel ? "var(--accent)" : "var(--border2)"}`,
                      background: isSel ? "var(--accent)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isSel && <Check size={9} color="#fff" strokeWidth={3} />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.82rem", color: "var(--text)", margin: 0, lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {q.question}
                      </p>
                      <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.3rem", alignItems: "center" }}>
                        <span style={{ fontSize: "0.63rem", padding: "0.1rem 0.4rem", borderRadius: "999px", background: dc.bg, color: dc.color, textTransform: "capitalize" }}>{q.difficulty}</span>
                        {q.subject?.name && <span style={{ fontSize: "0.63rem", color: "var(--text3)" }}>{q.subject.name}</span>}
                        {q.chapter?.name && <span style={{ fontSize: "0.63rem", color: "var(--text3)" }}>· {q.chapter.name}</span>}
                        <span style={{ fontSize: "0.63rem", color: "var(--text3)" }}>· {q.marks} pt{q.marks !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {isSel && (
                      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "0.3rem" }} onClick={(e) => e.stopPropagation()}>
                        <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>pts</span>
                        <input
                          type="number" min={1} max={20}
                          value={selected[q.id]}
                          onChange={(e) => setSelected((prev) => ({ ...prev, [q.id]: parseInt(e.target.value) || 1 }))}
                          style={{ ...inp, width: "3rem", textAlign: "center", padding: "0 0.25rem", height: "1.75rem" }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ════ RIGHT: exam settings ════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", position: "sticky", top: "1.5rem" }}>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Exam Settings</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>Exam Name *</span>
              <input {...register("examName")} placeholder="e.g. Chapter 3 Mid-term"
                style={{ ...inp, borderColor: errors.examName ? "var(--red)" : "var(--border)" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = errors.examName ? "var(--red)" : "var(--border)")} />
              {errors.examName && <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>{errors.examName.message}</span>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>Grade Level *</span>
              <Controller name="gradeLevel" control={control} render={({ field }) => (
                <select {...field} style={{ ...inp, appearance: "none" as any, borderColor: errors.gradeLevel ? "var(--red)" : "var(--border)" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = errors.gradeLevel ? "var(--red)" : "var(--border)")}>
                  <option value="">Select grade</option>
                  {[6,7,8,9,10,11,12].map((g) => <option key={g} value={String(g)}>Grade {g}</option>)}
                </select>
              )} />
              {errors.gradeLevel && <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>{errors.gradeLevel.message}</span>}
              {browseGrade && <span style={{ fontSize: "0.65rem", color: "var(--green)" }}>✓ Auto-filled from filter</span>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>Subject *</span>
              <Controller name="subjectId" control={control} render={({ field }) => (
                <select {...field} style={{ ...inp, appearance: "none" as any, borderColor: errors.subjectId ? "var(--red)" : "var(--border)" }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = errors.subjectId ? "var(--red)" : "var(--border)")}>
                  <option value="">Select subject</option>
                  {(subjects ?? []).map((s: any) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                </select>
              )} />
              {errors.subjectId && <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>{errors.subjectId.message}</span>}
              {browseSubject && <span style={{ fontSize: "0.65rem", color: "var(--green)" }}>✓ Auto-filled from filter</span>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>Duration (minutes) *</span>
              <input type="number" min={5} {...register("duration")}
                style={{ ...inp, borderColor: errors.duration ? "var(--red)" : "var(--border)" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = errors.duration ? "var(--red)" : "var(--border)")} />
              {errors.duration && <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>{errors.duration.message}</span>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>
                Schedule Time <span style={{ fontWeight: 400, color: "var(--text3)" }}>(optional)</span>
              </span>
              <input type="datetime-local" {...register("scheduleTime")} style={inp}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            </div>
          </div>

          {/* Toggles */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { label: "Publish immediately", desc: "Students can attempt right away",   key: "isActive" as const, val: isActive },
              { label: "Allow retakes",       desc: "Students can attempt more than once", key: "retakeAllowed" as const, val: retakeAllowed },
            ].map(({ label, desc, key, val }, i) => (
              <div key={key}>
                {i > 0 && <div style={{ height: "1px", background: "var(--border)", marginBottom: "1rem" }} />}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>{label}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text3)", marginTop: "0.1rem" }}>{desc}</div>
                  </div>
                  <div onClick={() => setValue(key, !val)} style={{
                    width: "2.5rem", height: "1.35rem", borderRadius: "999px", flexShrink: 0,
                    background: val ? "var(--accent)" : "var(--surface3)",
                    border: `1.5px solid ${val ? "var(--accent)" : "var(--border)"}`,
                    position: "relative", cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <div style={{
                      width: "1rem", height: "1rem", borderRadius: "50%", background: "#fff",
                      position: "absolute", top: "50%",
                      transform: `translateX(${val ? "1.2rem" : "0.1rem"}) translateY(-50%)`,
                      transition: "transform 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {selectedCount > 0 && (
            <div style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-dim)", borderRadius: "var(--radius)", padding: "0.875rem 1rem" }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--accent)", margin: "0 0 0.3rem" }}>Selected</p>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--accent)", lineHeight: 1 }}>{selectedCount}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text2)", marginTop: "0.2rem" }}>
                question{selectedCount !== 1 ? "s" : ""} · {totalMarks} marks total
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}