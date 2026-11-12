import { NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { createMobileToken, MOBILE_TOKEN_MAX_AGE } from "@/lib/mobile-token";

// Native "Sign in with Apple" from the iOS app.
// The app sends the identity token Apple gave it; we verify it against Apple's public keys,
// then find (or create) the matching user and return the same mobile JWT as the other sign-in methods.
//
// Account matching, in order:
//   1. an Account row (provider "apple", providerAccountId = Apple's stable user id `sub`)
//   2. an existing user with the same verified email (e.g. signed up with Google first) → linked
//   3. otherwise a new user. Apple sends the name only on the very first authorization, from the device.

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_KEYS = createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`));
/** iOS bundle id: the `aud` of tokens issued to the native app. */
const AUDIENCE = process.env.APPLE_BUNDLE_ID ?? "fr.envly.app";

type AppleClaims = { sub: string; email?: string; email_verified?: boolean | "true" | "false" };

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const identityToken: unknown = body.identityToken;
  if (typeof identityToken !== "string" || !identityToken) {
    return NextResponse.json({ error: "identityToken required" }, { status: 400 });
  }

  let claims: AppleClaims;
  try {
    const { payload } = await jwtVerify(identityToken, APPLE_KEYS, { issuer: APPLE_ISSUER, audience: AUDIENCE });
    claims = payload as unknown as AppleClaims;
  } catch {
    return NextResponse.json({ error: "Invalid Apple token" }, { status: 401 });
  }

  const appleId = claims.sub;
  const verified = claims.email_verified === true || claims.email_verified === "true";
  const email = verified && claims.email ? claims.email.toLowerCase() : null;
  const name = cleanName(body.fullName);

  let user = (
    await prisma.account.findUnique({
      where: { provider_providerAccountId: { provider: "apple", providerAccountId: appleId } },
      select: { user: true },
    })
  )?.user;

  if (!user) {
    const existing = email ? await prisma.user.findUnique({ where: { email } }) : null;
    user =
      existing ??
      (await prisma.user.create({
        data: { email, name, emailVerified: email ? new Date() : null },
      }));
    await prisma.account.create({
      data: { userId: user.id, type: "oauth", provider: "apple", providerAccountId: appleId },
    });
  }

  // First authorization of an existing account that had no name yet: take the one from the device.
  if (!user.name && name) user = await prisma.user.update({ where: { id: user.id }, data: { name } });

  return NextResponse.json({
    token: await createMobileToken(user),
    expiresIn: MOBILE_TOKEN_MAX_AGE,
    user: { id: user.id, email: user.email, name: user.name, image: user.image, slug: user.slug },
  });
}

function cleanName(fullName: unknown): string | null {
  if (!fullName || typeof fullName !== "object") return null;
  const { givenName, familyName } = fullName as { givenName?: unknown; familyName?: unknown };
  const parts = [givenName, familyName].filter((p): p is string => typeof p === "string" && !!p.trim());
  return parts.length ? parts.join(" ").trim().slice(0, 80) : null;
}
