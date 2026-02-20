// app/page.tsx
import Link from "next/link";
import { Button } from "../components/ui/button";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-300 opacity-30 blur-3xl dark:bg-purple-900"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-300 opacity-30 blur-3xl dark:bg-blue-900"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl md:text-7xl">Exam
          <span className="block text-blue-600 dark:text-blue-400">
            System
          </span>
        </h1>
        
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300 sm:text-xl">
          A comprehensive platform for conducting online examinations with role-based access for students, teachers, and administrators.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link href="/login" passHref>
            <Button 
              size="lg" 
              className="min-w-[200px] bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Student Login
            </Button>
          </Link>
          
          <Link href="/admin/login" passHref>
            <Button 
              variant="outline" 
              size="lg"
              className="min-w-[200px] border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
            >
              Admin Portal
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white/50 p-6 backdrop-blur-sm dark:bg-gray-800/50">
            <div className="mb-4 text-blue-600 dark:text-blue-400">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Secure Exams</h3>
            <p className="text-gray-600 dark:text-gray-300">Take exams in a secure environment with anti-cheating measures</p>
          </div>

          <div className="rounded-lg bg-white/50 p-6 backdrop-blur-sm dark:bg-gray-800/50">
            <div className="mb-4 text-blue-600 dark:text-blue-400">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Timed Tests</h3>
            <p className="text-gray-600 dark:text-gray-300">Complete exams within specified time limits with auto-submit</p>
          </div>

          <div className="rounded-lg bg-white/50 p-6 backdrop-blur-sm dark:bg-gray-800/50">
            <div className="mb-4 text-blue-600 dark:text-blue-400">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Instant Results</h3>
            <p className="text-gray-600 dark:text-gray-300">Get immediate feedback and detailed performance analytics</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 text-sm text-gray-500 dark:text-gray-400">
        © 2026 Online Exam System. All rights reserved.
      </footer>
    </div>
  );
}