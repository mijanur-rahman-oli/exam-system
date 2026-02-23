// app/question-setter/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sun, Moon, Menu, X, LayoutDashboard,
  ClipboardList, LogOut,
} from "lucide-react";

export function useTheme() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const s = localStorage.getItem("portal-theme");
    if (s !== null) setDark(s === "dark");
  }, []);
  const toggle = () =>
    setDark((v) => {
      localStorage.setItem("portal-theme", !v ? "dark" : "light");
      return !v;
    });
  return { dark, toggle };
}

export function themeVars(dark: boolean): React.CSSProperties {
  return (dark ? {
    "--bg":         "#0b0e15",
    "--surface":    "#111520",
    "--surface2":   "#181d2a",
    "--surface3":   "#1e2536",
    "--border":     "#232c40",
    "--border2":    "#2c3650",
    "--text":       "#e2e8f4",
    "--text2":      "#7d8fac",
    "--text3":      "#3e4f6a",
    "--accent":     "#4f8ef7",
    "--accent-bg":  "#0c1e3d",
    "--accent-dim": "#172d56",
    "--green":      "#34d399",
    "--green-bg":   "#042b1a",
    "--amber":      "#fbbf24",
    "--amber-bg":   "#1f1200",
    "--red":        "#f87171",
    "--red-bg":     "#1f0808",
    "--input-bg":   "#090c13",
    "--shadow":     "0 4px 24px rgba(0,0,0,0.5)",
    "--radius":     "0.75rem",
  } : {
    "--bg":         "#eef1f8",
    "--surface":    "#ffffff",
    "--surface2":   "#f4f6fc",
    "--surface3":   "#eaecf5",
    "--border":     "#dce1ef",
    "--border2":    "#c8d0e4",
    "--text":       "#1a2035",
    "--text2":      "#52637d",
    "--text3":      "#a0aec0",
    "--accent":     "#2563eb",
    "--accent-bg":  "#eff4ff",
    "--accent-dim": "#dbeafe",
    "--green":      "#059669",
    "--green-bg":   "#ecfdf5",
    "--amber":      "#d97706",
    "--amber-bg":   "#fffbeb",
    "--red":        "#dc2626",
    "--red-bg":     "#fef2f2",
    "--input-bg":   "#f8f9fd",
    "--shadow":     "0 4px 24px rgba(0,0,0,0.07)",
    "--radius":     "0.75rem",
  }) as React.CSSProperties;
}

const NAV = [
  { href: "/question-setter",        label: "Dashboard",    Icon: LayoutDashboard },
  { href: "/question-setter/questions", label: "My Questions", Icon: ClipboardList },
];

export default function QuestionSetterLayout({ children }: { children: React.ReactNode }) {
  const { dark, toggle } = useTheme();
  const vars = themeVars(dark);
  const pathname = usePathname();
  const [sideOpen, setSideOpen] = useState(false);

  useEffect(() => { setSideOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    href === "/question-setter"
      ? pathname === "/question-setter"
      : pathname.startsWith(href);

  return (
    <div
      style={{
        ...vars,
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        className="qs-sidebar"
        style={{
          width: "240px",
          flexShrink: 0,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0, left: 0,
          height: "100vh",
          zIndex: 40,
          transition: "transform 0.22s ease",
          transform: sideOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem",
              background: "var(--accent-bg)", border: "1.5px solid var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.9rem", fontWeight: 900, color: "var(--accent)",
            }}>Q</div>
            <div>
              <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--text)" }}>
                Question Bank
              </div>
              <div style={{ fontSize: "0.6rem", color: "var(--text3)" }}>
                Setter Portal
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.6rem 0.75rem", borderRadius: "0.5rem",
                    fontSize: "0.85rem", fontWeight: active ? 600 : 400,
                    background: active ? "var(--accent-bg)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text2)",
                    border: active ? "1px solid var(--accent-dim)" : "1px solid transparent",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <Icon size={16} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "1rem", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={toggle}
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.6rem 0.75rem", borderRadius: "0.5rem",
              background: "var(--surface2)", border: "1px solid var(--border)",
              color: "var(--text2)", cursor: "pointer", fontSize: "0.85rem",
              width: "100%", transition: "all 0.15s", marginBottom: "0.5rem",
            }}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? "Light mode" : "Dark mode"}
          </button>
          <Link href="/api/auth/signout" style={{ textDecoration: "none" }}>
            <div
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.6rem 0.75rem", borderRadius: "0.5rem",
                color: "var(--red)", cursor: "pointer", fontSize: "0.85rem",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red-bg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <LogOut size={16} /> Logout
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 35, background: "rgba(0,0,0,0.45)" }}
        />
      )}

      {/* Main area */}
      <div className="qs-main" style={{ flex: 1, marginLeft: "240px", display: "flex", flexDirection: "column" }}>
        {/* Mobile top bar */}
        <div
          className="qs-topbar"
          style={{
            display: "none", alignItems: "center", justifyContent: "space-between",
            padding: "0.75rem 1.25rem",
            background: "var(--surface)", borderBottom: "1px solid var(--border)",
            position: "sticky", top: 0, zIndex: 30,
          }}
        >
          <button
            onClick={() => setSideOpen((v) => !v)}
            style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer" }}
          >
            {sideOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent)" }}>
            Question Setter
          </span>
          <button
            onClick={toggle}
            style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer" }}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <main style={{ flex: 1, padding: "2rem" }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .qs-sidebar { transform: translateX(0) !important; }
        }
        @media (max-width: 768px) {
          .qs-sidebar { transform: translateX(-100%); }
          .qs-sidebar.open { transform: translateX(0); }
          .qs-main     { margin-left: 0 !important; }
          .qs-topbar   { display: flex !important; }
        }
      `}</style>
    </div>
  );
}