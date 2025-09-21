import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

// Protect dashboard routes: require auth-token cookie
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /dashboard/*
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("auth-token")?.value;
    
    if (!token) {
      console.log("No token found in cookies");
      const url = request.nextUrl.clone();
      url.pathname = "/autenticazione";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Verify token validity
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
      jwt.verify(token, JWT_SECRET);
      console.log("Token verified successfully");
    } catch (error) {
      console.log("Token verification failed:", error);
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
