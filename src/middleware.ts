import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const PROTECTED = [
  /^\/collection(\/|$)/,
  /^\/settings$/,
  /^\/api\/collections(\/|$)/,
  /^\/api\/wishes(\/|$)/,
  /^\/api\/follows(\/|$)/,
  /^\/api\/users(\/|$)/,
  /^\/api\/scrape$/,
  /^\/api\/profile$/,
  /^\/api\/notifications(\/|$)/,
  /^\/add$/,
];

const SESSION_COOKIES = ["next-auth.session-token", "__Secure-next-auth.session-token"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Mobile app: `Authorization: Bearer <jwt>` → session cookie, so route handlers
  // using getServerSession() work unchanged.
  const auth = req.headers.get("authorization");
  if (pathname.startsWith("/api/") && auth?.startsWith("Bearer ")) {
    const jwt = auth.slice(7).trim();
    const headers = new Headers(req.headers);
    const existing = req.headers.get("cookie");
    const sessionCookies = SESSION_COOKIES.map((name) => `${name}=${jwt}`).join("; ");
    headers.set("cookie", existing ? `${existing}; ${sessionCookies}` : sessionCookies);
    return NextResponse.next({ request: { headers } });
  }

  if (!PROTECTED.some((re) => re.test(pathname))) {
    return NextResponse.next();
  }

  const token = await getToken({ req });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/collection/:path*",
    "/settings",
    "/add",
    "/api/:path*",
  ],
};
