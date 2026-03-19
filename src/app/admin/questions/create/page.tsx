"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft, Plus, Trash2, ImageIcon,
  FunctionSquare, X, CheckCircle2, Upload,
  Eye, EyeOff, AlignLeft, HelpCircle,
  AlertCircle, Save
} from "lucide-react";
import Link from "next/link";

// ─── KaTeX renderer ───────────────────────────────────────────────────────────
function KaTeXDisplay({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !text) return;
    import("katex").then((katex) => {
      // Render display math $$...$$ first, then inline $...$
      let html = text
        .replace(/\$\$(.+?)\$\$/gs, (_, expr) => {
          try {
            return katex.default.renderToString(expr, { displayMode: true, throwOnError: false });
          } catch { return _; }
        })
        .replace(/\$(.+?)\$/g, (_, expr) => {
          try {
            return katex.default.renderToString(expr, { displayMode: false, throwOnError: false });
          } catch { return _; }
        });
      if (ref.current) ref.current.innerHTML = html;
    });
  }, [text]);

  return (
    <div
      ref={ref}
      style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "var(--text)" }}
    />
  );
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  subjectId:        z.string().min(1, "Subject is required"),
  chapterId:        z.string().optional(),
  subconceptId:     z.string().optional(),
  gradeLevel:       z.string().optional(),
  question:         z.string().min(5, "Question must be at least 5 characters"),
  difficulty:       z.enum(["easy", "medium", "hard"]).default("medium"),
  marks:            z.coerce.number().min(1).max(100).default(1),
  isMultipleAnswer: z.boolean().default(false),
  options: z.array(z.object({
    text:      z.string().min(1, "Option text is required"),
    isCorrect: z.boolean().default(false),
  })).min(2, "At least 2 options required"),
  solutionType: z.enum(["none", "text", "image"]).default("none"),
  solutionText: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

// ─── LaTeX snippets ───────────────────────────────────────────────────────────
const SNIPPETS = [
  { label: "a/b",  val: "\\frac{a}{b}" },
  { label: "\u221ax",   val: "\\sqrt{x}" },
  { label: "x\u207f",   val: "x^{n}" },
  { label: "x\u2099",   val: "x_{n}" },
  { label: "\u03a3",    val: "\\sum_{i=1}^{n}" },
  { label: "\u222b",    val: "\\int_{a}^{b}" },
  { label: "lim",  val: "\\lim_{x \\to \\infty}" },
  { label: "\u03b1",    val: "\\alpha" },
  { label: "\u03b2",    val: "\\beta" },
  { label: "\u03c0",    val: "\\pi" },
  { label: "\u221e",    val: "\\infty" },
  { label: "\u00b1",    val: "\\pm" },
  { label: "\u2264",    val: "\\leq" },
  { label: "\u2265",    val: "\\geq" },
  { label: "\u2192",    val: "\\to" },
];

// ─── Image dropzone ───────────────────────────────────────────────────────────
function ImgDrop({ value, onChange, label = "Add image", compact = false }: {
  value: File | null; onChange: (f: File | null) => void; label?: string; compact?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const handle = (file: File) => {
    onChange(file);
    const r = new FileReader();
    r.onload = (e) => setPreview(e.target?.result as string);
    r.readAsDataURL(file);
  };
  return (
    <div
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) handle(f); }}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => ref.current?.click()}
      style={{ cursor: "pointer", borderRadius: "0.5rem", border: "2px dashed var(--border2)", background: "var(--surface2)", transition: "border-color 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border2)")}
    >
      {preview ? (
        <div style={{ position: "relative", padding: "0.5rem" }}>
          <img src={preview} alt="preview" style={{ maxHeight: "9rem", margin: "0 auto", display: "block", borderRadius: "0.375rem", objectFit: "contain" }} />
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); setPreview(null); }}
            style={{ position: "absolute", top: "0.25rem", right: "0.25rem", background: "var(--red)", color: "#fff", border: "none", borderRadius: "50%", width: "1.25rem", height: "1.25rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={10} />
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", padding: compact ? "0.65rem" : "1.25rem" }}>
          <Upload size={16} style={{ color: "var(--text3)" }} />
          <span style={{ fontSize: "0.72rem", color: "var(--text2)" }}>{label}</span>
          {!compact && <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>drag & drop or click</span>}
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }} />
    </div>
  );
}

// ─── Rich text / LaTeX field with REAL KaTeX preview ─────────────────────────
function RichField({ value, onChange, placeholder, multiline = false, label }: {
  value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; label?: string;
}) {
  const [mode, setMode] = useState<"text" | "latex">("text");
  const [showPreview, setShowPreview] = useState(false);
  const insert = (s: string) => onChange(value + `$${s}$`);

  const base: React.CSSProperties = {
    background: "var(--input-bg)", border: "1.5px solid var(--border)",
    color: "var(--text)", fontFamily: "monospace", fontSize: "0.85rem",
    borderRadius: "0.5rem", width: "100%", padding: "0.5rem 0.75rem",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {label && <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>{label}</span>}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{ display: "flex", borderRadius: "0.375rem", overflow: "hidden", border: "1px solid var(--border)", fontSize: "0.68rem" }}>
          {(["text", "latex"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} style={{
              padding: "0.28rem 0.6rem",
              background: mode === m ? "var(--accent)" : "var(--surface2)",
              color: mode === m ? "#fff" : "var(--text2)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.25rem",
            }}>
              {m === "text" ? <AlignLeft size={10} /> : <FunctionSquare size={10} />}
              {m === "text" ? "Text" : "LaTeX"}
            </button>
          ))}
        </div>
        {mode === "latex" && value && (
          <button type="button" onClick={() => setShowPreview((v) => !v)} style={{
            fontSize: "0.68rem", color: "var(--text2)", background: "none",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem",
          }}>
            {showPreview ? <EyeOff size={10} /> : <Eye size={10} />}
            {showPreview ? "Hide" : "Preview"}
          </button>
        )}
      </div>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={mode === "latex" ? "e.g. Solve $\\frac{d}{dx}[x^n]$" : placeholder}
          rows={4} style={{ ...base, resize: "vertical" as any, lineHeight: 1.6 }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={mode === "latex" ? "e.g. $E = mc^2$" : placeholder}
          style={{ ...base, height: "2.1rem" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
      )}
      {/* ✅ Real KaTeX preview */}
      {mode === "latex" && showPreview && value && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "var(--surface2)", border: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.62rem", color: "var(--text3)", display: "block", marginBottom: "0.4rem" }}>KaTeX preview</span>
          <KaTeXDisplay text={value} />
        </div>
      )}
      {mode === "latex" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
          {SNIPPETS.map((s) => (
            <button key={s.label} type="button" onClick={() => insert(s.val)} style={{
              fontSize: "0.62rem", padding: "0.18rem 0.45rem", borderRadius: "0.25rem",
              fontFamily: "monospace", background: "var(--surface2)",
              border: "1px solid var(--border2)", color: "var(--accent)", cursor: "pointer",
            }}>{s.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
      {title && (
        <div style={{ padding: "0.7rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text2)" }}>{title}</span>
        </div>
      )}
      <div style={{ padding: "1.1rem 1.25rem" }}>{children}</div>
    </div>
  );
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>
      {children}
      {optional && <span style={{ fontWeight: 400, color: "var(--text3)", marginLeft: "0.3rem" }}>(optional)</span>}
    </span>
  );
}

const selBase: React.CSSProperties = {
  width: "100%", height: "2.1rem", padding: "0 0.7rem",
  borderRadius: "0.5rem", background: "var(--input-bg)",
  border: "1.5px solid var(--border)", color: "var(--text)",
  fontSize: "0.8rem", outline: "none", appearance: "none" as any,
  boxSizing: "border-box", transition: "border-color 0.15s",
};
const inpBase: React.CSSProperties = { ...selBase, appearance: undefined };

function OptionRow({ index, fieldId, control, errors, isMultiple, fields, setValue, optionImages, setOptionImages, onRemove, canRemove }: {
  index: number; fieldId: string; control: any; errors: any; isMultiple: boolean; fields: any[];
  setValue: any; optionImages: (File | null)[]; setOptionImages: React.Dispatch<React.SetStateAction<(File | null)[]>>;
  onRemove: () => void; canRemove: boolean;
}) {
  const [showImg, setShowImg] = useState(false);
  const letter = String.fromCharCode(65 + index);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "0.625rem", overflow: "hidden" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border2)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", padding: "0.75rem" }}>
        <Controller name={`options.${index}.isCorrect`} control={control} render={({ field: f }) => (
          <button type="button"
            onClick={() => {
              if (!isMultiple) fields.forEach((_, i) => { if (i !== index) setValue(`options.${i}.isCorrect`, false); });
              f.onChange(!f.value);
            }}
            style={{
              flexShrink: 0, marginTop: "0.2rem", width: "1.55rem", height: "1.55rem", borderRadius: "50%",
              border: `2px solid ${f.value ? "var(--green)" : "var(--border2)"}`,
              background: f.value ? "var(--green-bg)" : "transparent",
              color: f.value ? "var(--green)" : "var(--text3)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.7rem", fontWeight: 700, transition: "all 0.12s",
            }}>
            {f.value ? <CheckCircle2 size={13} /> : letter}
          </button>
        )} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <Controller name={`options.${index}.text`} control={control} render={({ field: f }) => (
            <RichField value={f.value ?? ""} onChange={f.onChange} placeholder={`Option ${letter}`} />
          )} />
          {errors.options?.[index]?.text && (
            <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>{errors.options[index]?.text?.message}</span>
          )}
          <button type="button" onClick={() => setShowImg((v) => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.68rem", color: "var(--text3)", display: "flex", alignItems: "center", gap: "0.25rem", padding: 0 }}>
            <ImageIcon size={10} />
            {showImg ? "Remove image" : "Add image to this option"}
          </button>
          {showImg && (
            <ImgDrop compact value={optionImages[index] ?? null}
              onChange={(f) => setOptionImages((prev) => { const next = [...prev]; next[index] = f; return next; })}
              label={`Image for option ${letter}`} />
          )}
        </div>
        {canRemove && (
          <button type="button" onClick={onRemove}
            style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: "0.2rem", borderRadius: "0.25rem" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminCreateQuestionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selSubject, setSelSubject] = useState("");
  const [selChapter, setSelChapter] = useState("");
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [solutionImage, setSolutionImage] = useState<File | null>(null);
  const [optionImages, setOptionImages] = useState<(File | null)[]>([null, null, null, null]);

  const { data: subjects } = useQuery({ queryKey: ["subjects"], queryFn: () => fetch("/api/subjects").then(r => r.json()) });
  const { data: chapters } = useQuery({ queryKey: ["chapters", selSubject], queryFn: () => fetch(`/api/chapters?subjectId=${selSubject}`).then(r => r.json()), enabled: !!selSubject });
  const { data: subconcepts } = useQuery({ queryKey: ["subconcepts", selChapter], queryFn: () => fetch(`/api/subconcepts?chapterId=${selChapter}`).then(r => r.json()), enabled: !!selChapter });

  const { handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      marks: 1, difficulty: "medium", isMultipleAnswer: false, solutionType: "none", solutionText: "",
      options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }, { text: "", isCorrect: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const isMultiple = watch("isMultipleAnswer");
  const solutionType = watch("solutionType");

  const onSubmit = async (data: FormData) => {
    if (!data.options.some(o => o.isCorrect)) {
      toast({ title: "Mark at least one correct answer", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("subjectId", data.subjectId);
      if (data.chapterId) fd.append("chapterId", data.chapterId);
      if (data.subconceptId) fd.append("subconceptId", data.subconceptId);
      if (data.gradeLevel) fd.append("gradeLevel", data.gradeLevel);
      fd.append("question", data.question);
      fd.append("difficulty", data.difficulty);
      fd.append("marks", String(data.marks));
      fd.append("isMultipleAnswer", String(data.isMultipleAnswer));
      fd.append("solutionType", data.solutionType);
      fd.append("options", JSON.stringify(data.options.map(o => ({ text: o.text, isCorrect: o.isCorrect }))));
      if (data.solutionType === "text" && data.solutionText) fd.append("solutionText", data.solutionText);
      if (questionImage) fd.append("questionImage", questionImage);
      if (data.solutionType === "image" && solutionImage) fd.append("solutionImage", solutionImage);
      optionImages.forEach((img, i) => { if (img) fd.append(`optionImage_${i}`, img); });

      const res = await fetch("/api/questions", { method: "POST", body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to save"); }
      toast({ title: "Question saved!" });
      router.push("/admin/questions");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const diffStyle = {
    easy:   { border: "var(--green)", bg: "var(--green-bg)", text: "var(--green)" },
    medium: { border: "var(--amber)", bg: "var(--amber-bg)", text: "var(--amber)" },
    hard:   { border: "var(--red)",   bg: "var(--red-bg)",   text: "var(--red)"   },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* KaTeX CSS */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/admin/questions">
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", display: "flex", padding: "0.25rem" }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>Create Question</h1>
            <p style={{ fontSize: "0.78rem", color: "var(--text3)", margin: 0 }}>Subject required — chapter & subconcept optional</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/admin/questions"><button style={{ padding: "0.45rem 0.9rem", borderRadius: "0.5rem", fontSize: "0.8rem", background: "none", border: "1px solid var(--border)", color: "var(--text2)", cursor: "pointer" }}>Discard</button></Link>
          <button onClick={handleSubmit(onSubmit)} disabled={loading}
            style={{ padding: "0.45rem 1.1rem", borderRadius: "0.5rem", fontSize: "0.8rem", background: loading ? "var(--accent-dim)" : "var(--accent)", border: "none", color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Saving..." : "Save Question"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 272px", gap: "1.1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Card title="Question">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <Controller name="question" control={control} render={({ field }) => (
                <RichField value={field.value ?? ""} onChange={field.onChange} placeholder="Type your question here..." multiline />
              )} />
              {errors.question && <span style={{ fontSize: "0.72rem", color: "var(--red)" }}>{errors.question.message}</span>}
              <div>
                <p style={{ fontSize: "0.7rem", color: "var(--text3)", marginBottom: "0.4rem" }}>Question image (optional)</p>
                <ImgDrop value={questionImage} onChange={setQuestionImage} label="Attach image to question" />
              </div>
            </div>
          </Card>

          <Card title="Answer Options">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Controller name="isMultipleAnswer" control={control} render={({ field }) => (
                  <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", cursor: "pointer", fontSize: "0.75rem", color: "var(--text2)" }}>
                    <div onClick={() => field.onChange(!field.value)}
                      style={{ width: "2.5rem", height: "1.35rem", borderRadius: "999px", background: field.value ? "var(--accent)" : "var(--surface3)", border: `1.5px solid ${field.value ? "var(--accent)" : "var(--border)"}`, position: "relative", transition: "all 0.2s", cursor: "pointer" }}>
                      <div style={{ width: "1rem", height: "1rem", borderRadius: "50%", background: "#fff", position: "absolute", top: "50%", transform: `translateX(${field.value ? "1.2rem" : "0.1rem"}) translateY(-50%)`, transition: "transform 0.2s" }} />
                    </div>
                    Multiple correct answers (MSQ)
                  </label>
                )} />
              </div>
              {fields.map((field, index) => (
                <OptionRow key={field.id} index={index} fieldId={field.id} control={control} errors={errors}
                  isMultiple={isMultiple} fields={fields} setValue={setValue}
                  optionImages={optionImages} setOptionImages={setOptionImages}
                  onRemove={() => { remove(index); setOptionImages(p => p.filter((_, i) => i !== index)); }}
                  canRemove={fields.length > 2} />
              ))}
              <button type="button" onClick={() => { append({ text: "", isCorrect: false }); setOptionImages(p => [...p, null]); }}
                style={{ width: "100%", padding: "0.6rem", border: "1.5px dashed var(--border2)", borderRadius: "0.625rem", background: "none", color: "var(--text3)", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text3)"; }}>
                <Plus size={14} /> Add option
              </button>
            </div>
          </Card>

          <Card title="Solution / Explanation">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <Controller name="solutionType" control={control} render={({ field }) => (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {([{ val: "none", label: "None" }, { val: "text", label: "Write Solution" }, { val: "image", label: "Upload Image" }] as const).map(opt => (
                    <button key={opt.val} type="button" onClick={() => field.onChange(opt.val)}
                      style={{ padding: "0.38rem 0.875rem", borderRadius: "0.4rem", fontSize: "0.75rem", fontWeight: field.value === opt.val ? 700 : 500, border: `1.5px solid ${field.value === opt.val ? "var(--accent)" : "var(--border)"}`, background: field.value === opt.val ? "var(--accent-bg)" : "var(--surface2)", color: field.value === opt.val ? "var(--accent)" : "var(--text2)", cursor: "pointer" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )} />
              {solutionType === "text" && (
                <Controller name="solutionText" control={control} render={({ field }) => (
                  <RichField value={field.value ?? ""} onChange={field.onChange} placeholder="Write the step-by-step solution..." multiline label="Solution" />
                )} />
              )}
              {solutionType === "image" && <ImgDrop value={solutionImage} onChange={setSolutionImage} label="Upload solution image" />}
              {solutionType === "none" && <p style={{ fontSize: "0.78rem", color: "var(--text3)", textAlign: "center" }}>No solution attached.</p>}
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", position: "sticky", top: "1.5rem" }}>
          <Card title="Classification">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { name: "subjectId" as const, label: "Subject", data: subjects, disabled: false, onChange: (v: string) => { setSelSubject(v); setValue("chapterId", ""); setValue("subconceptId", ""); } },
                { name: "chapterId" as const, label: "Chapter", data: chapters, disabled: !selSubject, optional: true, onChange: (v: string) => { setSelChapter(v); setValue("subconceptId", ""); } },
                { name: "subconceptId" as const, label: "Subconcept", data: subconcepts, disabled: !selChapter, optional: true },
              ].map(({ name, label, data, disabled, optional, onChange: extraOnChange }) => (
                <div key={name} style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <FieldLabel optional={optional}>{label}</FieldLabel>
                  <Controller name={name} control={control} render={({ field }) => (
                    <select value={field.value ?? ""} disabled={disabled}
                      onChange={(e) => { field.onChange(e.target.value || undefined); extraOnChange?.(e.target.value); }}
                      style={{ ...selBase, opacity: disabled ? 0.5 : 1 }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}>
                      <option value="">{disabled ? `Select ${name === "chapterId" ? "subject" : "chapter"} first` : optional ? `No ${label.toLowerCase()}` : `Select ${label.toLowerCase()}`}</option>
                      {(data as any[])?.map((item: any) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}
                    </select>
                  )} />
                  {(errors as any)[name] && <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>{(errors as any)[name]?.message}</span>}
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <FieldLabel optional>Grade Level</FieldLabel>
                <Controller name="gradeLevel" control={control} render={({ field }) => (
                  <select value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value || undefined)}
                    style={selBase} onFocus={(e) => (e.target.style.borderColor = "var(--accent)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")}>
                    <option value="">Any grade</option>
                    {[6,7,8,9,10,11,12].map(g => <option key={g} value={String(g)}>Grade {g}</option>)}
                  </select>
                )} />
              </div>
            </div>
          </Card>

          <Card title="Grading">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <FieldLabel>Difficulty</FieldLabel>
                <Controller name="difficulty" control={control} render={({ field }) => (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.35rem" }}>
                    {(["easy", "medium", "hard"] as const).map(d => {
                      const dc = diffStyle[d]; const active = field.value === d;
                      return <button key={d} type="button" onClick={() => field.onChange(d)}
                        style={{ padding: "0.38rem", borderRadius: "0.4rem", fontSize: "0.7rem", fontWeight: active ? 700 : 500, textTransform: "capitalize", border: `1.5px solid ${active ? dc.border : "var(--border)"}`, background: active ? dc.bg : "var(--surface2)", color: active ? dc.text : "var(--text3)", cursor: "pointer" }}>{d}</button>;
                    })}
                  </div>
                )} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <FieldLabel>Marks</FieldLabel>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Controller name="marks" control={control} render={({ field }) => (
                    <input type="number" min={1} max={100} value={field.value} onChange={(e) => field.onChange(Number(e.target.value))}
                      style={inpBase} onFocus={(e) => (e.target.style.borderColor = "var(--accent)")} onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
                  )} />
                  <span style={{ fontSize: "0.72rem", color: "var(--text3)" }}>pts</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}