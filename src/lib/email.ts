import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "https://envly.app";
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  const resend = getResend();

  await resend.emails.send({
    from: "Envly <noreply@envly.app>",
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>You requested a password reset for your Envly account.</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
            Reset password
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn&apos;t request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
