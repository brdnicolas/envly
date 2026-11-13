import nodemailer from "nodemailer";

/**
 * Outgoing email, sent through the Envly Gmail account (SMTP + Google "app password").
 *   GMAIL_USER          envly.contact@gmail.com
 *   GMAIL_APP_PASSWORD  16-character app password (Google account → Security → App passwords)
 * Without them, emails are skipped with a warning (the app keeps working).
 */
const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

const transport = user && pass ? nodemailer.createTransport({ service: "gmail", auth: { user, pass } }) : null;

/** The team inbox: reports and contact go there. */
export const TEAM_EMAIL = process.env.REPORTS_EMAIL || user || "envly.contact@gmail.com";

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!transport) {
    console.warn(`[email] GMAIL_USER / GMAIL_APP_PASSWORD not set, skipped: "${subject}" → ${to}`);
    return false;
  }
  await transport.sendMail({ from: `Envly <${user}>`, to, subject, html });
  return true;
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL || "https://www.envly.fr";
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  await sendMail({
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

const PROVIDER_NAMES: Record<string, string> = { google: "Google", apple: "Apple" };

/**
 * "Forgot password" on an account that has no password (signed up with Google or Apple):
 * tell the owner how they actually sign in, instead of silently sending nothing.
 */
export async function sendSocialSignInReminder(email: string, providers: string[]) {
  const baseUrl = process.env.NEXTAUTH_URL || "https://www.envly.fr";
  const names = [...new Set(providers.map((p) => PROVIDER_NAMES[p]).filter(Boolean))];
  const how = names.length ? names.join(" ou ") : "Google ou Apple";
  await sendMail({
    to: email,
    subject: `Vous vous connectez à Envly avec ${how}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Pas de mot de passe à réinitialiser</h2>
        <p>Vous avez demandé à réinitialiser votre mot de passe Envly, mais votre compte n’en a pas :
        vous vous connectez avec <b>${how}</b>.</p>
        <ul style="padding-left: 18px;">
          ${names.includes("Google") || !names.length ? `<li>Sur le site ou dans l’app : le bouton <b>« Google »</b> de la page de connexion.</li>` : ""}
          ${names.includes("Apple") ? `<li>Dans l’app Envly sur iPhone : le bouton <b>« Continuer avec Apple »</b>.</li>` : ""}
        </ul>
        <p>
          <a href="${baseUrl}/signin" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
            Se connecter à Envly
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">Si vous n’avez pas fait cette demande, vous pouvez ignorer cet email.</p>
      </div>
    `,
  });
}
