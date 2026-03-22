"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeft, Download, BookOpen, Clock, Trophy, CheckCircle } from "lucide-react";

// ─── KaTeX screen renderer ────────────────────────────────────────────────────
function KaTeXDisplay({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current || !text) return;
    import("katex").then((katex) => {
      let html = text
        .replace(/\$\$(.+?)\$\$/gs, (_, expr) => {
          try { return katex.default.renderToString(expr, { displayMode: true, throwOnError: false }); }
          catch { return _; }
        })
        .replace(/\$(.+?)\$/g, (_, expr) => {
          try { return katex.default.renderToString(expr, { displayMode: false, throwOnError: false }); }
          catch { return _; }
        });
      if (ref.current) ref.current.innerHTML = html;
    });
  }, [text]);
  return <span ref={ref} style={{ fontSize: "inherit", lineHeight: "inherit", color: "inherit" }} />;
}

// ─── Strip LaTeX delimiters for plain print text ──────────────────────────────
function stripLatex(text: string): string {
  return text
    .replace(/\$\$(.+?)\$\$/gs, (_, e) => e)
    .replace(/\$(.+?)\$/g, (_, e) => e);
}

export default function AdminViewExamPage() {
  const { id } = useParams<{ id: string }>();

  const { data: exam, isLoading } = useQuery({
    queryKey: ["admin-exam", id],
    queryFn: async () => {
      const res = await fetch(`/api/exams/${id}`);
      if (!res.ok) throw new Error("Failed to fetch exam");
      return res.json();
    },
  });

  // ── Open a new window with clean HTML and trigger print ───────────────────
  const handleDownloadPDF = () => {
    if (!exam) return;
    const questions = exam.examQuestions ?? [];

    const questionsHtml = questions.map((eq: any, idx: number) => {
      const q = eq.question;
      const opts = [
        { key: "A", text: q?.optionA, img: q?.optionAImage },
        { key: "B", text: q?.optionB, img: q?.optionBImage },
        { key: "C", text: q?.optionC, img: q?.optionCImage },
        { key: "D", text: q?.optionD, img: q?.optionDImage },
      ].filter(o => o.text || o.img);

      const optionsHtml = opts.map(opt => `
        <div style="display:flex;gap:6px;align-items:flex-start;font-size:13px;line-height:1.6;margin-bottom:4px;">
          <span style="font-weight:bold;flex-shrink:0;">(${opt.key})</span>
          <div>
            ${opt.text ? `<span>${stripLatex(opt.text)}</span>` : ""}
            ${opt.img ? `<img src="${opt.img}" style="max-height:80px;max-width:100%;object-fit:contain;display:block;margin-top:4px;border:1px solid #ddd;" />` : ""}
          </div>
        </div>
      `).join("");

      return `
        <div style="margin-bottom:20px;page-break-inside:avoid;">
          <div style="display:flex;gap:6px;margin-bottom:6px;">
            <span style="font-weight:bold;font-size:14px;flex-shrink:0;">Q${idx + 1}.</span>
            <div style="flex:1;">
              <span style="font-size:14px;line-height:1.6;">${stripLatex(q?.question ?? "")}</span>
              <span style="float:right;font-size:12px;color:#555;font-weight:bold;">[${eq.marks} Mark${eq.marks !== 1 ? "s" : ""}]</span>
            </div>
          </div>
          ${q?.questionImage ? `<img src="${q.questionImage}" style="max-height:160px;max-width:60%;object-fit:contain;display:block;margin:6px 0 10px 22px;border:1px solid #ddd;" />` : ""}
          ${opts.length > 0 ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;padding-left:22px;">${optionsHtml}</div>` : ""}
        </div>
      `;
    }).join("");

    const totalMarks = exam.totalMarks ?? questions.reduce((s: number, q: any) => s + q.marks, 0);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${exam.examName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13px;
      color: #000;
      background: #fff;
      padding: 20mm 18mm;
    }
    @page { size: A4 portrait; margin: 0; }
    @media print {
      body { padding: 18mm; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:16px;">
    <h1 style="font-size:20px;font-weight:bold;text-align:center;margin-bottom:6px;">${exam.examName}</h1>
    <div style="display:flex;justify-content:space-between;font-size:12px;color:#333;flex-wrap:wrap;gap:8px;">
      <span><strong>Subject:</strong> ${exam.subject?.name ?? "—"}</span>
      <span><strong>Duration:</strong> ${exam.duration} minutes</span>
      <span><strong>Total Marks:</strong> ${totalMarks}</span>
      ${exam.gradeLevel ? `<span><strong>Grade:</strong> ${exam.gradeLevel}</span>` : ""}
    </div>
    ${exam.description ? `<p style="font-size:11px;color:#555;margin-top:5px;font-style:italic;text-align:center;">${exam.description}</p>` : ""}
  </div>

  <!-- Instructions -->
  <div style="margin-bottom:16px;padding:7px 10px;border:1px solid #bbb;font-size:11px;color:#333;">
    <strong>Instructions:</strong> Answer all questions. Each question carries the marks indicated.
    ${exam.passingMarks ? ` Minimum passing marks: ${exam.passingMarks}.` : ""}
    Time allowed: ${exam.duration} minutes.
  </div>

  <!-- Questions -->
  ${questionsHtml}

  <!-- Footer -->
  <div style="margin-top:36px;border-top:1px solid #ccc;padding-top:8px;font-size:11px;color:#666;display:flex;justify-content:space-between;">
    <span>— End of Question Paper —</span>
    <span>Total: ${totalMarks} Marks</span>
  </div>

  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  if (isLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "1rem" }}>
      <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!exam || exam.error) return (
    <div style={{ padding: "2rem", color: "var(--red)" }}>Exam not found.</div>
  );

  const questions = exam.examQuestions ?? [];
  const diffColor: Record<string, string> = {
    easy:   "var(--green)",
    medium: "var(--amber)",
    hard:   "var(--red)",
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />

      <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <Link href="/admin/exams">
              <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", display: "flex", padding: "0.25rem" }}>
                <ArrowLeft size={18} />
              </button>
            </Link>
            <div>
              <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>{exam.examName}</h1>
              <p style={{ fontSize: "0.78rem", color: "var(--text3)", margin: 0 }}>
                {exam.subject?.name} · {questions.length} questions · {exam.totalMarks ?? 0} marks
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href={`/admin/exams/${id}/edit`}>
              <button style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "var(--accent-bg)", border: "1px solid var(--accent)", color: "var(--accent)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
                Edit Exam
              </button>
            </Link>
            <button
              onClick={handleDownloadPDF}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1.1rem", borderRadius: "0.5rem", background: "var(--accent)", border: "none", color: "#fff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}
            >
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
          {[
            { label: "Questions", value: questions.length,       Icon: BookOpen, color: "var(--accent)", bg: "var(--accent-bg)" },
            { label: "Duration",  value: `${exam.duration} min`, Icon: Clock,    color: "var(--amber)",  bg: "var(--amber-bg)"  },
            { label: "Marks",     value: exam.totalMarks ?? 0,   Icon: Trophy,   color: "var(--green)",  bg: "var(--green-bg)"  },
          ].map(({ label, value, Icon, color, bg }) => (
            <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.1rem 1.25rem", display: "flex", gap: "0.875rem", alignItems: "center" }}>
              <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={15} color={color} />
              </div>
              <div>
                <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--text)", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text3)", marginTop: "0.15rem" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Screen preview of question paper */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "2rem" }}>
          <div style={{ borderBottom: "2px solid var(--text)", paddingBottom: "10px", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, textAlign: "center", color: "var(--text)", margin: "0 0 6px" }}>{exam.examName}</h2>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text2)", flexWrap: "wrap", gap: "0.5rem" }}>
              <span><strong>Subject:</strong> {exam.subject?.name}</span>
              <span><strong>Duration:</strong> {exam.duration} min</span>
              <span><strong>Total Marks:</strong> {exam.totalMarks}</span>
              {exam.gradeLevel && <span><strong>Grade:</strong> {exam.gradeLevel}</span>}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {questions.map((eq: any, idx: number) => {
              const q = eq.question;
              const opts = [
                { key: "A", text: q?.optionA, img: q?.optionAImage },
                { key: "B", text: q?.optionB, img: q?.optionBImage },
                { key: "C", text: q?.optionC, img: q?.optionCImage },
                { key: "D", text: q?.optionD, img: q?.optionDImage },
              ].filter(o => o.text || o.img);

              return (
                <div key={eq.id} style={{ paddingBottom: "1.25rem", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <span style={{ fontWeight: 800, color: "var(--accent)", flexShrink: 0 }}>Q{idx + 1}.</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "var(--text)" }}>
                        <KaTeXDisplay text={q?.question ?? ""} />
                      </div>
                      <span style={{ float: "right", fontSize: "0.72rem", color: "var(--text3)", fontWeight: 700 }}>
                        [{eq.marks} mark{eq.marks !== 1 ? "s" : ""}]
                      </span>
                    </div>
                  </div>
                  {q?.questionImage && (
                    <img src={q.questionImage} alt="" style={{ maxHeight: "160px", maxWidth: "60%", objectFit: "contain", display: "block", margin: "0 0 0.75rem 1.5rem", borderRadius: "0.375rem", border: "1px solid var(--border)" }} />
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1.5rem", paddingLeft: "1.5rem" }}>
                    {opts.map(opt => (
                      <div key={opt.key} style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start", fontSize: "0.85rem", color: "var(--text2)" }}>
                        <span style={{ fontWeight: 700, flexShrink: 0, color: "var(--text3)" }}>({opt.key})</span>
                        <div>
                          {opt.text && <KaTeXDisplay text={opt.text} />}
                          {opt.img && <img src={opt.img} alt={`option ${opt.key}`} style={{ maxHeight: "80px", maxWidth: "100%", objectFit: "contain", display: "block", marginTop: "4px", borderRadius: "0.25rem", border: "1px solid var(--border)" }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "0.4rem", paddingLeft: "1.5rem" }}>
                    <span style={{ fontSize: "0.65rem", color: diffColor[q?.difficulty] ?? "var(--text3)", fontWeight: 600 }}>{q?.difficulty}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Answer key */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle size={14} color="var(--green)" />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Answer Key (Admin Only)</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                  {["Q#", "Question", "Correct Answer", "Marks", "Difficulty"].map(h => (
                    <th key={h} style={{ padding: "0.625rem 1.1rem", textAlign: "left", fontSize: "0.65rem", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {questions.map((eq: any, idx: number) => (
                  <tr key={eq.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1.1rem", fontWeight: 700, color: "var(--text3)" }}>{idx + 1}</td>
                    <td style={{ padding: "0.75rem 1.1rem", color: "var(--text)", maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {eq.question?.question}
                    </td>
                    <td style={{ padding: "0.75rem 1.1rem" }}>
                      <span style={{ fontWeight: 800, color: "var(--green)", background: "var(--green-bg)", padding: "0.2rem 0.6rem", borderRadius: "0.375rem", fontSize: "0.82rem" }}>
                        {eq.question?.correctAnswer}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1.1rem", color: "var(--text)" }}>{eq.marks}</td>
                    <td style={{ padding: "0.75rem 1.1rem" }}>
                      <span style={{ fontSize: "0.72rem", color: diffColor[eq.question?.difficulty] ?? "var(--text3)", fontWeight: 600 }}>
                        {eq.question?.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}