import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// MIDDLEWARE DISABILITATA - ACCESSO LIBERO ALLA DASHBOARD
export function middleware(request: NextRequest) {
  // NON FARE NIENTE - LASCIA PASSARE TUTTO
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
