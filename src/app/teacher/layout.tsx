"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, Menu, X, LayoutDashboard, PlusCircle, ClipboardList, FileEdit, BarChart2, LogOut } from "lucide-react";
import { useTheme, themeVars } from "@/lib/theme";

const NAV = [
  { href: "/teacher",                  label: "Dashboard",     Icon: LayoutDashboard },
  { href: "/teacher/exams",            label: "Manage Exams",  Icon: ClipboardList   },
  { href: "/teacher/questions/create", label: "Add Question",  Icon: FileEdit        },
  { href: "/teacher/results",          label: "View Results",  Icon: BarChart2       },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { dark, toggle } = useTheme();
  const vars = themeVars(dark);
  const pathname = usePathname();
  const [sideOpen, setSideOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => { setSideOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    href === "/teacher" ? pathname === "/teacher" : pathname.startsWith(href);

  return (
    <div style={{ ...vars, minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex", fontFamily: "'Sora','DM Sans',system-ui,sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: "220px", flexShrink: 0,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0,
        height: "100vh", zIndex: 40,
        transform: sideOpen ? "translateX(0)" : undefined,
        transition: "transform 0.22s ease",
      }}
        className="sidebar-panel"
      >
        {/* Logo */}
        <div style={{
          padding: "1.25rem 1.25rem 1rem",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{
              width: "2rem", height: "2rem", borderRadius: "0.5rem",
              background: "var(--accent-bg)", border: "1.5px solid var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.85rem", fontWeight: 900, color: "var(--accent)",
            }}>T</div>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: "0.05em", color: "var(--text)" }}>
                Teacher
              </div>
              <div style={{ fontSize: "0.6rem", color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Portal
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.75rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} style={{ textDecoration: "none" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: "0.65rem",
                  padding: "0.55rem 0.75rem", borderRadius: "0.5rem",
                  fontSize: "0.8rem", fontWeight: active ? 700 : 500,
                  background: active ? "var(--accent-bg)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text2)",
                  border: active ? "1px solid var(--accent-dim)" : "1px solid transparent",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text)"; } }}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text2)"; } }}
                >
                  <Icon size={15} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: theme + logout */}
        <div style={{ padding: "0.75rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <button
            onClick={toggle}
            style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
              background: "var(--surface2)", border: "1px solid var(--border)",
              color: "var(--text2)", cursor: "pointer", fontSize: "0.78rem",
              width: "100%", transition: "all 0.15s",
            }}
          >
            {dark ? <Sun size={13} /> : <Moon size={13} />}
            {dark ? "Light mode" : "Dark mode"}
          </button>
          <Link href="/api/auth/signout" style={{ textDecoration: "none" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.6rem",
              padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
              color: "var(--red)", cursor: "pointer", fontSize: "0.78rem",
              transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red-bg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <LogOut size={13} />
              Logout
            </div>
          </Link>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 35,
            background: "rgba(0,0,0,0.45)",
          }}
        />
      )}

      {/* ── Main ── */}
      <div style={{ flex: 1, marginLeft: "220px", minHeight: "100vh", display: "flex", flexDirection: "column" }} className="main-body">
        {/* Top bar (mobile) */}
        <div style={{
          display: "none", alignItems: "center", justifyContent: "space-between",
          padding: "0.75rem 1.25rem",
          background: "var(--surface)", borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0, zIndex: 30,
        }} className="mobile-topbar">
          <button
            onClick={() => setSideOpen(v => !v)}
            style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer" }}
          >
            {sideOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent)" }}>Teacher Portal</span>
          <button onClick={toggle} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <main style={{ flex: 1, padding: "2rem 2rem" }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-panel { transform: translateX(-100%); }
          .sidebar-panel.open { transform: translateX(0); }
          .main-body { margin-left: 0 !important; }
          .mobile-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}