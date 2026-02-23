// app/admin/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BookOpen, 
  Layers,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Theme hook with smooth transitions
function useTheme() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("admin-theme");
    if (saved !== null) {
      setDark(saved === "dark");
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDark(prefersDark);
    }
  }, []);

  const toggle = () => {
    setDark((prev) => {
      const newValue = !prev;
      localStorage.setItem("admin-theme", newValue ? "dark" : "light");
      return newValue;
    });
  };

  return { dark, toggle, mounted };
}

// Theme variables with smooth transitions
const themeVars = (dark: boolean) => ({
  "--bg": dark ? "#0b0e15" : "#f8fafc",
  "--surface": dark ? "#111520" : "#ffffff",
  "--surface2": dark ? "#181d2a" : "#f1f5f9",
  "--surface3": dark ? "#1e2536" : "#e2e8f0",
  "--border": dark ? "#232c40" : "#e2e8f0",
  "--border2": dark ? "#2c3650" : "#cbd5e1",
  "--text": dark ? "#f1f5f9" : "#0f172a",
  "--text2": dark ? "#94a3b8" : "#334155",
  "--text3": dark ? "#475569" : "#64748b",
  "--accent": dark ? "#60a5fa" : "#3b82f6",
  "--accent-bg": dark ? "#1e3a8a20" : "#dbeafe",
  "--accent-dim": dark ? "#2563eb40" : "#bfdbfe",
  "--green": dark ? "#4ade80" : "#22c55e",
  "--green-bg": dark ? "#16653430" : "#dcfce7",
  "--amber": dark ? "#fbbf24" : "#eab308",
  "--amber-bg": dark ? "#854d0e30" : "#fef3c7",
  "--red": dark ? "#f87171" : "#ef4444",
  "--red-bg": dark ? "#991b1b30" : "#fee2e2",
  "--input-bg": dark ? "#0a0d14" : "#ffffff",
  "--shadow": dark ? "0 4px 20px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.08)",
  "--shadow-lg": dark ? "0 10px 40px rgba(0,0,0,0.6)" : "0 10px 40px rgba(0,0,0,0.12)",
});

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subjects", label: "Subjects & Chapters", icon: Layers },
  { href: "/admin/questions", label: "Question Bank", icon: FileText },
  { href: "/admin/exams", label: "Exams", icon: BookOpen },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { dark, toggle, mounted } = useTheme();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  // Prevent flash of incorrect theme
  if (!mounted) {
    return null;
  }

  return (
    <div
      style={themeVars(dark) as React.CSSProperties}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex font-sans transition-all duration-300 ease-in-out"
    >
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } bg-[var(--surface)] border-r border-[var(--border)] z-40 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-4 border-b border-[var(--border)]`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-bg)] border-2 border-[var(--accent)] flex items-center justify-center font-bold text-[var(--accent)] transition-all duration-300">
                A
              </div>
              <div className="transition-opacity duration-300">
                <div className="text-sm font-bold text-[var(--text)]">Admin Portal</div>
                <div className="text-xs text-[var(--text3)]">{session?.user?.username}</div>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-bg)] border-2 border-[var(--accent)] flex items-center justify-center font-bold text-[var(--accent)] transition-all duration-300">
              A
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:block p-1.5 rounded-lg hover:bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--text)] transition-all duration-200"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href}>
                <div
                  className={`flex items-center ${
                    sidebarCollapsed ? 'justify-center' : 'gap-3'
                  } px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer group relative ${
                    active 
                      ? 'bg-[var(--accent-bg)] text-[var(--accent)]' 
                      : 'text-[var(--text2)] hover:bg-[var(--surface2)] hover:text-[var(--text)]'
                  }`}
                  title={sidebarCollapsed ? label : undefined}
                >
                  <Icon size={20} className="transition-transform duration-200 group-hover:scale-110" />
                  {!sidebarCollapsed && (
                    <span className="transition-opacity duration-300">{label}</span>
                  )}
                  {active && !sidebarCollapsed && (
                    <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] space-y-2">
          <button
            onClick={toggle}
            className={`flex items-center ${
              sidebarCollapsed ? 'justify-center' : 'gap-3'
            } w-full px-3 py-2.5 rounded-lg text-sm text-[var(--text2)] hover:bg-[var(--surface2)] hover:text-[var(--text)] transition-all duration-200 group`}
            title={sidebarCollapsed ? "Toggle theme" : undefined}
          >
            {dark ? (
              <Sun size={20} className="transition-transform duration-200 group-hover:rotate-90" />
            ) : (
              <Moon size={20} className="transition-transform duration-200 group-hover:-rotate-12" />
            )}
            {!sidebarCollapsed && (
              <span className="transition-opacity duration-300">
                {dark ? 'Light mode' : 'Dark mode'}
              </span>
            )}
          </button>
          <Link href="/api/auth/signout">
            <div
              className={`flex items-center ${
                sidebarCollapsed ? 'justify-center' : 'gap-3'
              } px-3 py-2.5 rounded-lg text-sm text-[var(--red)] hover:bg-[var(--red-bg)] transition-all duration-200 cursor-pointer group`}
              title={sidebarCollapsed ? "Logout" : undefined}
            >
              <LogOut size={20} className="transition-transform duration-200 group-hover:translate-x-1" />
              {!sidebarCollapsed && <span className="transition-opacity duration-300">Logout</span>}
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-20 backdrop-blur-lg bg-opacity-90">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--text)] transition-all duration-200"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-bg)] border-2 border-[var(--accent)] flex items-center justify-center font-bold text-[var(--accent)]">
              A
            </div>
            <span className="text-sm font-bold text-[var(--accent)]">Admin Portal</span>
          </div>
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--text)] transition-all duration-200"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* Desktop header with breadcrumb */}
        <div className="hidden lg:block sticky top-0 z-20 backdrop-blur-lg bg-[var(--bg)] bg-opacity-80 border-b border-[var(--border)]">
          <div className="px-8 py-4">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/admin" className="text-[var(--text2)] hover:text-[var(--accent)] transition-colors">
                Dashboard
              </Link>
              {pathname !== "/admin" && (
                <>
                  <ChevronRight size={14} className="text-[var(--text3)]" />
                  <span className="text-[var(--text)] capitalize">
                    {pathname.split('/').pop()?.replace(/-/g, ' ')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <main className="min-h-screen bg-[var(--bg)] transition-all duration-300">
          {children}
        </main>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.2s ease-in-out;
        }

        * {
          transition-property: background-color, border-color, color, fill, stroke;
          transition-duration: 200ms;
          transition-timing-function: ease-in-out;
        }
      `}</style>
    </div>
  );
}