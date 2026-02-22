"use client";

// Teacher's question creation page — uses the same rich question creator
// as the question setter, but lives under /teacher/questions/create
// so it's accessible from the teacher sidebar.

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Plus, Trash2, ImageIcon, FunctionSquare,
  X, CheckCircle2, Upload, Eye, EyeOff, AlignLeft, FileText,
} from "lucide-react";
import Link from "next/link";

// ─── LaTeX snippets ────────────────────────────────────────────────────────────
const SNIPPETS = [
  { label: "a/b", val: "\\frac{a}{b}" }, { label: "√x", val: "\\sqrt{x}" },
  { label: "xⁿ",  val: "x^{n}" },        { label: "xₙ", val: "x_{n}" },
  { label: "Σ",   val: "\\sum_{i=1}^{n}" }, { label: "∫", val: "\\int_{a}^{b}" },
  { label: "α",   val: "\\alpha" },       { label: "β",  val: "\\beta" },
  { label: "π",   val: "\\pi" },          { label: "∞",  val: "\\infty" },
  { label: "±",   val: "\\pm" },          { label: "≤",  val: "\\leq" },
];

// ─── Image drop ────────────────────────────────────────────────────────────────
function ImgDrop({ value, onChange, label = "Add image", compact = false }:
  { value: File | null; onChange: (f: File | null) => void; label?: string; compact?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const handle = (file: File) => {
    onChange(file);
    const r = new FileReader(); r.onload = e => setPreview(e.target?.result as string); r.readAsDataURL(file);
  };
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) handle(f);
  }, []);
  return (
    <div onDrop={onDrop} onDragOver={e => e.preventDefault()} onClick={() => ref.current?.click()}
      style={{ cursor: "pointer", border: "2px dashed var(--border2)", background: "var(--surface2)", borderRadius: "0.5rem", transition: "border-color 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border2)")}>
      {preview ? (
        <div style={{ position: "relative", padding: "0.5rem" }}>
          <img src={preview} alt="preview" style={{ maxHeight: "9rem", margin: "0 auto", display: "block", borderRadius: "0.375rem", objectFit: "contain" }} />
          <button type="button" onClick={e => { e.stopPropagation(); onChange(null); setPreview(null); }}
            style={{ position: "absolute", top: "0.25rem", right: "0.25rem", background: "var(--red)", color: "#fff", border: "none", borderRadius: "50%", width: "1.2rem", height: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={10} />
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", padding: compact ? "0.75rem" : "1.25rem" }}>
          <Upload size={16} style={{ color: "var(--text3)" }} />
          <span style={{ fontSize: "0.72rem", color: "var(--text2)" }}>{label}</span>
          {!compact && <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>drag & drop or click</span>}
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }} />
    </div>
  );
}

// ─── Rich text / LaTeX field ──────────────────────────────────────────────────
function RichField({ value, onChange, placeholder, multiline = false, label }:
  { value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; label?: string }) {
  const [mode, setMode] = useState<"text" | "latex">("text");
  const [preview, setPreview] = useState(false);
  const baseStyle: React.CSSProperties = {
    background: "var(--input-bg)", border: "1.5px solid var(--border)", color: "var(--text)",
    fontFamily: "monospace", fontSize: "0.85rem", borderRadius: "0.5rem",
    width: "100%", padding: "0.5rem 0.75rem", outline: "none", boxSizing: "border-box",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {label && <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>{label}</span>}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{ display: "flex", borderRadius: "0.375rem", overflow: "hidden", border: "1px solid var(--border)", fontSize: "0.68rem" }}>
          {(["text", "latex"] as const).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)} style={{
              padding: "0.28rem 0.6rem", background: mode === m ? "var(--accent)" : "var(--surface2)",
              color: mode === m ? "#fff" : "var(--text2)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.25rem",
            }}>
              {m === "text" ? <AlignLeft size={10} /> : <FunctionSquare size={10} />}
              {m === "text" ? "Text" : "LaTeX"}
            </button>
          ))}
        </div>
        {mode === "latex" && value && (
          <button type="button" onClick={() => setPreview(v => !v)} style={{
            fontSize: "0.68rem", color: "var(--text2)", background: "none", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem",
          }}>
            {preview ? <EyeOff size={10} /> : <Eye size={10} />} {preview ? "Hide" : "Preview"}
          </button>
        )}
      </div>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)}
          placeholder={mode === "latex" ? "e.g. Solve $\\frac{d}{dx}[x^n]$" : placeholder}
          rows={4} style={{ ...baseStyle, resize: "vertical" }}
          onFocus={e => e.target.style.borderColor = "var(--accent)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"} />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)}
          placeholder={mode === "latex" ? "e.g. $E = mc^2$" : placeholder}
          style={{ ...baseStyle, height: "2.1rem" }}
          onFocus={e => e.target.style.borderColor = "var(--accent)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"} />
      )}
      {mode === "latex" && preview && value && (
        <div style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "var(--surface2)", border: "1px solid var(--border)", fontFamily: "monospace", fontSize: "0.82rem", color: "var(--accent)" }}>
          <span style={{ fontSize: "0.62rem", color: "var(--text3)", marginRight: "0.5rem" }}>preview →</span>{value}
        </div>
      )}
      {mode === "latex" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
          {SNIPPETS.map(s => (
            <button key={s.label} type="button" onClick={() => onChange(value + `$${s.val}$`)} style={{
              fontSize: "0.62rem", padding: "0.18rem 0.45rem", borderRadius: "0.25rem",
              fontFamily: "monospace", background: "var(--surface2)", border: "1px solid var(--border2)",
              color: "var(--accent)", cursor: "pointer",
            }}>{s.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  subjectId:       z.string().min(1, "Subject required"),
  chapterId:       z.string().min(1, "Chapter required"),
  subconceptId:    z.string().optional(),
  gradeLevel:      z.string().min(1, "Grade required"),
  question:        z.string().min(5, "Question required"),
  difficulty:      z.enum(["easy", "medium", "hard"]).default("medium"),
  marks:           z.coerce.number().min(1).default(1),
  isMultipleAnswer: z.boolean().default(false),
  options: z.array(z.object({ text: z.string().min(1), isCorrect: z.boolean().default(false) })).min(2),
  solutionType:    z.enum(["none", "text", "image"]).default("none"),
  solutionText:    z.string().optional(),
});
type FormData = z.infer<typeof schema>;

// ─── Shared card ───────────────────────────────────────────────────────────────
function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.875rem", overflow: "hidden" }}>
      {title && (
        <div style={{ padding: "0.7rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text2)" }}>
            {title}
          </span>
        </div>
      )}
      <div style={{ padding: "1.1rem 1.25rem" }}>{children}</div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function TeacherCreateQuestionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selSubject, setSelSubject] = useState("");
  const [selChapter, setSelChapter] = useState("");
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [solutionImage, setSolutionImage] = useState<File | null>(null);
  const [optionImages, setOptionImages] = useState<(File | null)[]>([null, null, null, null]);

  const { data: subjects }    = useQuery({ queryKey: ["subjects"],               queryFn: () => fetch("/api/subjects").then(r => r.json()) });
  const { data: chapters }    = useQuery({ queryKey: ["chapters", selSubject],    queryFn: () => fetch(`/api/chapters?subjectId=${selSubject}`).then(r => r.json()), enabled: !!selSubject });
  const { data: subconcepts } = useQuery({ queryKey: ["subconcepts", selChapter], queryFn: () => fetch(`/api/subconcepts?chapterId=${selChapter}`).then(r => r.json()), enabled: !!selChapter });

  const { handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { marks: 1, difficulty: "medium", isMultipleAnswer: false, solutionType: "none", solutionText: "",
      options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const isMultiple   = watch("isMultipleAnswer");
  const solutionType = watch("solutionType");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("subjectId", data.subjectId); fd.append("chapterId", data.chapterId);
      if (data.subconceptId) fd.append("subconceptId", data.subconceptId);
      fd.append("gradeLevel", data.gradeLevel); fd.append("question", data.question);
      fd.append("difficulty", data.difficulty); fd.append("marks", String(data.marks));
      fd.append("isMultipleAnswer", String(data.isMultipleAnswer));
      fd.append("options", JSON.stringify(data.options.map(o => ({ text: o.text, isCorrect: o.isCorrect }))));
      fd.append("solutionType", data.solutionType);
      if (data.solutionType === "text" && data.solutionText) fd.append("solutionText", data.solutionText);
      if (questionImage) fd.append("questionImage", questionImage);
      if (data.solutionType === "image" && solutionImage) fd.append("solutionImage", solutionImage);
      optionImages.forEach((img, i) => { if (img) fd.append(`optionImage_${i}`, img); });

      const res = await fetch("/api/questions", { method: "POST", body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast({ title: "Question saved!", description: "Added to the question bank." });
      router.push("/teacher/exams");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const diffStyle = {
    easy:   { border: "var(--green)",  bg: "var(--green-bg)",  text: "var(--green)"  },
    medium: { border: "var(--amber)",  bg: "var(--amber-bg)",  text: "var(--amber)"  },
    hard:   { border: "var(--red)",    bg: "var(--red-bg)",    text: "var(--red)"    },
  };

  const selStyle: React.CSSProperties = { background: "var(--input-bg)", border: "1.5px solid var(--border)", color: "var(--text)", borderRadius: "0.5rem", height: "2.1rem", padding: "0 0.6rem", fontSize: "0.8rem", outline: "none", appearance: "none", width: "100%" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/teacher/exams">
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", display: "flex" }}><ArrowLeft size={18} /></button>
          </Link>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>Add Question</h1>
            <p style={{ fontSize: "0.78rem", color: "var(--text3)", margin: 0 }}>Creates a question in the shared question bank</p>
          </div>
        </div>
        <button onClick={handleSubmit(onSubmit)} disabled={loading} style={{
          padding: "0.5rem 1.25rem", borderRadius: "0.5rem",
          background: loading ? "var(--accent-dim)" : "var(--accent)",
          border: "none", color: "#fff", fontWeight: 700, fontSize: "0.82rem",
          cursor: loading ? "not-allowed" : "pointer",
        }}>
          {loading ? "Saving…" : "Save Question"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 272px", gap: "1.1rem" }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Question */}
          <Card title="Question">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <Controller name="question" control={control} render={({ field }) => (
                <RichField value={field.value ?? ""} onChange={field.onChange} placeholder="Type your question here…" multiline />
              )} />
              {errors.question && <span style={{ fontSize: "0.72rem", color: "var(--red)" }}>{errors.question.message}</span>}
              <div>
                <p style={{ fontSize: "0.7rem", color: "var(--text3)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <ImageIcon size={11} /> Question image (optional)
                </p>
                <ImgDrop value={questionImage} onChange={setQuestionImage} label="Attach image to question" />
              </div>
            </div>
          </Card>

          {/* Options */}
          <Card title="Answer Options">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Controller name="isMultipleAnswer" control={control} render={({ field }) => (
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "0.75rem", color: "var(--text2)" }}>
                    <input type="checkbox" checked={field.value} onChange={e => field.onChange(e.target.checked)} />
                    Multiple correct answers (MSQ)
                  </label>
                )} />
              </div>

              {fields.map((field, index) => {
                const letter = String.fromCharCode(65 + index);
                const [showImg, setShowImg] = useState(false);
                return (
                  <div key={field.id} style={{ border: "1px solid var(--border)", borderRadius: "0.625rem", padding: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem" }}>
                      <Controller name={`options.${index}.isCorrect`} control={control} render={({ field: f }) => (
                        <button type="button" onClick={() => {
                          if (!isMultiple) fields.forEach((_, i) => { if (i !== index) setValue(`options.${i}.isCorrect`, false); });
                          f.onChange(!f.value);
                        }} style={{
                          flexShrink: 0, marginTop: "0.2rem", width: "1.5rem", height: "1.5rem",
                          borderRadius: "50%", border: `2px solid ${f.value ? "var(--green)" : "var(--border2)"}`,
                          background: f.value ? "var(--green-bg)" : "transparent",
                          color: f.value ? "var(--green)" : "var(--text3)",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.7rem", fontWeight: 700, transition: "all 0.12s",
                        }}>
                          {f.value ? <CheckCircle2 size={13} /> : letter}
                        </button>
                      )} />
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <Controller name={`options.${index}.text`} control={control} render={({ field: f }) => (
                          <RichField value={f.value ?? ""} onChange={f.onChange} placeholder={`Option ${letter}`} />
                        )} />
                        <button type="button" onClick={() => setShowImg(v => !v)} style={{
                          background: "none", border: "none", cursor: "pointer", fontSize: "0.68rem",
                          color: "var(--text3)", display: "flex", alignItems: "center", gap: "0.25rem", padding: 0,
                        }}>
                          <ImageIcon size={10} /> {showImg ? "Remove image" : "Add image"}
                        </button>
                        {showImg && <ImgDrop value={optionImages[index]} compact
                          onChange={f => { const n = [...optionImages]; n[index] = f; setOptionImages(n); }}
                          label={`Image for ${letter}`} />}
                      </div>
                      {fields.length > 2 && (
                        <button type="button" onClick={() => remove(index)} style={{
                          flexShrink: 0, background: "none", border: "none", cursor: "pointer",
                          color: "var(--text3)", padding: "0.15rem",
                        }} onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <button type="button"
                onClick={() => { append({ text: "", isCorrect: false }); setOptionImages(p => [...p, null]); }}
                style={{
                  width: "100%", padding: "0.55rem", border: "1.5px dashed var(--border2)",
                  borderRadius: "0.625rem", background: "none", color: "var(--text3)",
                  cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "0.4rem",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text3)"; }}>
                <Plus size={13} /> Add option
              </button>
            </div>
          </Card>

          {/* Solution */}
          <Card title="Solution / Explanation">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <Controller name="solutionType" control={control} render={({ field }) => (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {(["none", "text", "image"] as const).map(opt => (
                    <button key={opt} type="button" onClick={() => field.onChange(opt)} style={{
                      padding: "0.38rem 0.85rem", borderRadius: "0.4rem", fontSize: "0.75rem", fontWeight: 600,
                      border: `1.5px solid ${field.value === opt ? "var(--accent)" : "var(--border)"}`,
                      background: field.value === opt ? "var(--accent-bg)" : "var(--surface2)",
                      color: field.value === opt ? "var(--accent)" : "var(--text2)", cursor: "pointer",
                    }}>
                      {opt === "none" ? "None" : opt === "text" ? "Write Solution" : "Image"}
                    </button>
                  ))}
                </div>
              )} />
              {solutionType === "text" && (
                <Controller name="solutionText" control={control} render={({ field }) => (
                  <RichField value={field.value ?? ""} onChange={field.onChange}
                    placeholder="Write the step-by-step solution…" multiline label="Solution" />
                )} />
              )}
              {solutionType === "image" && (
                <ImgDrop value={solutionImage} onChange={setSolutionImage} label="Upload solution image (handwritten/diagram)" />
              )}
            </div>
          </Card>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", position: "sticky", top: "1.5rem" }}>
          <Card title="Classification">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { label: "Grade Level", name: "gradeLevel", options: [6,7,8,9,10,11,12].map(g => ({ value: String(g), label: `Grade ${g}` })), err: errors.gradeLevel, onChange: undefined },
              ].map(({ label, name, options, err }) => (
                <div key={name} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text2)" }}>{label}</span>
                  <Controller name={name as any} control={control} render={({ field }) => (
                    <select value={field.value} onChange={e => field.onChange(e.target.value)} style={selStyle}>
                      <option value="">Select {label.toLowerCase()}</option>
                      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )} />
                  {err && <span style={{ fontSize: "0.68rem", color: "var(--red)" }}>{err.message}</span>}
                </div>
              ))}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text2)" }}>Subject</span>
                <Controller name="subjectId" control={control} render={({ field }) => (
                  <select value={field.value} onChange={e => { field.onChange(e.target.value); setSelSubject(e.target.value); setSelChapter(""); setValue("chapterId", ""); }} style={selStyle}>
                    <option value="">Select subject</option>
                    {subjects?.map((s: any) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                  </select>
                )} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text2)" }}>Chapter</span>
                <Controller name="chapterId" control={control} render={({ field }) => (
                  <select value={field.value} onChange={e => { field.onChange(e.target.value); setSelChapter(e.target.value); setValue("subconceptId", ""); }} style={{ ...selStyle, opacity: !selSubject ? 0.5 : 1 }} disabled={!selSubject}>
                    <option value="">Select chapter</option>
                    {chapters?.map((c: any) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                  </select>
                )} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text2)" }}>Subconcept <span style={{ color: "var(--text3)", fontWeight: 400 }}>(optional)</span></span>
                <Controller name="subconceptId" control={control} render={({ field }) => (
                  <select value={field.value} onChange={e => field.onChange(e.target.value)} style={{ ...selStyle, opacity: (!selChapter || !subconcepts?.length) ? 0.5 : 1 }} disabled={!selChapter || !subconcepts?.length}>
                    <option value="">Select subconcept</option>
                    {subconcepts?.map((sc: any) => <option key={sc.id} value={String(sc.id)}>{sc.name}</option>)}
                  </select>
                )} />
              </div>
            </div>
          </Card>

          <Card title="Grading">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text2)" }}>Difficulty</span>
                <Controller name="difficulty" control={control} render={({ field }) => (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.35rem" }}>
                    {(["easy", "medium", "hard"] as const).map(d => {
                      const dc = diffStyle[d]; const active = field.value === d;
                      return (
                        <button key={d} type="button" onClick={() => field.onChange(d)} style={{
                          padding: "0.38rem", borderRadius: "0.4rem", fontSize: "0.7rem", fontWeight: active ? 700 : 500,
                          textTransform: "capitalize", border: `1.5px solid ${active ? dc.border : "var(--border)"}`,
                          background: active ? dc.bg : "var(--surface2)", color: active ? dc.text : "var(--text3)", cursor: "pointer",
                        }}>{d}</button>
                      );
                    })}
                  </div>
                )} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text2)" }}>Marks</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Controller name="marks" control={control} render={({ field }) => (
                    <input type="number" min={1} max={20} value={field.value}
                      onChange={e => field.onChange(Number(e.target.value))} style={{ ...selStyle }}
                      onFocus={e => e.target.style.borderColor = "var(--accent)"}
                      onBlur={e => e.target.style.borderColor = "var(--border)"} />
                  )} />
                  <span style={{ fontSize: "0.72rem", color: "var(--text3)", flexShrink: 0 }}>pts</span>
                </div>
              </div>
            </div>
          </Card>

          <div style={{ padding: "0.875rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--surface2)" }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text2)", marginBottom: "0.5rem" }}>Tips</p>
            {["Switch to LaTeX for math", "Click circle to mark correct answer(s)", "Each option can have its own image", "Enable MSQ for multiple correct answers"].map(t => (
              <p key={t} style={{ fontSize: "0.68rem", color: "var(--text3)", marginBottom: "0.25rem" }}>· {t}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}