import { encode } from "next-auth/jwt";

export const MOBILE_TOKEN_MAX_AGE = 90 * 24 * 60 * 60; // 90 days

type TokenUser = { id: string; email: string | null; name: string | null; image: string | null };

/** NextAuth-compatible JWT the mobile app sends as `Authorization: Bearer …`. */
export function createMobileToken(user: TokenUser) {
  return encode({
    token: { id: user.id, sub: user.id, email: user.email, name: user.name, picture: user.image },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: MOBILE_TOKEN_MAX_AGE,
  });
}
