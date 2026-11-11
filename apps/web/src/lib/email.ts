import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "https://envly.fr";
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  const resend = getResend();

  await resend.emails.send({
    from: "Envly <noreply@envly.fr>",
    to: email,
    subject: "Réinitialiser votre mot de passe",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Réinitialiser votre mot de passe</h2>
        <p>Vous avez demandé la réinitialisation du mot de passe de votre compte Envly.</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
            Réinitialiser le mot de passe
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, vous pouvez ignorer cet email.</p>
      </div>
    `,
  });
}
