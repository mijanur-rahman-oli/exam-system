import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "student") redirect("/login");

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-purple-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-purple-700">
          <h2 className="text-lg font-bold">Student Portal</h2>
          <p className="text-sm text-purple-300 truncate">{session.user.username}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: "/student", label: "Dashboard" },
            { href: "/student/results", label: "My Results" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 rounded-md text-sm hover:bg-purple-700 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-purple-700">
          <Link href="/api/auth/signout" className="text-sm text-purple-300 hover:text-white transition-colors">
            Sign Out
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">{children}</main>
    </div>
  );
}