import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protect dashboard routes: require auth-token cookie
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /dashboard/*
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/autenticazione";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
