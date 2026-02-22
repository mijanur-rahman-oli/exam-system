"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, Plus, Trash2, ImageIcon, FunctionSquare,
  X, CheckCircle2, Upload, Eye, EyeOff, Sun, Moon,
  FileText, AlignLeft,
} from "lucide-react";
import Link from "next/link";

// ─── Theme hook ───────────────────────────────────────────────────────────────
function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem("qb-theme");
    if (saved) setDark(saved === "dark");
  }, []);
  const toggle = () => setDark((v) => {
    localStorage.setItem("qb-theme", !v ? "dark" : "light");
    return !v;
  });
  return { dark, toggle };
}

// ─── CSS variables via inline style on root ───────────────────────────────────
function themeVars(dark: boolean): React.CSSProperties {
  return dark ? {
    "--bg":         "#0c0f14",
    "--surface":    "#131720",
    "--surface2":   "#1a2030",
    "--border":     "#252d3d",
    "--border2":    "#2e3850",
    "--text":       "#e8edf5",
    "--text2":      "#8b97b0",
    "--text3":      "#4a5568",
    "--accent":     "#3d8ef0",
    "--accent-bg":  "#0d2144",
    "--accent-dim": "#1a3a6a",
    "--green":      "#22c55e",
    "--green-bg":   "#052010",
    "--amber":      "#f59e0b",
    "--amber-bg":   "#1a1000",
    "--red":        "#ef4444",
    "--red-bg":     "#1a0505",
    "--input-bg":   "#0a0d12",
    "--hover":      "#1e2535",
  } as React.CSSProperties : {
    "--bg":         "#f4f6fb",
    "--surface":    "#ffffff",
    "--surface2":   "#f0f3f9",
    "--border":     "#dde3ef",
    "--border2":    "#c8d0e0",
    "--text":       "#1a2035",
    "--text2":      "#5a6480",
    "--text3":      "#9aa3b8",
    "--accent":     "#2563eb",
    "--accent-bg":  "#eff5ff",
    "--accent-dim": "#dbeafe",
    "--green":      "#16a34a",
    "--green-bg":   "#f0fdf4",
    "--amber":      "#d97706",
    "--amber-bg":   "#fffbeb",
    "--red":        "#dc2626",
    "--red-bg":     "#fef2f2",
    "--input-bg":   "#f8fafc",
    "--hover":      "#f0f4fc",
  } as React.CSSProperties;
}

// ─── LaTeX snippets ───────────────────────────────────────────────────────────
const SNIPPETS = [
  { label: "a/b",  val: "\\frac{a}{b}" },
  { label: "√x",   val: "\\sqrt{x}" },
  { label: "xⁿ",   val: "x^{n}" },
  { label: "xₙ",   val: "x_{n}" },
  { label: "Σ",    val: "\\sum_{i=1}^{n}" },
  { label: "∫",    val: "\\int_{a}^{b}" },
  { label: "lim",  val: "\\lim_{x \\to \\infty}" },
  { label: "α",    val: "\\alpha" },
  { label: "β",    val: "\\beta" },
  { label: "π",    val: "\\pi" },
  { label: "∞",    val: "\\infty" },
  { label: "±",    val: "\\pm" },
  { label: "≤",    val: "\\leq" },
  { label: "≥",    val: "\\geq" },
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
      className="cursor-pointer rounded-lg transition-all"
      style={{
        border: "2px dashed var(--border2)",
        background: "var(--surface2)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border2)")}
    >
      {preview ? (
        <div className={`relative ${compact ? "p-1" : "p-2"}`}>
          <img src={preview} alt="preview" className="max-h-40 mx-auto rounded object-contain" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); setPreview(null); }}
            className="absolute top-1 right-1 rounded-full p-0.5"
            style={{ background: "var(--red)", color: "#fff" }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center gap-1 ${compact ? "py-3 px-4" : "py-5"}`}>
          <Upload className="h-5 w-5" style={{ color: "var(--text3)" }} />
          <span className="text-xs" style={{ color: "var(--text2)" }}>{label}</span>
          {!compact && <span className="text-xs" style={{ color: "var(--text3)" }}>drag & drop or click</span>}
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }} />
    </div>
  );
}

// ─── Rich text / LaTeX input ──────────────────────────────────────────────────
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

  const baseInput: React.CSSProperties = {
    background: "var(--input-bg)",
    border: "1.5px solid var(--border)",
    color: "var(--text)",
    fontFamily: "monospace",
    fontSize: "0.875rem",
    borderRadius: "0.5rem",
    width: "100%",
    padding: "0.5rem 0.75rem",
    outline: "none",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {label && (
        <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text2)" }}>
          {label}
        </span>
      )}

      {/* Toggle bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <div style={{
          display: "flex", borderRadius: "0.375rem", overflow: "hidden",
          border: "1px solid var(--border)", fontSize: "0.7rem",
        }}>
          {(["text", "latex"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: "0.3rem 0.65rem",
                background: mode === m ? "var(--accent)" : "var(--surface2)",
                color: mode === m ? "#fff" : "var(--text2)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "0.25rem",
                transition: "all 0.15s",
              }}
            >
              {m === "text" ? <AlignLeft size={10} /> : <FunctionSquare size={10} />}
              {m === "text" ? "Text" : "LaTeX"}
            </button>
          ))}
        </div>

        {mode === "latex" && value && (
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
            style={{
              fontSize: "0.7rem", color: "var(--text2)", background: "none",
              border: "none", cursor: "pointer", display: "flex",
              alignItems: "center", gap: "0.25rem",
            }}
          >
            {preview ? <EyeOff size={11} /> : <Eye size={11} />}
            {preview ? "Hide" : "Preview"}
          </button>
        )}
      </div>

      {/* Input */}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={mode === "latex"
            ? "e.g. Solve $\\frac{d}{dx}[x^n]$ for $n = 3$"
            : placeholder}
          rows={4}
          style={{ ...baseInput, resize: "vertical", lineHeight: 1.6 }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={mode === "latex" ? "e.g. $E = mc^2$" : placeholder}
          style={baseInput}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      )}

      {/* Preview */}
      {mode === "latex" && preview && value && (
        <div style={{
          padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
          background: "var(--surface2)", border: "1px solid var(--border)",
          fontFamily: "monospace", fontSize: "0.85rem",
          color: "var(--accent)",
        }}>
          <span style={{ fontSize: "0.65rem", color: "var(--text3)", marginRight: "0.5rem" }}>
            preview →
          </span>
          {value}
        </div>
      )}

      {/* Snippets */}
      {mode === "latex" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
          {SNIPPETS.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => insert(s.val)}
              style={{
                fontSize: "0.65rem", padding: "0.2rem 0.5rem",
                borderRadius: "0.25rem", fontFamily: "monospace",
                background: "var(--surface2)", border: "1px solid var(--border2)",
                color: "var(--accent)", cursor: "pointer",
                transition: "all 0.1s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-dim)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--surface2)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border2)";
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  subjectId:       z.string().min(1, "Subject required"),
  chapterId:       z.string().min(1, "Chapter required"),
  subconceptId:    z.string().optional(),
  gradeLevel:      z.string().min(1, "Grade required"),
  question:        z.string().min(5, "Question required"),
  difficulty:      z.enum(["easy", "medium", "hard"]).default("medium"),
  marks:           z.coerce.number().min(1).default(1),
  isMultipleAnswer: z.boolean().default(false),
  options: z.array(z.object({
    text:      z.string().min(1, "Option text required"),
    isCorrect: z.boolean().default(false),
  })).min(2, "At least 2 options required"),
  // Solution
  solutionType:  z.enum(["none", "text", "image"]).default("none"),
  solutionText:  z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({ children, title, icon }: {
  children: React.ReactNode; title?: string; icon?: React.ReactNode;
}) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "0.875rem", overflow: "hidden",
    }}>
      {title && (
        <div style={{
          padding: "0.75rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          {icon}
          <span style={{
            fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "var(--text2)",
          }}>
            {title}
          </span>
        </div>
      )}
      <div style={{ padding: "1.25rem" }}>{children}</div>
    </div>
  );
}

// ─── Sidebar label ────────────────────────────────────────────────────────────
function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text2)", letterSpacing: "0.04em" }}>
      {children}
    </span>
  );
}

// ─── Select wrapper ───────────────────────────────────────────────────────────
function StyledSelect({
  value, onValueChange, placeholder, children, disabled,
}: {
  value?: string; onValueChange: (v: string) => void;
  placeholder?: string; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger style={{
        height: "2rem", fontSize: "0.8rem",
        background: "var(--input-bg)", border: "1.5px solid var(--border)",
        color: "var(--text)", borderRadius: "0.5rem",
        opacity: disabled ? 0.45 : 1,
      }}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        color: "var(--text)", borderRadius: "0.5rem",
      }}>
        {children}
      </SelectContent>
    </Select>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CreateQuestionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { dark, toggle } = useTheme();

  const [isLoading,      setIsLoading]      = useState(false);
  const [selSubject,     setSelSubject]      = useState("");
  const [selChapter,     setSelChapter]      = useState("");
  const [questionImage,  setQuestionImage]   = useState<File | null>(null);
  const [solutionImage,  setSolutionImage]   = useState<File | null>(null);
  const [optionImages,   setOptionImages]    = useState<(File | null)[]>([null, null, null, null]);

  // Queries
  const { data: subjects }   = useQuery({ queryKey: ["subjects"],            queryFn: () => fetch("/api/subjects").then(r => r.json()) });
  const { data: chapters }   = useQuery({ queryKey: ["chapters", selSubject], queryFn: () => fetch(`/api/chapters?subjectId=${selSubject}`).then(r => r.json()), enabled: !!selSubject });
  const { data: subconcepts } = useQuery({ queryKey: ["subconcepts", selChapter], queryFn: () => fetch(`/api/subconcepts?chapterId=${selChapter}`).then(r => r.json()), enabled: !!selChapter });

  const { handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      marks: 1, difficulty: "medium", isMultipleAnswer: false,
      solutionType: "none", solutionText: "",
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

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("subjectId",        data.subjectId);
      fd.append("chapterId",        data.chapterId);
      if (data.subconceptId) fd.append("subconceptId", data.subconceptId);
      fd.append("gradeLevel",       data.gradeLevel);
      fd.append("question",         data.question);
      fd.append("difficulty",       data.difficulty);
      fd.append("marks",            String(data.marks));
      fd.append("isMultipleAnswer", String(data.isMultipleAnswer));
      fd.append("options",          JSON.stringify(data.options.map(o => ({ text: o.text, isCorrect: o.isCorrect }))));
      fd.append("solutionType",     data.solutionType);
      if (data.solutionType === "text" && data.solutionText) {
        fd.append("solutionText", data.solutionText);
      }
      if (questionImage) fd.append("questionImage", questionImage);
      if (data.solutionType === "image" && solutionImage) fd.append("solutionImage", solutionImage);
      optionImages.forEach((img, i) => { if (img) fd.append(`optionImage_${i}`, img); });

      const res = await fetch("/api/questions", { method: "POST", body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }

      toast({ title: "Question saved!", description: "Added to your question bank." });
      router.push("/question-setter/questions");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const diffColor = {
    easy:   { border: "var(--green)",  bg: "var(--green-bg)",  text: "var(--green)" },
    medium: { border: "var(--amber)",  bg: "var(--amber-bg)",  text: "var(--amber)" },
    hard:   { border: "var(--red)",    bg: "var(--red-bg)",    text: "var(--red)" },
  };

  const currentDiff = watch("difficulty");

  return (
    <div style={{ ...themeVars(dark) as React.CSSProperties, minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'DM Sans', 'Outfit', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(10px)",
      }}>
        <div style={{
          maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem",
          height: "3.25rem", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link href="/question-setter/questions">
              <button style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text2)", display: "flex", alignItems: "center",
                padding: "0.25rem", borderRadius: "0.375rem",
                transition: "color 0.15s",
              }}>
                <ArrowLeft size={18} />
              </button>
            </Link>
            <div style={{ width: "1px", height: "1rem", background: "var(--border)" }} />
            <span style={{
              fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "var(--accent)",
            }}>
              Question Bank
            </span>
            <span style={{ color: "var(--text3)", fontSize: "0.85rem" }}>›</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text2)" }}>New Question</span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            {/* Theme toggle */}
            <button
              onClick={toggle}
              style={{
                padding: "0.35rem", borderRadius: "0.5rem",
                background: "var(--surface2)", border: "1px solid var(--border)",
                color: "var(--text2)", cursor: "pointer", display: "flex",
                alignItems: "center", transition: "all 0.15s",
              }}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <Link href="/question-setter/questions">
              <button style={{
                padding: "0.4rem 0.85rem", borderRadius: "0.5rem", fontSize: "0.8rem",
                background: "none", border: "1px solid var(--border)",
                color: "var(--text2)", cursor: "pointer",
              }}>
                Discard
              </button>
            </Link>

            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isLoading}
              style={{
                padding: "0.4rem 1rem", borderRadius: "0.5rem", fontSize: "0.8rem",
                background: isLoading ? "var(--accent-dim)" : "var(--accent)",
                border: "none", color: "#fff", cursor: isLoading ? "not-allowed" : "pointer",
                fontWeight: 600, transition: "all 0.15s",
              }}
            >
              {isLoading ? "Saving…" : "Save Question"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{
        maxWidth: "1200px", margin: "0 auto", padding: "1.75rem 1.5rem",
        display: "grid", gridTemplateColumns: "1fr 272px", gap: "1.25rem",
      }}>

        {/* ══ LEFT COLUMN ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Question */}
          <Card
            title="Question"
            icon={
              <div style={{
                width: "1.25rem", height: "1.25rem", borderRadius: "0.25rem",
                background: "var(--accent-bg)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "0.65rem", fontWeight: 900,
                color: "var(--accent)",
              }}>Q</div>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Controller
                name="question"
                control={control}
                render={({ field }) => (
                  <RichField
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Type your question here…"
                    multiline
                  />
                )}
              />
              {errors.question && (
                <span style={{ fontSize: "0.75rem", color: "var(--red)" }}>
                  {errors.question.message}
                </span>
              )}

              {/* Question image */}
              <div>
                <p style={{
                  fontSize: "0.72rem", color: "var(--text3)", marginBottom: "0.4rem",
                  display: "flex", alignItems: "center", gap: "0.3rem",
                }}>
                  <ImageIcon size={11} /> Question image (optional)
                </p>
                <ImgDrop value={questionImage} onChange={setQuestionImage} label="Attach image to question" />
              </div>
            </div>
          </Card>

          {/* Options */}
          <Card title="Answer Options">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {/* MSQ toggle */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Controller
                  name="isMultipleAnswer"
                  control={control}
                  render={({ field }) => (
                    <label style={{
                      display: "flex", alignItems: "center", gap: "0.4rem",
                      cursor: "pointer", fontSize: "0.75rem", color: "var(--text2)",
                    }}>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        style={{ borderColor: "var(--border2)" }}
                      />
                      Multiple correct answers (MSQ)
                    </label>
                  )}
                />
              </div>

              {(errors.options as any)?.message && (
                <span style={{ fontSize: "0.75rem", color: "var(--red)" }}>
                  {(errors.options as any).message}
                </span>
              )}

              {/* Option rows */}
              {fields.map((field, index) => {
                const letter = String.fromCharCode(65 + index);
                const [showOptImg, setShowOptImg] = useState(false);

                return (
                  <div
                    key={field.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "0.625rem",
                      overflow: "hidden",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.75rem" }}>
                      {/* Correct badge */}
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
                            style={{
                              flexShrink: 0, marginTop: "0.25rem",
                              width: "1.6rem", height: "1.6rem",
                              borderRadius: "50%", display: "flex",
                              alignItems: "center", justifyContent: "center",
                              fontSize: "0.7rem", fontWeight: 700,
                              border: `2px solid ${f.value ? "var(--green)" : "var(--border2)"}`,
                              background: f.value ? "var(--green-bg)" : "transparent",
                              color: f.value ? "var(--green)" : "var(--text3)",
                              cursor: "pointer", transition: "all 0.15s",
                            }}
                            title={f.value ? "Correct" : "Mark correct"}
                          >
                            {f.value ? <CheckCircle2 size={14} /> : letter}
                          </button>
                        )}
                      />

                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
                          <span style={{ fontSize: "0.72rem", color: "var(--red)" }}>
                            {errors.options[index]?.text?.message}
                          </span>
                        )}

                        {/* Option image toggle */}
                        <button
                          type="button"
                          onClick={() => setShowOptImg(v => !v)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: "0.7rem", color: "var(--text3)",
                            display: "flex", alignItems: "center", gap: "0.25rem",
                            padding: 0, transition: "color 0.15s", alignSelf: "flex-start",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text2)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
                        >
                          <ImageIcon size={11} />
                          {showOptImg ? "Remove image" : "Add image to this option"}
                        </button>

                        {showOptImg && (
                          <ImgDrop
                            value={optionImages[index]}
                            onChange={(f) => {
                              const next = [...optionImages];
                              next[index] = f;
                              setOptionImages(next);
                            }}
                            label={`Image for option ${letter}`}
                            compact
                          />
                        )}
                      </div>

                      {/* Remove */}
                      {fields.length > 2 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          style={{
                            flexShrink: 0, background: "none", border: "none",
                            cursor: "pointer", color: "var(--text3)",
                            padding: "0.25rem", borderRadius: "0.25rem",
                            transition: "color 0.15s",
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
              })}

              {/* Add option */}
              <button
                type="button"
                onClick={() => {
                  append({ text: "", isCorrect: false });
                  setOptionImages(prev => [...prev, null]);
                }}
                style={{
                  width: "100%", padding: "0.6rem",
                  border: "1.5px dashed var(--border2)",
                  borderRadius: "0.625rem", background: "none",
                  color: "var(--text3)", cursor: "pointer",
                  fontSize: "0.8rem", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  gap: "0.4rem", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border2)";
                  e.currentTarget.style.color = "var(--text3)";
                }}
              >
                <Plus size={14} /> Add option
              </button>
            </div>
          </Card>

          {/* Solution */}
          <Card
            title="Solution / Explanation"
            icon={<FileText size={13} style={{ color: "var(--text3)" }} />}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {/* Solution type selector */}
              <Controller
                name="solutionType"
                control={control}
                render={({ field }) => (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {([
                      { val: "none",  label: "None" },
                      { val: "text",  label: "Write Solution" },
                      { val: "image", label: "Image" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => field.onChange(opt.val)}
                        style={{
                          padding: "0.4rem 0.9rem",
                          borderRadius: "0.4rem", fontSize: "0.78rem",
                          border: `1.5px solid ${field.value === opt.val ? "var(--accent)" : "var(--border)"}`,
                          background: field.value === opt.val ? "var(--accent-bg)" : "var(--surface2)",
                          color: field.value === opt.val ? "var(--accent)" : "var(--text2)",
                          cursor: "pointer", fontWeight: field.value === opt.val ? 600 : 400,
                          transition: "all 0.15s",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              />

              {/* Text solution */}
              {solutionType === "text" && (
                <Controller
                  name="solutionText"
                  control={control}
                  render={({ field }) => (
                    <RichField
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Write the step-by-step solution here…"
                      multiline
                      label="Solution text"
                    />
                  )}
                />
              )}

              {/* Image solution */}
              {solutionType === "image" && (
                <div>
                  <p style={{
                    fontSize: "0.72rem", color: "var(--text2)",
                    marginBottom: "0.5rem",
                  }}>
                    Upload solution image (handwritten or diagram)
                  </p>
                  <ImgDrop
                    value={solutionImage}
                    onChange={setSolutionImage}
                    label="Upload solution image"
                  />
                </div>
              )}

              {solutionType === "none" && (
                <p style={{ fontSize: "0.78rem", color: "var(--text3)", textAlign: "center", padding: "0.5rem 0" }}>
                  No solution attached. Students won't see an explanation after submission.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* ══ RIGHT SIDEBAR ══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>

          {/* Classification */}
          <Card title="Classification">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>

              {/* Grade */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <SideLabel>Grade Level</SideLabel>
                <Controller
                  name="gradeLevel"
                  control={control}
                  render={({ field }) => (
                    <StyledSelect value={field.value} onValueChange={field.onChange} placeholder="Select grade">
                      {[6,7,8,9,10,11,12].map(g => (
                        <SelectItem key={g} value={String(g)} style={{ fontSize: "0.8rem" }}>
                          Grade {g}
                        </SelectItem>
                      ))}
                    </StyledSelect>
                  )}
                />
                {errors.gradeLevel && <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>{errors.gradeLevel.message}</span>}
              </div>

              {/* Subject */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <SideLabel>Subject</SideLabel>
                <Controller
                  name="subjectId"
                  control={control}
                  render={({ field }) => (
                    <StyledSelect
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        setSelSubject(v);
                        setSelChapter("");
                        setValue("chapterId", "");
                        setValue("subconceptId", "");
                      }}
                      placeholder="Select subject"
                    >
                      {subjects?.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)} style={{ fontSize: "0.8rem" }}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </StyledSelect>
                  )}
                />
                {errors.subjectId && <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>{errors.subjectId.message}</span>}
              </div>

              {/* Chapter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <SideLabel>Chapter</SideLabel>
                <Controller
                  name="chapterId"
                  control={control}
                  render={({ field }) => (
                    <StyledSelect
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        setSelChapter(v);
                        setValue("subconceptId", "");
                      }}
                      placeholder={!selSubject ? "Select subject first" : "Select chapter"}
                      disabled={!selSubject}
                    >
                      {chapters?.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)} style={{ fontSize: "0.8rem" }}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </StyledSelect>
                  )}
                />
                {errors.chapterId && <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>{errors.chapterId.message}</span>}
              </div>

              {/* Subconcept */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <SideLabel>
                  Subconcept <span style={{ color: "var(--text3)", fontWeight: 400 }}>(optional)</span>
                </SideLabel>
                <Controller
                  name="subconceptId"
                  control={control}
                  render={({ field }) => (
                    <StyledSelect
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={!selChapter ? "Select chapter first" : "Select subconcept"}
                      disabled={!selChapter || !subconcepts?.length}
                    >
                      {subconcepts?.map((sc: any) => (
                        <SelectItem key={sc.id} value={String(sc.id)} style={{ fontSize: "0.8rem" }}>
                          {sc.name}
                        </SelectItem>
                      ))}
                    </StyledSelect>
                  )}
                />
              </div>
            </div>
          </Card>

          {/* Grading */}
          <Card title="Grading">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>

              {/* Difficulty */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <SideLabel>Difficulty</SideLabel>
                <Controller
                  name="difficulty"
                  control={control}
                  render={({ field }) => (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.35rem" }}>
                      {(["easy", "medium", "hard"] as const).map((d) => {
                        const dc = diffColor[d];
                        const active = field.value === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => field.onChange(d)}
                            style={{
                              padding: "0.4rem 0", borderRadius: "0.4rem",
                              fontSize: "0.72rem", fontWeight: active ? 700 : 500,
                              textTransform: "capitalize",
                              border: `1.5px solid ${active ? dc.border : "var(--border)"}`,
                              background: active ? dc.bg : "var(--surface2)",
                              color: active ? dc.text : "var(--text3)",
                              cursor: "pointer", transition: "all 0.15s",
                            }}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              {/* Marks */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <SideLabel>Marks</SideLabel>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Controller
                    name="marks"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        style={{
                          flex: 1, height: "2rem", padding: "0 0.75rem",
                          borderRadius: "0.5rem", fontSize: "0.8rem",
                          background: "var(--input-bg)", border: "1.5px solid var(--border)",
                          color: "var(--text)", outline: "none",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                      />
                    )}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text3)", flexShrink: 0 }}>
                    pts
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Tips */}
          <div style={{
            padding: "0.875rem 1rem",
            borderRadius: "0.75rem",
            border: "1px solid var(--border)",
            background: "var(--surface2)",
          }}>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text2)", marginBottom: "0.5rem" }}>
              Quick tips
            </p>
            {[
              "Switch to LaTeX for math expressions",
              "Click circle badge to mark correct answer",
              "Each option can have its own image",
              "Write solution or attach image for explanation",
              "Enable MSQ for multiple correct answers",
            ].map((tip) => (
              <p key={tip} style={{ fontSize: "0.7rem", color: "var(--text3)", marginBottom: "0.3rem" }}>
                · {tip}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}