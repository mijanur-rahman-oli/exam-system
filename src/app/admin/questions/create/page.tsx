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
  Eye, EyeOff, AlignLeft, HelpCircle,
  AlertCircle, Save
} from "lucide-react";
import Link from "next/link";

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
  { label: "→",    val: "\\to" },
  { label: "∪",    val: "\\cup" },
  { label: "∩",    val: "\\cap" },
  { label: "∈",    val: "\\in" },
  { label: "∉",    val: "\\notin" },
];

// ─── Image dropzone with theme support ────────────────────────────────────────
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
  const [isDragging, setIsDragging] = useState(false);

  const handle = (file: File) => {
    onChange(file);
    const r = new FileReader();
    r.onload = (e) => setPreview(e.target?.result as string);
    r.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) handle(f);
  }, []);

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onClick={() => ref.current?.click()}
      className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 ${
        isDragging 
          ? 'border-[var(--accent)] bg-[var(--accent-bg)]' 
          : 'border-[var(--border2)] hover:border-[var(--accent)] hover:bg-[var(--accent-bg)]/50'
      } ${compact ? 'p-2' : 'p-4'}`}
    >
      {preview ? (
        <div className="relative">
          <img
            src={preview} alt="preview"
            className="max-h-40 mx-auto rounded-lg object-contain"
          />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); setPreview(null); }}
            className="absolute top-2 right-2 p-1 rounded-full bg-[var(--red)] text-white hover:bg-[var(--red-dim)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center gap-2 ${compact ? 'py-2' : 'py-6'}`}>
          <Upload size={compact ? 16 : 20} className="text-[var(--text3)]" />
          <span className="text-xs text-[var(--text2)]">{label}</span>
          {!compact && (
            <span className="text-xs text-[var(--text3)]">drag & drop or click to browse</span>
          )}
        </div>
      )}
      <input
        ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }}
      />
    </div>
  );
}

// ─── Rich text / LaTeX field with theme support ───────────────────────────────
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
  const [showPreview, setShowPreview] = useState(false);

  const insertSnippet = (snippet: string) => {
    onChange(value + `$${snippet}$`);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-[var(--text2)]">{label}</label>
      )}
      
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={`px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1 ${
              mode === "text"
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface2)] text-[var(--text2)] hover:bg-[var(--surface3)]'
            }`}
          >
            <AlignLeft size={12} />
            Text
          </button>
          <button
            type="button"
            onClick={() => setMode("latex")}
            className={`px-3 py-1.5 text-xs font-medium transition-all flex items-center gap-1 ${
              mode === "latex"
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface2)] text-[var(--text2)] hover:bg-[var(--surface3)]'
            }`}
          >
            <FunctionSquare size={12} />
            LaTeX
          </button>
        </div>

        {mode === "latex" && value && (
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] hover:bg-[var(--surface3)] transition-all flex items-center gap-1"
          >
            {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
        )}
      </div>

      {/* Input */}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={mode === "latex" 
            ? "Enter LaTeX: $$\\frac{d}{dx}[x^n]$$ or \\(E = mc^2\\)"
            : placeholder}
          rows={5}
          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] placeholder:text-[var(--text3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all resize-y font-mono text-sm"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={mode === "latex" 
            ? "Enter LaTeX: $E = mc^2$"
            : placeholder}
          className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] placeholder:text-[var(--text3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all font-mono text-sm"
        />
      )}

      {/* Preview */}
      {mode === "latex" && showPreview && value && (
        <div className="p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={14} className="text-[var(--accent)]" />
            <span className="text-xs font-medium text-[var(--text2)]">Live Preview</span>
          </div>
          <div className="p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-mono text-sm text-[var(--accent)]">
            {value}
          </div>
        </div>
      )}

      {/* LaTeX Snippets */}
      {mode === "latex" && (
        <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
          {SNIPPETS.map((snippet) => (
            <button
              key={snippet.label}
              type="button"
              onClick={() => insertSnippet(snippet.val)}
              className="px-2 py-1 text-xs font-mono rounded-md bg-[var(--surface)] border border-[var(--border2)] text-[var(--accent)] hover:bg-[var(--accent-bg)] hover:border-[var(--accent)] transition-all"
              title={snippet.val}
            >
              {snippet.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Option Row Component ─────────────────────────────────────────────────────
function OptionRow({
  index,
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
  const [showImage, setShowImage] = useState(false);
  const letter = String.fromCharCode(65 + index);

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden transition-all hover:border-[var(--border2)]">
      <div className="p-4 flex items-start gap-3">
        {/* Correct Answer Badge */}
        <Controller
          name={`options.${index}.isCorrect`}
          control={control}
          render={({ field }) => (
            <button
              type="button"
              onClick={() => {
                if (!isMultiple) {
                  fields.forEach((_, i) => {
                    if (i !== index) setValue(`options.${i}.isCorrect`, false);
                  });
                }
                field.onChange(!field.value);
              }}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                field.value
                  ? 'bg-[var(--green)] text-white ring-2 ring-[var(--green)] ring-offset-2 ring-offset-[var(--surface)]'
                  : 'bg-[var(--surface2)] text-[var(--text2)] border-2 border-[var(--border2)] hover:border-[var(--accent)]'
              }`}
              title={field.value ? "Correct answer" : "Mark as correct"}
            >
              {field.value ? <CheckCircle2 size={16} /> : letter}
            </button>
          )}
        />

        {/* Option Content */}
        <div className="flex-1 space-y-3">
          <Controller
            name={`options.${index}.text`}
            control={control}
            render={({ field }) => (
              <RichField
                value={field.value}
                onChange={field.onChange}
                placeholder={`Option ${letter}`}
              />
            )}
          />
          
          {errors.options?.[index]?.text && (
            <p className="text-xs text-[var(--red)] flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.options[index]?.text?.message}
            </p>
          )}

          {/* Option Image Toggle */}
          <button
            type="button"
            onClick={() => setShowImage(!showImage)}
            className="text-xs text-[var(--text2)] hover:text-[var(--accent)] transition-colors flex items-center gap-1"
          >
            <ImageIcon size={12} />
            {showImage ? "Remove image" : "Add image to this option"}
          </button>

          {showImage && (
            <ImgDrop
              compact
              value={optionImages[index]}
              onChange={(f) => {
                setOptionImages(prev => {
                  const next = [...prev];
                  next[index] = f;
                  return next;
                });
              }}
              label={`Image for option ${letter}`}
            />
          )}
        </div>

        {/* Remove Option */}
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex-shrink-0 p-2 text-[var(--text2)] hover:text-[var(--red)] hover:bg-[var(--red-bg)] rounded-lg transition-all"
            title="Remove option"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminCreateQuestionPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [selSubject, setSelSubject] = useState("");
  const [selChapter, setSelChapter] = useState("");
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [solutionImage, setSolutionImage] = useState<File | null>(null);
  const [optionImages, setOptionImages] = useState<(File | null)[]>([null, null, null, null]);

  // Fetch data
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetch("/api/subjects").then(r => r.json())
  });

  const { data: chapters } = useQuery({
    queryKey: ["chapters", selSubject],
    queryFn: () => fetch(`/api/chapters?subjectId=${selSubject}`).then(r => r.json()),
    enabled: !!selSubject,
  });

  const { data: subconcepts } = useQuery({
    queryKey: ["subconcepts", selChapter],
    queryFn: () => fetch(`/api/subconcepts?chapterId=${selChapter}`).then(r => r.json()),
    enabled: !!selChapter,
  });

  // Form
  const {
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      marks: 1,
      difficulty: "medium",
      isMultipleAnswer: false,
      solutionType: "none",
      solutionText: "",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const isMultiple = watch("isMultipleAnswer");
  const solutionType = watch("solutionType");

  // Submit
  const onSubmit = async (data: FormData) => {
    // Validate at least one correct answer
    const hasCorrect = data.options.some(o => o.isCorrect);
    if (!hasCorrect) {
      toast({
        title: "Validation Error",
        description: "Please mark at least one correct answer",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Basic fields
      formData.append("subjectId", data.subjectId);
      if (data.chapterId) formData.append("chapterId", data.chapterId);
      if (data.subconceptId) formData.append("subconceptId", data.subconceptId);
      if (data.gradeLevel) formData.append("gradeLevel", data.gradeLevel);
      
      formData.append("question", data.question);
      formData.append("difficulty", data.difficulty);
      formData.append("marks", String(data.marks));
      formData.append("isMultipleAnswer", String(data.isMultipleAnswer));
      formData.append("solutionType", data.solutionType);
      
      // Options as JSON
      formData.append("options", JSON.stringify(
        data.options.map(o => ({ text: o.text, isCorrect: o.isCorrect }))
      ));
      
      // Solution text
      if (data.solutionType === "text" && data.solutionText) {
        formData.append("solutionText", data.solutionText);
      }
      
      // Images
      if (questionImage) formData.append("questionImage", questionImage);
      if (data.solutionType === "image" && solutionImage) {
        formData.append("solutionImage", solutionImage);
      }
      
      // Option images
      optionImages.forEach((img, i) => {
        if (img) formData.append(`optionImage_${i}`, img);
      });

      const res = await fetch("/api/questions", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create question");
      }

      toast({
        title: "Success",
        description: "Question created successfully",
      });

      router.push("/admin/questions");
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const difficultyStyles = {
    easy: "border-[var(--green)] bg-[var(--green-bg)] text-[var(--green)]",
    medium: "border-[var(--amber)] bg-[var(--amber-bg)] text-[var(--amber)]",
    hard: "border-[var(--red)] bg-[var(--red-bg)] text-[var(--red)]",
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] backdrop-blur-lg bg-opacity-80">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/questions"
              className="p-2 rounded-lg hover:bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--text)] transition-all"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text)]">Create New Question</h1>
              <p className="text-sm text-[var(--text2)]">Add a new question to the bank</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/questions"
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text2)] hover:bg-[var(--surface2)] hover:text-[var(--text)] transition-all"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-dim)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Question
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Left Column - Main Content (2/3 width) */}
          <div className="col-span-2 space-y-6">
            {/* Question Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface2)]">
                <h2 className="font-semibold text-[var(--text)]">Question</h2>
              </div>
              <div className="p-6 space-y-4">
                <Controller
                  name="question"
                  control={control}
                  render={({ field }) => (
                    <RichField
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Enter your question here..."
                      multiline
                    />
                  )}
                />
                {errors.question && (
                  <p className="text-sm text-[var(--red)] flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.question.message}
                  </p>
                )}

                <div>
                  <label className="text-sm font-medium text-[var(--text2)] mb-2 block">
                    Question Image (optional)
                  </label>
                  <ImgDrop
                    value={questionImage}
                    onChange={setQuestionImage}
                    label="Upload an image for the question"
                  />
                </div>
              </div>
            </div>

            {/* Options Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface2)] flex items-center justify-between">
                <h2 className="font-semibold text-[var(--text)]">Answer Options</h2>
                <Controller
                  name="isMultipleAnswer"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div
                        onClick={() => field.onChange(!field.value)}
                        className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                          field.value ? 'bg-[var(--accent)]' : 'bg-[var(--border2)]'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                            field.value ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                      <span className="text-sm text-[var(--text2)]">Multiple correct answers (MSQ)</span>
                    </label>
                  )}
                />
              </div>
              <div className="p-6 space-y-4">
                {(errors.options as any)?.message && (
                  <p className="text-sm text-[var(--red)] flex items-center gap-1">
                    <AlertCircle size={14} />
                    {(errors.options as any).message}
                  </p>
                )}

                {fields.map((field, index) => (
                  <OptionRow
                    key={field.id}
                    index={index}
                    control={control}
                    errors={errors}
                    isMultiple={isMultiple}
                    fields={fields}
                    setValue={setValue}
                    optionImages={optionImages}
                    setOptionImages={setOptionImages}
                    onRemove={() => {
                      remove(index);
                      setOptionImages(prev => prev.filter((_, i) => i !== index));
                    }}
                    canRemove={fields.length > 2}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => {
                    append({ text: "", isCorrect: false });
                    setOptionImages(prev => [...prev, null]);
                  }}
                  className="w-full py-3 border-2 border-dashed border-[var(--border2)] rounded-xl text-[var(--text2)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-bg)] transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add Option
                </button>
              </div>
            </div>

            {/* Solution Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface2)]">
                <h2 className="font-semibold text-[var(--text)]">Solution / Explanation</h2>
              </div>
              <div className="p-6 space-y-4">
                <Controller
                  name="solutionType"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { value: "none", label: "None" },
                        { value: "text", label: "Text Solution" },
                        { value: "image", label: "Image Solution" },
                      ].map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            field.value === option.value
                              ? 'bg-[var(--accent)] text-white'
                              : 'border border-[var(--border)] text-[var(--text2)] hover:bg-[var(--surface2)]'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                />

                {solutionType === "text" && (
                  <Controller
                    name="solutionText"
                    control={control}
                    render={({ field }) => (
                      <RichField
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Write the step-by-step solution here..."
                        multiline
                      />
                    )}
                  />
                )}

                {solutionType === "image" && (
                  <div>
                    <label className="text-sm font-medium text-[var(--text2)] mb-2 block">
                      Upload Solution Image
                    </label>
                    <ImgDrop
                      value={solutionImage}
                      onChange={setSolutionImage}
                      label="Upload handwritten solution or diagram"
                    />
                  </div>
                )}

                {solutionType === "none" && (
                  <p className="text-center py-4 text-[var(--text3)]">
                    No solution will be shown to students after submission.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar (1/3 width) */}
          <div className="space-y-6">
            {/* Classification Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden sticky top-24">
              <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface2)]">
                <h2 className="font-semibold text-[var(--text)]">Classification</h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Subject */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text2)]">
                    Subject <span className="text-[var(--red)]">*</span>
                  </label>
                  <Controller
                    name="subjectId"
                    control={control}
                    render={({ field }) => (
                      <select
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          setSelSubject(e.target.value);
                          setValue("chapterId", "");
                          setValue("subconceptId", "");
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                      >
                        <option value="">Select a subject</option>
                        {subjects?.map((s: any) => (
                          <option key={s.id} value={String(s.id)}>{s.name}</option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.subjectId && (
                    <p className="text-xs text-[var(--red)]">{errors.subjectId.message}</p>
                  )}
                </div>

                {/* Chapter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text2)]">
                    Chapter <span className="text-[var(--text3)]">(optional)</span>
                  </label>
                  <Controller
                    name="chapterId"
                    control={control}
                    render={({ field }) => (
                      <select
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e.target.value || undefined);
                          setSelChapter(e.target.value);
                          setValue("subconceptId", "");
                        }}
                        disabled={!selSubject}
                        className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{!selSubject ? "Select subject first" : "No chapter (general)"}</option>
                        {chapters?.map((c: any) => (
                          <option key={c.id} value={String(c.id)}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                {/* Subconcept */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text2)]">
                    Subconcept <span className="text-[var(--text3)]">(optional)</span>
                  </label>
                  <Controller
                    name="subconceptId"
                    control={control}
                    render={({ field }) => (
                      <select
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
                        disabled={!selChapter}
                        className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{!selChapter ? "Select chapter first" : "No specific subconcept"}</option>
                        {subconcepts?.map((sc: any) => (
                          <option key={sc.id} value={String(sc.id)}>{sc.name}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                {/* Grade Level */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text2)]">
                    Grade Level <span className="text-[var(--text3)]">(optional)</span>
                  </label>
                  <Controller
                    name="gradeLevel"
                    control={control}
                    render={({ field }) => (
                      <select
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
                        className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                      >
                        <option value="">Any grade</option>
                        {[6, 7, 8, 9, 10, 11, 12].map(g => (
                          <option key={g} value={String(g)}>Grade {g}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Grading Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface2)]">
                <h2 className="font-semibold text-[var(--text)]">Grading</h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Difficulty */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text2)]">Difficulty</label>
                  <Controller
                    name="difficulty"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-3 gap-2">
                        {(["easy", "medium", "hard"] as const).map(diff => (
                          <button
                            key={diff}
                            type="button"
                            onClick={() => field.onChange(diff)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                              field.value === diff
                                ? difficultyStyles[diff]
                                : 'border border-[var(--border)] text-[var(--text2)] hover:bg-[var(--surface2)]'
                            }`}
                          >
                            {diff}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>

                {/* Marks */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text2)]">Marks</label>
                  <div className="flex items-center gap-2">
                    <Controller
                      name="marks"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                        />
                      )}
                    />
                    <span className="text-[var(--text2)]">points</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface2)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface3)]">
                <h2 className="font-semibold text-[var(--text)] flex items-center gap-2">
                  <HelpCircle size={16} className="text-[var(--accent)]" />
                  Quick Tips
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2 text-[var(--text2)]">
                    <span className="text-[var(--accent)] font-bold">•</span>
                    Subject is required — chapter and subconcept are optional
                  </li>
                  <li className="flex items-start gap-2 text-[var(--text2)]">
                    <span className="text-[var(--accent)] font-bold">•</span>
                    Switch to LaTeX mode for mathematical expressions
                  </li>
                  <li className="flex items-start gap-2 text-[var(--text2)]">
                    <span className="text-[var(--accent)] font-bold">•</span>
                    Click the colored badge to mark correct answer(s)
                  </li>
                  <li className="flex items-start gap-2 text-[var(--text2)]">
                    <span className="text-[var(--accent)] font-bold">•</span>
                    Each option can have its own image attachment
                  </li>
                  <li className="flex items-start gap-2 text-[var(--text2)]">
                    <span className="text-[var(--accent)] font-bold">•</span>
                    Enable MSQ for questions with multiple correct answers
                  </li>
                  <li className="flex items-start gap-2 text-[var(--text2)]">
                    <span className="text-[var(--accent)] font-bold">•</span>
                    Add solution text or image for student reference
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}