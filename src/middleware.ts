import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });

  if (!token) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/collection/:path*",
    "/settings",
    "/api/collections/:path*",
    "/api/wishes/:path*",
    "/api/follows/:path*",
    "/api/users/:path*",
    "/api/scrape",
    "/api/profile",
    "/api/notifications/:path*",
    "/add",
  ],
};
