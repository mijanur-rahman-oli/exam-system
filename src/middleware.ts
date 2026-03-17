import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/teacher") && token?.role !== "teacher") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/student") && token?.role !== "student") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/question-setter") && token?.role !== "question_setter") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // /exam/* is intentionally NOT in the matcher below, so it's always public.
      // withAuth's authorized callback only runs for matched paths.
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/question-setter/:path*",
    "/dashboard/:path*",
    // NOTE: /exam/:path* is deliberately excluded — public access for exam links
  ],
};