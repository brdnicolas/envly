import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createMobileToken } from "@/lib/mobile-token";

// Browser-based mobile sign-in (Google or email), opened by the app in an
// ASWebAuthenticationSession / Custom Tab:
//   1. no web session yet → send the user to /signin, coming back here afterwards
//   2. web session → mint a mobile token and hand it to the app via envly://auth
// Only the app's own scheme is ever used as a redirect target.

const APP_CALLBACK = "envly://auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const state = url.searchParams.get("state") ?? "";

  if (!/^[A-Za-z0-9_-]{16,128}$/.test(state)) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    const signIn = new URL("/signin", url.origin);
    signIn.searchParams.set("callbackUrl", `${url.pathname}${url.search}`);
    return NextResponse.redirect(signIn);
  }

  const token = await createMobileToken({
    id: userId,
    email: session.user?.email ?? null,
    name: session.user?.name ?? null,
    image: session.user?.image ?? null,
  });

  const callback = new URL(APP_CALLBACK);
  callback.searchParams.set("token", token);
  callback.searchParams.set("state", state);
  return NextResponse.redirect(callback.toString());
}
