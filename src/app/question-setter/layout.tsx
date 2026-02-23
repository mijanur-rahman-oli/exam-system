// app/question-setter/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sun, Moon, Menu, X, LayoutDashboard,
  ClipboardList, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";

export function useTheme() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const s = localStorage.getItem("portal-theme");
    if (s !== null) {
      setDark(s === "dark");
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDark(prefersDark);
    }
  }, []);

  const toggle = () =>
    setDark((v) => {
      localStorage.setItem("portal-theme", !v ? "dark" : "light");
      return !v;
    });

  return { dark, toggle, mounted };
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
    "--shadow-lg":  "0 10px 40px rgba(0,0,0,0.6)",
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
    "--shadow-lg":  "0 10px 40px rgba(0,0,0,0.12)",
    "--radius":     "0.75rem",
  }) as React.CSSProperties;
}

const NAV = [
  { href: "/question-setter",        label: "Dashboard",    Icon: LayoutDashboard },
  { href: "/question-setter/questions", label: "My Questions", Icon: ClipboardList },
];

export default function QuestionSetterLayout({ children }: { children: React.ReactNode }) {
  const { dark, toggle, mounted } = useTheme();
  const vars = themeVars(dark);
  const pathname = usePathname();
  const [sideOpen, setSideOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => { 
    setSideOpen(false); 
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/question-setter"
      ? pathname === "/question-setter"
      : pathname.startsWith(href);

  // Prevent flash of incorrect theme
  if (!mounted) {
    return null;
  }

  return (
    <div
      style={{
        ...vars,
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        fontFamily: "'Inter', system-ui, sans-serif",
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      {/* Sidebar */}
      <aside
        className="qs-sidebar"
        style={{
          width: sidebarCollapsed ? "80px" : "240px",
          flexShrink: 0,
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0, left: 0,
          height: "100vh",
          zIndex: 40,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: sideOpen ? "translateX(0)" : "translateX(-100%)",
          boxShadow: "var(--shadow)",
        }}
      >
        {/* Logo with collapse button */}
        <div style={{ 
          padding: sidebarCollapsed ? "1.5rem 0.5rem 1rem" : "1.5rem 1.25rem 1rem", 
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: sidebarCollapsed ? "center" : "space-between",
        }}>
          {!sidebarCollapsed && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem",
              transition: "opacity 0.3s ease",
            }}>
              <div style={{
                width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem",
                background: "var(--accent-bg)", border: "1.5px solid var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.9rem", fontWeight: 900, color: "var(--accent)",
                transition: "all 0.3s ease",
              }}>
                Q
              </div>
              <div style={{ transition: "opacity 0.3s ease" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--text)" }}>
                  Question Bank
                </div>
                <div style={{ fontSize: "0.6rem", color: "var(--text3)" }}>
                  Setter Portal
                </div>
              </div>
            </div>
          )}
          
          {sidebarCollapsed && (
            <div style={{
              width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem",
              background: "var(--accent-bg)", border: "1.5px solid var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem", fontWeight: 900, color: "var(--accent)",
              transition: "all 0.3s ease",
            }}>
              Q
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:block"
            style={{
              padding: "0.25rem",
              borderRadius: "0.375rem",
              background: "none",
              border: "none",
              color: "var(--text2)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface2)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "var(--text2)";
            }}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ 
          flex: 1, 
          padding: sidebarCollapsed ? "1rem 0.5rem" : "1rem", 
          display: "flex", 
          flexDirection: "column", 
          gap: "0.25rem" 
        }}>
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: sidebarCollapsed ? "center" : "flex-start",
                    gap: sidebarCollapsed ? "0" : "0.75rem",
                    padding: sidebarCollapsed ? "0.75rem 0" : "0.6rem 0.75rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: active ? 600 : 400,
                    background: active ? "var(--accent-bg)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text2)",
                    border: active ? "1px solid var(--accent-dim)" : "1px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    position: "relative",
                  }}
                  title={sidebarCollapsed ? label : undefined}
                >
                  <Icon size={20} style={{ 
                    transition: "transform 0.2s ease",
                    transform: active ? "scale(1.1)" : "scale(1)",
                  }} />
                  {!sidebarCollapsed && (
                    <span style={{ 
                      transition: "opacity 0.3s ease",
                      opacity: 1,
                    }}>
                      {label}
                    </span>
                  )}
                  {active && !sidebarCollapsed && (
                    <span style={{
                      position: "absolute",
                      right: "0.5rem",
                      width: "0.5rem",
                      height: "0.5rem",
                      borderRadius: "50%",
                      background: "var(--accent)",
                      animation: "pulse 2s infinite",
                    }} />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div style={{ 
          padding: sidebarCollapsed ? "1rem 0.5rem" : "1rem", 
          borderTop: "1px solid var(--border)" 
        }}>
          <button
            onClick={toggle}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
              gap: sidebarCollapsed ? "0" : "0.75rem",
              padding: sidebarCollapsed ? "0.75rem 0" : "0.6rem 0.75rem",
              borderRadius: "0.5rem",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              color: "var(--text2)",
              cursor: "pointer",
              fontSize: "0.85rem",
              width: "100%",
              transition: "all 0.2s ease",
              marginBottom: "0.5rem",
            }}
            title={sidebarCollapsed ? (dark ? "Light mode" : "Dark mode") : undefined}
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
            {!sidebarCollapsed && (
              <span style={{ transition: "opacity 0.3s ease" }}>
                {dark ? "Light mode" : "Dark mode"}
              </span>
            )}
          </button>
          
          <Link href="/api/auth/signout" style={{ textDecoration: "none" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                gap: sidebarCollapsed ? "0" : "0.75rem",
                padding: sidebarCollapsed ? "0.75rem 0" : "0.6rem 0.75rem",
                borderRadius: "0.5rem",
                color: "var(--red)",
                cursor: "pointer",
                fontSize: "0.85rem",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.background = "var(--red-bg)"; 
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.background = "transparent"; 
              }}
              title={sidebarCollapsed ? "Logout" : undefined}
            >
              <LogOut size={20} style={{ transition: "transform 0.2s ease" }} />
              {!sidebarCollapsed && (
                <span style={{ transition: "opacity 0.3s ease" }}>Logout</span>
              )}
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          style={{ 
            position: "fixed", 
            inset: 0, 
            zIndex: 35, 
            background: "rgba(0,0,0,0.45)",
            animation: "fadeIn 0.2s ease",
          }}
        />
      )}

      {/* Main area */}
      <div className="qs-main" style={{ 
        flex: 1, 
        marginLeft: sidebarCollapsed ? "80px" : "240px",
        display: "flex", 
        flexDirection: "column",
        transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {/* Mobile top bar */}
        <div
          className="qs-topbar"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.25rem",
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            position: "sticky",
            top: 0,
            zIndex: 30,
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(var(--surface-rgb), 0.8)",
          }}
        >
          <button
            onClick={() => setSideOpen((v) => !v)}
            style={{ 
              background: "none", 
              border: "none", 
              color: "var(--text)", 
              cursor: "pointer",
              padding: "0.5rem",
              borderRadius: "0.375rem",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            {sideOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent)" }}>
            Question Setter
          </span>
          <button
            onClick={toggle}
            style={{ 
              background: "none", 
              border: "none", 
              color: "var(--text2)", 
              cursor: "pointer",
              padding: "0.5rem",
              borderRadius: "0.375rem",
              transition: "background 0.2s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "none"}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Desktop header with breadcrumb */}
        <div className="hidden lg:block" style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(var(--bg-rgb), 0.8)",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ padding: "1rem 2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
              <Link href="/question-setter" style={{ 
                color: "var(--text2)", 
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}>
                Dashboard
              </Link>
              {pathname !== "/question-setter" && (
                <>
                  <ChevronRight size={14} style={{ color: "var(--text3)" }} />
                  <span style={{ color: "var(--text)", fontWeight: 500 }}>
                    {pathname.split('/').pop()?.replace(/-/g, ' ')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <main style={{ 
          flex: 1, 
          padding: "2rem",
          transition: "padding 0.3s ease",
        }}>
          {children}
        </main>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        
        @media (min-width: 769px) {
          .qs-sidebar { transform: translateX(0) !important; }
        }
        
        @media (max-width: 768px) {
          .qs-sidebar { 
            width: 240px !important;
            transform: translateX(-100%);
          }
          .qs-sidebar.open { transform: translateX(0); }
          .qs-main { 
            margin-left: 0 !important; 
          }
          .qs-topbar { 
            display: flex !important; 
          }
        }

        * {
          transition-property: background-color, border-color, color, fill, stroke, box-shadow, transform;
          transition-duration: 200ms;
          transition-timing-function: ease;
        }
      `}</style>
    </div>
  );
}