// app/admin/questions/create/page.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft, Plus, Trash2, ImageIcon,
  FunctionSquare, X, CheckCircle2, Upload,
  Eye, EyeOff, AlignLeft,
} from "lucide-react";
import Link from "next/link";

// ─── Styles ───────────────────────────────────────────────────────────────────
const selBase: React.CSSProperties = {
  width: "100%", height: "2.1rem", padding: "0 0.7rem",
  borderRadius: "0.5rem", background: "var(--input-bg)",
  border: "1.5px solid var(--border)", color: "var(--text)",
  fontSize: "0.8rem", outline: "none", appearance: "none" as any,
  boxSizing: "border-box", transition: "border-color 0.15s",
};
const inpBase: React.CSSProperties = { ...selBase, appearance: undefined };

// ─── LaTeX snippets ───────────────────────────────────────────────────────────
const SNIPPETS = [
  { label: "a/b",  val: "\\frac{a}{b}"           },
  { label: "√x",   val: "\\sqrt{x}"               },
  { label: "xⁿ",   val: "x^{n}"                   },
  { label: "xₙ",   val: "x_{n}"                   },
  { label: "Σ",    val: "\\sum_{i=1}^{n}"          },
  { label: "∫",    val: "\\int_{a}^{b}"            },
  { label: "lim",  val: "\\lim_{x \\to \\infty}"  },
  { label: "α",    val: "\\alpha"                  },
  { label: "β",    val: "\\beta"                   },
  { label: "π",    val: "\\pi"                     },
  { label: "∞",    val: "\\infty"                  },
  { label: "±",    val: "\\pm"                     },
  { label: "≤",    val: "\\leq"                    },
  { label: "≥",    val: "\\geq"                    },
];

// ─── Image dropzone ───────────────────────────────────────────────────────────
function ImgDrop({
  value, onChange, label = "Add image", compact = false,
}: {
  value: File | null;
  onChange: (f: File | null) => void;
  label?: string;
  compact?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handle = (file: File) => {
    onChange(file);
    const r = new FileReader();
    r.onload = (e) => setPreview(e.target?.result as string);
    r.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handle(f);
  }, []);

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => ref.current?.click()}
      style={{
        cursor: "pointer", borderRadius: "0.5rem",
        border: "2px dashed var(--border2)",
        background: "var(--surface2)", transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border2)")}
    >
      {preview ? (
        <div style={{ position: "relative", padding: "0.5rem" }}>
          <img
            src={preview} alt="preview"
            style={{ maxHeight: "9rem", margin: "0 auto", display: "block", borderRadius: "0.375rem", objectFit: "contain" }}
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); setPreview(null); }}
            style={{
              position: "absolute", top: "0.25rem", right: "0.25rem",
              background: "var(--red)", color: "#fff", border: "none",
              borderRadius: "50%", width: "1.25rem", height: "1.25rem",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={10} />
          </button>
        </div>
      ) : (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: "0.3rem", padding: compact ? "0.65rem 0.75rem" : "1.25rem",
        }}>
          <Upload size={16} style={{ color: "var(--text3)" }} />
          <span style={{ fontSize: "0.72rem", color: "var(--text2)" }}>{label}</span>
          {!compact && <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>drag & drop or click</span>}
        </div>
      )}
      <input
        ref={ref} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }}
      />
    </div>
  );
}

// ─── Rich text / LaTeX field ──────────────────────────────────────────────────
function RichField({
  value, onChange, placeholder, multiline = false, label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  label?: string;
}) {
  const [mode, setMode] = useState<"text" | "latex">("text");
  const [preview, setPreview] = useState(false);
  const insert = (s: string) => onChange(value + `$${s}$`);

  const base: React.CSSProperties = {
    background: "var(--input-bg)", border: "1.5px solid var(--border)",
    color: "var(--text)", fontFamily: "monospace", fontSize: "0.85rem",
    borderRadius: "0.5rem", width: "100%", padding: "0.5rem 0.75rem",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {label && (
        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>{label}</span>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{
          display: "flex", borderRadius: "0.375rem", overflow: "hidden",
          border: "1px solid var(--border)", fontSize: "0.68rem",
        }}>
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
          <button type="button" onClick={() => setPreview((v) => !v)} style={{
            fontSize: "0.68rem", color: "var(--text2)", background: "none",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem",
          }}>
            {preview ? <EyeOff size={10} /> : <Eye size={10} />}
            {preview ? "Hide" : "Preview"}
          </button>
        )}
      </div>
      {multiline ? (
        <textarea
          value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={mode === "latex" ? "e.g. Solve $\\frac{d}{dx}[x^n]$" : placeholder}
          rows={4} style={{ ...base, resize: "vertical", lineHeight: 1.6 }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      ) : (
        <input
          value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={mode === "latex" ? "e.g. $E = mc^2$" : placeholder}
          style={{ ...base, height: "2.1rem" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      )}
      {mode === "latex" && preview && value && (
        <div style={{
          padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
          background: "var(--surface2)", border: "1px solid var(--border)",
          fontFamily: "monospace", fontSize: "0.82rem", color: "var(--accent)",
        }}>
          <span style={{ fontSize: "0.62rem", color: "var(--text3)", marginRight: "0.5rem" }}>preview →</span>
          {value}
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

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", overflow: "hidden",
    }}>
      {title && (
        <div style={{ padding: "0.7rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <span style={{
            fontSize: "0.68rem", fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text2)",
          }}>{title}</span>
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
      {optional && (
        <span style={{ fontWeight: 400, color: "var(--text3)", marginLeft: "0.3rem" }}>(optional)</span>
      )}
    </span>
  );
}

// ─── OptionRow Component ──────────────────────────────────────────────────────
function OptionRow({
  index,
  fieldId,
  control,
  errors,
  isMultiple,
  fields,
  setValue,
  optionImages,
  setOptionImages,
  onRemove,
  canRemove,
}: {
  index: number;
  fieldId: string;
  control: any;
  errors: any;
  isMultiple: boolean;
  fields: any[];
  setValue: any;
  optionImages: (File | null)[];
  setOptionImages: React.Dispatch<React.SetStateAction<(File | null)[]>>;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [showImg, setShowImg] = useState(false);
  const letter = String.fromCharCode(65 + index);

  return (
    <div
      key={fieldId}
      style={{
        border: "1px solid var(--border)", borderRadius: "0.625rem",
        overflow: "hidden", transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border2)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", padding: "0.75rem" }}>
        {/* Correct answer badge */}
        <Controller
          name={`options.${index}.isCorrect`}
          control={control}
          render={({ field: f }) => (
            <button
              type="button"
              onClick={() => {
                if (!isMultiple) {
                  fields.forEach((_, i) => {
                    if (i !== index) setValue(`options.${i}.isCorrect`, false);
                  });
                }
                f.onChange(!f.value);
              }}
              title={f.value ? "Correct answer" : "Mark as correct"}
              style={{
                flexShrink: 0, marginTop: "0.2rem",
                width: "1.55rem", height: "1.55rem", borderRadius: "50%",
                border: `2px solid ${f.value ? "var(--green)" : "var(--border2)"}`,
                background: f.value ? "var(--green-bg)" : "transparent",
                color: f.value ? "var(--green)" : "var(--text3)",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "0.7rem", fontWeight: 700,
                transition: "all 0.12s",
              }}
            >
              {f.value ? <CheckCircle2 size={13} /> : letter}
            </button>
          )}
        />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <Controller
            name={`options.${index}.text`}
            control={control}
            render={({ field: f }) => (
              <RichField
                value={f.value ?? ""}
                onChange={f.onChange}
                placeholder={`Option ${letter}`}
              />
            )}
          />
          {errors.options?.[index]?.text && (
            <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>
              {errors.options[index]?.text?.message}
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowImg((v) => !v)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.68rem", color: "var(--text3)",
              display: "flex", alignItems: "center", gap: "0.25rem",
              padding: 0, alignSelf: "flex-start", transition: "color 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text2)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
          >
            <ImageIcon size={10} />
            {showImg ? "Remove image" : "Add image to this option"}
          </button>

          {showImg && (
            <ImgDrop
              compact
              value={optionImages[index] ?? null}
              onChange={(f) => {
                setOptionImages((prev) => {
                  const next = [...prev];
                  next[index] = f;
                  return next;
                });
              }}
              label={`Image for option ${letter}`}
            />
          )}
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            style={{
              flexShrink: 0, background: "none", border: "none",
              cursor: "pointer", color: "var(--text3)",
              padding: "0.2rem", borderRadius: "0.25rem", transition: "color 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminCreateQuestionPage() {
  const router    = useRouter();
  const { toast } = useToast();

  const [loading,       setLoading]       = useState(false);
  const [selSubject,    setSelSubject]     = useState("");
  const [selChapter,    setSelChapter]     = useState("");
  const [questionImage, setQuestionImage]  = useState<File | null>(null);
  const [solutionImage, setSolutionImage]  = useState<File | null>(null);
  const [optionImages,  setOptionImages]   = useState<(File | null)[]>([null, null, null, null]);

  const { data: subjects }    = useQuery({ 
    queryKey: ["subjects"], 
    queryFn: () => fetch("/api/subjects").then((r) => r.json()) 
  });
  
  const { data: chapters }    = useQuery({ 
    queryKey: ["chapters", selSubject],    
    queryFn: () => fetch(`/api/chapters?subjectId=${selSubject}`).then((r) => r.json()), 
    enabled: !!selSubject 
  });
  
  const { data: subconcepts } = useQuery({ 
    queryKey: ["subconcepts", selChapter], 
    queryFn: () => fetch(`/api/subconcepts?chapterId=${selChapter}`).then((r) => r.json()), 
    enabled: !!selChapter 
  });

  const {
    handleSubmit, control, watch, setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      marks: 1, difficulty: "medium",
      isMultipleAnswer: false, solutionType: "none", solutionText: "",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const isMultiple   = watch("isMultipleAnswer");
  const solutionType = watch("solutionType");

  // ─── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    const hasCorrect = data.options.some((o) => o.isCorrect);
    if (!hasCorrect) {
      toast({ title: "Mark at least one correct answer", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("subjectId",        data.subjectId);
      if (data.chapterId)    fd.append("chapterId",    data.chapterId);
      if (data.subconceptId) fd.append("subconceptId", data.subconceptId);
      if (data.gradeLevel)   fd.append("gradeLevel",   data.gradeLevel);
      fd.append("question",         data.question);
      fd.append("difficulty",       data.difficulty);
      fd.append("marks",            String(data.marks));
      fd.append("isMultipleAnswer", String(data.isMultipleAnswer));
      fd.append("solutionType",     data.solutionType);
      fd.append("options", JSON.stringify(
        data.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
      ));
      if (data.solutionType === "text" && data.solutionText) {
        fd.append("solutionText", data.solutionText);
      }
      if (questionImage) fd.append("questionImage", questionImage);
      if (data.solutionType === "image" && solutionImage) fd.append("solutionImage", solutionImage);
      optionImages.forEach((img, i) => { if (img) fd.append(`optionImage_${i}`, img); });

      const res = await fetch("/api/questions", { method: "POST", body: fd });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to save");
      }
      toast({ title: "Question saved!", description: "Added to the question bank." });
      router.push("/admin/questions");
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const diffStyle = {
    easy:   { border: "var(--green)", bg: "var(--green-bg)", text: "var(--green)" },
    medium: { border: "var(--amber)", bg: "var(--amber-bg)", text: "var(--amber)" },
    hard:   { border: "var(--red)",   bg: "var(--red-bg)",   text: "var(--red)"   },
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/questions">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Question</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add a new question to the question bank
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/questions">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
          </Link>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save Question"
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* ════ LEFT - 2 columns ════ */}
        <div className="col-span-2 space-y-6">

          {/* Question body */}
          <Card title="Question">
            <div className="space-y-4">
              <Controller name="question" control={control} render={({ field }) => (
                <RichField 
                  value={field.value ?? ""} 
                  onChange={field.onChange}
                  placeholder="Type your question here…" 
                  multiline 
                />
              )} />
              {errors.question && (
                <p className="text-sm text-red-500">{errors.question.message}</p>
              )}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <ImageIcon size={12} /> Question image (optional)
                </p>
                <ImgDrop value={questionImage} onChange={setQuestionImage} label="Attach image to question" />
              </div>
            </div>
          </Card>

          {/* Answer options */}
          <Card title="Answer Options">
            <div className="space-y-4">

              {/* MSQ toggle */}
              <div className="flex justify-end">
                <Controller name="isMultipleAnswer" control={control} render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => field.onChange(!field.value)}
                      className={`w-10 h-5 rounded-full transition-colors duration-200 ease-in-out relative ${
                        field.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                          field.value ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Multiple correct answers (MSQ)
                    </span>
                  </label>
                )} />
              </div>

              {(errors.options as any)?.message && (
                <p className="text-sm text-red-500">{(errors.options as any).message}</p>
              )}

              {/* Option rows */}
              {fields.map((field, index) => (
                <OptionRow
                  key={field.id}
                  index={index}
                  fieldId={field.id}
                  control={control}
                  errors={errors}
                  isMultiple={isMultiple}
                  fields={fields}
                  setValue={setValue}
                  optionImages={optionImages}
                  setOptionImages={setOptionImages}
                  onRemove={() => {
                    remove(index);
                    setOptionImages((prev) => prev.filter((_, i) => i !== index));
                  }}
                  canRemove={fields.length > 2}
                />
              ))}

              <button
                type="button"
                onClick={() => {
                  append({ text: "", isCorrect: false });
                  setOptionImages((p) => [...p, null]);
                }}
                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Plus size={16} /> Add option
              </button>
            </div>
          </Card>

          {/* Solution */}
          <Card title="Solution / Explanation">
            <div className="space-y-4">
              <Controller name="solutionType" control={control} render={({ field }) => (
                <div className="flex gap-2 flex-wrap">
                  {[
                    { val: "none",  label: "None"            },
                    { val: "text",  label: "Write Solution"  },
                    { val: "image", label: "Upload Image"    },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => field.onChange(opt.val)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        field.value === opt.val
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )} />

              {solutionType === "text" && (
                <Controller name="solutionText" control={control} render={({ field }) => (
                  <RichField 
                    value={field.value ?? ""} 
                    onChange={field.onChange}
                    placeholder="Write the step-by-step solution here…"
                    multiline 
                    label="Solution" 
                  />
                )} />
              )}
              {solutionType === "image" && (
                <ImgDrop 
                  value={solutionImage} 
                  onChange={setSolutionImage}
                  label="Upload solution image (handwritten / diagram)" 
                />
              )}
              {solutionType === "none" && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  No solution attached. Students won't see an explanation after submission.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* ════ RIGHT SIDEBAR ════ */}
        <div className="space-y-6">

          {/* Classification */}
          <Card title="Classification">
            <div className="space-y-4">

              <div>
                <FieldLabel>Subject</FieldLabel>
                <Controller name="subjectId" control={control} render={({ field }) => (
                  <select
                    value={field.value ?? ""}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      setSelSubject(e.target.value);
                      setSelChapter("");
                      setValue("chapterId", "");
                      setValue("subconceptId", "");
                    }}
                    className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="">Select subject</option>
                    {subjects?.map((s: any) => (
                      <option key={s.id} value={String(s.id)}>{s.name}</option>
                    ))}
                  </select>
                )} />
                {errors.subjectId && (
                  <p className="text-xs text-red-500 mt-1">{errors.subjectId.message}</p>
                )}
              </div>

              <div>
                <FieldLabel optional>Chapter</FieldLabel>
                <Controller name="chapterId" control={control} render={({ field }) => (
                  <select
                    value={field.value ?? ""}
                    onChange={(e) => {
                      field.onChange(e.target.value || undefined);
                      setSelChapter(e.target.value);
                      setValue("subconceptId", "");
                    }}
                    disabled={!selSubject || !chapters?.length}
                    className={`w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                      (!selSubject || !chapters?.length) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">
                      {!selSubject ? "Select subject first" : !chapters?.length ? "No chapters" : "No chapter (general)"}
                    </option>
                    {chapters?.map((c: any) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                )} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave blank for a general subject question
                </p>
              </div>

              <div>
                <FieldLabel optional>Subconcept</FieldLabel>
                <Controller name="subconceptId" control={control} render={({ field }) => (
                  <select
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                    disabled={!selChapter || !subconcepts?.length}
                    className={`w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                      (!selChapter || !subconcepts?.length) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">
                      {!selChapter ? "Select chapter first" : !subconcepts?.length ? "No subconcepts" : "No specific subconcept"}
                    </option>
                    {subconcepts?.map((sc: any) => (
                      <option key={sc.id} value={String(sc.id)}>{sc.name}</option>
                    ))}
                  </select>
                )} />
              </div>

              <div>
                <FieldLabel optional>Grade Level</FieldLabel>
                <Controller name="gradeLevel" control={control} render={({ field }) => (
                  <select
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                    className="w-full mt-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  >
                    <option value="">Any grade</option>
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={String(g)}>Grade {g}</option>
                    ))}
                  </select>
                )} />
              </div>
            </div>
          </Card>

          {/* Grading */}
          <Card title="Grading">
            <div className="space-y-4">

              <div>
                <FieldLabel>Difficulty</FieldLabel>
                <Controller name="difficulty" control={control} render={({ field }) => (
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {(["easy", "medium", "hard"] as const).map((d) => {
                      const active = field.value === d;
                      const colors = {
                        easy: 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
                        medium: 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
                        hard: 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
                      };
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => field.onChange(d)}
                          className={`px-2 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                            active 
                              ? colors[d] + ' border'
                              : 'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                )} />
              </div>

              <div>
                <FieldLabel>Marks</FieldLabel>
                <div className="flex items-center gap-2 mt-1">
                  <Controller name="marks" control={control} render={({ field }) => (
                    <input
                      type="number" min={1} max={100}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    />
                  )} />
                  <span className="text-sm text-gray-500 dark:text-gray-400">pts</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Tips */}
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
              Quick tips
            </p>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Only subject is required — chapter is optional
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Switch to LaTeX for math expressions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Click the circle badge to mark correct answer(s)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Each option can have its own image
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Enable MSQ for multiple correct answers
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Write or upload an image for the solution
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}