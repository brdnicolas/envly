import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, sendSocialSignInReminder } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user && user.password) {
      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Delete any existing tokens for this email
      await prisma.passwordResetToken.deleteMany({ where: { email } });

      await prisma.passwordResetToken.create({
        data: { email, token, expires },
      });

      await sendPasswordResetEmail(email, token);
    } else if (user) {
      // Signed up with Google / Apple: nothing to reset, remind them how they sign in.
      const accounts = await prisma.account.findMany({ where: { userId: user.id }, select: { provider: true } });
      await sendSocialSignInReminder(email, accounts.map((a) => a.provider));
    }

    // Same answer whatever happened, so the endpoint never reveals whether an account exists.
    return NextResponse.json({ message: "If an account exists, a reset email has been sent." });
  } catch {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
