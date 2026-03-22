"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, BookOpen, Layers, ChevronRight, FileText, X } from "lucide-react";

// ─── Reusable inline modal ────────────────────────────────────────────────────
function Modal({ title, onClose, onSubmit, loading, children }: {
  title: string; onClose: () => void; onSubmit: () => void;
  loading: boolean; children: React.ReactNode;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem", width: "100%", maxWidth: "420px", boxShadow: "var(--shadow)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {children}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem", justifyContent: "flex-end" }}>
          <button onClick={onClose}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "none", color: "var(--text2)", cursor: "pointer", fontSize: "0.82rem" }}>
            Cancel
          </button>
          <button onClick={onSubmit} disabled={loading}
            style={{ padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: "none", background: "var(--accent)", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "0.82rem", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  width: "100%", height: "2.25rem", padding: "0 0.75rem", borderRadius: "0.5rem",
  border: "1.5px solid var(--border)", background: "var(--input-bg)", color: "var(--text)",
  fontSize: "0.82rem", outline: "none", boxSizing: "border-box",
};
const ta: React.CSSProperties = { ...inp, height: "auto", padding: "0.5rem 0.75rem", resize: "vertical" as any };
const lbl: React.CSSProperties = { fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" };

export default function AdminSubjectsPage() {
  const { toast } = useToast();
  const [selectedSubject,  setSelectedSubject]  = useState<any>(null);
  const [selectedChapter,  setSelectedChapter]  = useState<any>(null);
  const [showSubjectModal, setShowSubjectModal]  = useState(false);
  const [showChapterModal, setShowChapterModal]  = useState(false);
  const [showSubModal,     setShowSubModal]      = useState(false);
  const [subjectName,  setSubjectName]  = useState("");
  const [subjectDesc,  setSubjectDesc]  = useState("");
  const [chapterName,  setChapterName]  = useState("");
  const [chapterDesc,  setChapterDesc]  = useState("");
  const [subName,      setSubName]      = useState("");
  const [subDesc,      setSubDesc]      = useState("");

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: subjects, refetch: refetchSubjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: async () => {
      const res = await fetch("/api/subjects");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: chapters, refetch: refetchChapters, isLoading: chaptersLoading } = useQuery({
    queryKey: ["admin-chapters", selectedSubject?.id],
    queryFn: async () => {
      const res = await fetch(`/api/chapters?subjectId=${selectedSubject.id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedSubject?.id,
  });

  const { data: subconcepts, refetch: refetchSubs, isLoading: subsLoading } = useQuery({
    queryKey: ["admin-subconcepts", selectedChapter?.id],
    queryFn: async () => {
      const res = await fetch(`/api/subconcepts?chapterId=${selectedChapter.id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedChapter?.id,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createSubject = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/subjects", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: subjectName.trim(), description: subjectDesc.trim() || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      return d;
    },
    onSuccess: () => {
      toast({ title: "Subject created" });
      setShowSubjectModal(false); setSubjectName(""); setSubjectDesc("");
      refetchSubjects();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSubject = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
    },
    onSuccess: () => {
      toast({ title: "Subject deleted" });
      setSelectedSubject(null); setSelectedChapter(null);
      refetchSubjects();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createChapter = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/chapters", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId: selectedSubject.id, name: chapterName.trim(), description: chapterDesc.trim() || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      return d;
    },
    onSuccess: () => {
      toast({ title: "Chapter created" });
      setShowChapterModal(false); setChapterName(""); setChapterDesc("");
      refetchChapters();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteChapter = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/chapters/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
    },
    onSuccess: () => {
      toast({ title: "Chapter deleted" });
      setSelectedChapter(null); refetchChapters();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createSub = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/subconcepts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: selectedChapter.id, name: subName.trim(), description: subDesc.trim() || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      return d;
    },
    onSuccess: () => {
      toast({ title: "Subconcept created" });
      setShowSubModal(false); setSubName(""); setSubDesc("");
      refetchSubs();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSub = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/subconcepts/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
    },
    onSuccess: () => { toast({ title: "Subconcept deleted" }); refetchSubs(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const stats = [
    { label: "Subjects",  value: subjects?.length ?? 0,                                                                   Icon: BookOpen, color: "var(--accent)", bg: "var(--accent-bg)" },
    { label: "Chapters",  value: subjects?.reduce((a: number, s: any) => a + (s._count?.chapters  || 0), 0) ?? 0,         Icon: Layers,   color: "var(--green)",  bg: "var(--green-bg)"  },
    { label: "Questions", value: subjects?.reduce((a: number, s: any) => a + (s._count?.questions || 0), 0) ?? 0,         Icon: FileText, color: "var(--amber)",  bg: "var(--amber-bg)"  },
  ];

  const colHeader = (title: React.ReactNode, onAdd?: () => void) => (
    <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text)" }}>{title}</span>
      {onAdd && (
        <button onClick={onAdd}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", display: "flex", padding: "0.25rem", borderRadius: "0.375rem", transition: "all 0.12s" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-bg)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.background = "none"; }}>
          <Plus size={16} />
        </button>
      )}
    </div>
  );

  const emptyState = (msg: string) => (
    <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text3)", fontSize: "0.82rem" }}>{msg}</div>
  );

  const spinner = () => (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <div style={{ width: "1.5rem", height: "1.5rem", border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Modals */}
      {showSubjectModal && (
        <Modal title="New Subject" onClose={() => setShowSubjectModal(false)}
          onSubmit={() => subjectName.trim() && createSubject.mutate()} loading={createSubject.isPending}>
          <div><label style={lbl}>Name *</label>
            <input value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g. Mathematics" style={inp}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")} />
          </div>
          <div><label style={lbl}>Description</label>
            <textarea value={subjectDesc} onChange={e => setSubjectDesc(e.target.value)} rows={2} placeholder="Optional" style={ta}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")} />
          </div>
        </Modal>
      )}

      {showChapterModal && (
        <Modal title={`New Chapter in "${selectedSubject?.name}"`} onClose={() => setShowChapterModal(false)}
          onSubmit={() => chapterName.trim() && createChapter.mutate()} loading={createChapter.isPending}>
          <div><label style={lbl}>Name *</label>
            <input value={chapterName} onChange={e => setChapterName(e.target.value)} placeholder="e.g. Algebra" style={inp}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")} />
          </div>
          <div><label style={lbl}>Description</label>
            <textarea value={chapterDesc} onChange={e => setChapterDesc(e.target.value)} rows={2} placeholder="Optional" style={ta}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")} />
          </div>
        </Modal>
      )}

      {showSubModal && (
        <Modal title={`New Subconcept in "${selectedChapter?.name}"`} onClose={() => setShowSubModal(false)}
          onSubmit={() => subName.trim() && createSub.mutate()} loading={createSub.isPending}>
          <div><label style={lbl}>Name *</label>
            <input value={subName} onChange={e => setSubName(e.target.value)} placeholder="e.g. Linear Equations" style={inp}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")} />
          </div>
          <div><label style={lbl}>Description</label>
            <textarea value={subDesc} onChange={e => setSubDesc(e.target.value)} rows={2} placeholder="Optional" style={ta}
              onFocus={e => (e.target.style.borderColor = "var(--accent)")} onBlur={e => (e.target.style.borderColor = "var(--border)")} />
          </div>
        </Modal>
      )}

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>Academic Hierarchy</h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text2)", marginTop: "0.25rem" }}>Manage subjects, chapters and subconcepts</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
        {stats.map(({ label, value, Icon, color, bg }) => (
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

      {/* 3-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>

        {/* Subjects */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {colHeader("Subjects", () => setShowSubjectModal(true))}
          {subjectsLoading ? spinner() : !subjects?.length ? emptyState("No subjects yet. Click + to add one.") : (
            subjects.map((s: any) => (
              <div key={s.id} onClick={() => { setSelectedSubject(s); setSelectedChapter(null); }}
                style={{ padding: "0.875rem 1.25rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", background: selectedSubject?.id === s.id ? "var(--accent-bg)" : "transparent", transition: "background 0.12s" }}
                onMouseEnter={e => { if (selectedSubject?.id !== s.id) e.currentTarget.style.background = "var(--surface2)"; }}
                onMouseLeave={e => { if (selectedSubject?.id !== s.id) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
                  <BookOpen size={14} color={selectedSubject?.id === s.id ? "var(--accent)" : "var(--text3)"} />
                  <span style={{ fontSize: "0.82rem", color: selectedSubject?.id === s.id ? "var(--accent)" : "var(--text)", fontWeight: selectedSubject?.id === s.id ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); if (confirm(`Delete "${s.name}"?`)) deleteSubject.mutate(s.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: "0.2rem", borderRadius: "0.25rem", flexShrink: 0, transition: "color 0.12s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Chapters */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {colHeader(
            selectedSubject
              ? <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>{selectedSubject.name} <ChevronRight size={13} style={{ color: "var(--text3)" }} /> Chapters</span>
              : "Chapters",
            selectedSubject ? () => setShowChapterModal(true) : undefined
          )}
          {!selectedSubject ? emptyState("Select a subject") :
           chaptersLoading ? spinner() :
           !chapters?.length ? emptyState("No chapters yet. Click + to add one.") : (
            chapters.map((c: any) => (
              <div key={c.id} onClick={() => setSelectedChapter(c)}
                style={{ padding: "0.875rem 1.25rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", background: selectedChapter?.id === c.id ? "var(--accent-bg)" : "transparent", transition: "background 0.12s" }}
                onMouseEnter={e => { if (selectedChapter?.id !== c.id) e.currentTarget.style.background = "var(--surface2)"; }}
                onMouseLeave={e => { if (selectedChapter?.id !== c.id) e.currentTarget.style.background = "transparent"; }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
                  <Layers size={14} color={selectedChapter?.id === c.id ? "var(--accent)" : "var(--text3)"} />
                  <span style={{ fontSize: "0.82rem", color: selectedChapter?.id === c.id ? "var(--accent)" : "var(--text)", fontWeight: selectedChapter?.id === c.id ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); if (confirm(`Delete "${c.name}"?`)) deleteChapter.mutate(c.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: "0.2rem", borderRadius: "0.25rem", flexShrink: 0, transition: "color 0.12s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Subconcepts */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
          {colHeader(
            selectedChapter
              ? <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>{selectedChapter.name} <ChevronRight size={13} style={{ color: "var(--text3)" }} /> Subconcepts</span>
              : "Subconcepts",
            selectedChapter ? () => setShowSubModal(true) : undefined
          )}
          {!selectedChapter ? emptyState("Select a chapter") :
           subsLoading ? spinner() :
           !subconcepts?.length ? emptyState("No subconcepts yet. Click + to add one.") : (
            subconcepts.map((sc: any) => (
              <div key={sc.id}
                style={{ padding: "0.875rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", transition: "background 0.12s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <span style={{ fontSize: "0.82rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sc.name}</span>
                <button onClick={() => { if (confirm(`Delete "${sc.name}"?`)) deleteSub.mutate(sc.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: "0.2rem", borderRadius: "0.25rem", flexShrink: 0, transition: "color 0.12s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}