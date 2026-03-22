"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AdminEditExamPage() {
  const { id }     = useParams<{ id: string }>();
  const router     = useRouter();
  const { toast }  = useToast();

  const [form, setForm] = useState({
    examName: "", description: "", subjectId: "", gradeLevel: "",
    duration: "", totalMarks: "", passingMarks: "",
    scheduleTime: "", retakeAllowed: false, isActive: false,
  });
  const [questions,    setQuestions]    = useState<any[]>([]);
  const [search,       setSearch]       = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching,    setSearching]    = useState(false);

  const { data: exam, isLoading } = useQuery({
    queryKey: ["admin-exam-edit", id],
    queryFn: async () => {
      const res = await fetch(`/api/exams/${id}`);
      if (!res.ok) throw new Error("Failed to fetch exam");
      return res.json();
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetch("/api/subjects").then(r => r.json()),
  });

  // Pre-fill form when exam loads
  useEffect(() => {
    if (!exam) return;
    setForm({
      examName:     exam.examName     ?? "",
      description:  exam.description  ?? "",
      subjectId:    String(exam.subjectId ?? ""),
      gradeLevel:   exam.gradeLevel   ?? "",
      duration:     String(exam.duration ?? ""),
      totalMarks:   String(exam.totalMarks ?? ""),
      passingMarks: String(exam.passingMarks ?? ""),
      scheduleTime: exam.scheduleTime ? new Date(exam.scheduleTime).toISOString().slice(0,16) : "",
      retakeAllowed: exam.retakeAllowed ?? false,
      isActive:     exam.isActive     ?? false,
    });
    setQuestions(exam.examQuestions?.map((eq: any) => ({
      questionId: eq.questionId,
      marks:      eq.marks,
      question:   eq.question?.question ?? "",
      difficulty: eq.question?.difficulty ?? "medium",
    })) ?? []);
  }, [exam]);

  // Search questions
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res  = await fetch(`/api/questions?search=${encodeURIComponent(search)}&limit=10`);
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const addQuestion = (q: any) => {
    if (questions.find(x => x.questionId === q.id)) return;
    setQuestions(prev => [...prev, { questionId: q.id, marks: q.marks ?? 1, question: q.question, difficulty: q.difficulty }]);
    setSearch("");
    setSearchResults([]);
  };

  const removeQuestion = (questionId: number) => {
    setQuestions(prev => prev.filter(q => q.questionId !== questionId));
  };

  const updateMarks = (questionId: number, marks: number) => {
    setQuestions(prev => prev.map(q => q.questionId === questionId ? { ...q, marks } : q));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
      const res = await fetch(`/api/exams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examName:     form.examName,
          description:  form.description || null,
          subjectId:    parseInt(form.subjectId),
          gradeLevel:   form.gradeLevel  || null,
          duration:     parseInt(form.duration),
          totalMarks,
          passingMarks: form.passingMarks ? parseInt(form.passingMarks) : null,
          scheduleTime: form.scheduleTime ? new Date(form.scheduleTime) : null,
          retakeAllowed: form.retakeAllowed,
          isActive:     form.isActive,
          questions:    questions.map(q => ({ questionId: q.questionId, marks: q.marks })),
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to save"); }
      return res.json();
    },
    onSuccess: () => { toast({ title: "Exam updated!" }); router.push("/admin/exams"); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const inp: React.CSSProperties = {
    width: "100%", height: "2.25rem", padding: "0 0.75rem", borderRadius: "0.5rem",
    border: "1.5px solid var(--border)", background: "var(--input-bg)", color: "var(--text)",
    fontSize: "0.82rem", outline: "none", boxSizing: "border-box",
  };
  const sel: React.CSSProperties = { ...inp, appearance: "none" as any };

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const diffColor: Record<string, string> = { easy: "var(--green)", medium: "var(--amber)", hard: "var(--red)" };
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <Link href="/admin/exams">
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", display: "flex", padding: "0.25rem" }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>Edit Exam</h1>
            <p style={{ fontSize: "0.75rem", color: "var(--text3)", margin: 0 }}>#{id}</p>
          </div>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !form.examName || !form.subjectId || !form.duration}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1.25rem", borderRadius: "0.5rem", background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", opacity: saveMutation.isPending ? 0.7 : 1 }}
        >
          <Save size={15} /> {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.25rem", alignItems: "start" }}>

        {/* Left: Question picker */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Questions ({questions.length}) · {totalMarks} marks
              </span>
            </div>

            {/* Search */}
            <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)", position: "relative" }}>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search questions to add..."
                  style={{ ...inp, paddingLeft: "2.1rem" }}
                  onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={e => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
              {searchResults.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: "1.25rem", right: "1.25rem", zIndex: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", boxShadow: "var(--shadow)", maxHeight: "240px", overflowY: "auto" }}>
                  {searchResults.map((q: any) => (
                    <div key={q.id}
                      onClick={() => addQuestion(q)}
                      style={{ padding: "0.75rem 1rem", cursor: "pointer", borderBottom: "1px solid var(--border)", transition: "background 0.12s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <p style={{ fontSize: "0.8rem", color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.question}</p>
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.2rem" }}>
                        <span style={{ fontSize: "0.65rem", color: diffColor[q.difficulty] ?? "var(--text3)" }}>{q.difficulty}</span>
                        <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                        {q.subject?.name && <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>· {q.subject.name}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {searching && (
                <p style={{ fontSize: "0.72rem", color: "var(--text3)", marginTop: "0.4rem" }}>Searching...</p>
              )}
            </div>

            {/* Selected questions */}
            {questions.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text3)", fontSize: "0.82rem" }}>
                No questions yet. Search above to add.
              </div>
            ) : questions.map((q, idx) => (
              <div key={q.questionId} style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text3)", flexShrink: 0 }}>Q{idx + 1}</span>
                <p style={{ flex: 1, fontSize: "0.8rem", color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {q.question}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                  <input
                    type="number" min={1} max={100} value={q.marks}
                    onChange={e => updateMarks(q.questionId, parseInt(e.target.value) || 1)}
                    style={{ width: "3.5rem", height: "1.75rem", borderRadius: "0.375rem", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontSize: "0.78rem", textAlign: "center", outline: "none" }}
                  />
                  <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>pts</span>
                  <button onClick={() => removeQuestion(q.questionId)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: "0.2rem", borderRadius: "0.25rem" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Exam settings */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem", position: "sticky", top: "1.5rem" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Settings</span>

          {[
            { label: "Exam Name *",   key: "examName",    type: "text",   placeholder: "e.g. Biology Final" },
            { label: "Description",   key: "description", type: "text",   placeholder: "Optional" },
            { label: "Duration (min)*", key: "duration",  type: "number", placeholder: "60" },
            { label: "Passing Marks", key: "passingMarks",type: "number", placeholder: "Optional" },
            { label: "Schedule Time", key: "scheduleTime",type: "datetime-local" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text2)" }}>{label}</span>
              <input
                type={type} placeholder={placeholder}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={inp}
                onFocus={e => (e.target.style.borderColor = "var(--accent)")}
                onBlur={e => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          ))}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text2)" }}>Subject *</span>
            <select value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
              style={sel} onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")}>
              <option value="">Select subject</option>
              {subjects?.map((s: any) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text2)" }}>Grade Level</span>
            <select value={form.gradeLevel} onChange={e => setForm(f => ({ ...f, gradeLevel: e.target.value }))}
              style={sel} onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")}>
              <option value="">Any grade</option>
              {[6,7,8,9,10,11,12].map(g => <option key={g} value={String(g)}>Grade {g}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { key: "isActive",      label: "Publish (make active)" },
              { key: "retakeAllowed", label: "Allow retakes" },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8rem", color: "var(--text2)" }}>
                <div
                  onClick={() => setForm(f => ({ ...f, [key]: !(f as any)[key] }))}
                  style={{ width: "2.5rem", height: "1.35rem", borderRadius: "999px", background: (form as any)[key] ? "var(--accent)" : "var(--surface3)", border: `1.5px solid ${(form as any)[key] ? "var(--accent)" : "var(--border)"}`, position: "relative", transition: "all 0.2s", cursor: "pointer" }}
                >
                  <div style={{ width: "1rem", height: "1rem", borderRadius: "50%", background: "#fff", position: "absolute", top: "50%", transform: `translateX(${(form as any)[key] ? "1.2rem" : "0.1rem"}) translateY(-50%)`, transition: "transform 0.2s" }} />
                </div>
                {label}
              </label>
            ))}
          </div>

          <div style={{ paddingTop: "0.5rem", borderTop: "1px solid var(--border)", fontSize: "0.72rem", color: "var(--text3)" }}>
            Total marks: <strong style={{ color: "var(--text)" }}>{totalMarks}</strong> ({questions.length} questions)
          </div>
        </div>
      </div>
    </div>
  );
}