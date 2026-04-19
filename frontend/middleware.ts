// middleware.ts — Next.js edge middleware for route protection.
// Runs before every request. If the user has no token cookie and tries to
// access a protected route they are redirected to /login.
// The /login page itself is always public.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that do not require authentication.
const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through unconditionally.
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for the auth token stored as a cookie by the login page.
  const token = request.cookies.get("sentinel_token")?.value;

  if (!token) {
    // Preserve the original destination so we can redirect back after login.
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Apply this middleware to every route except Next.js internals and static files.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
