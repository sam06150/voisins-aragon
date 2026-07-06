import nodemailer, { type Transporter } from "nodemailer";

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const from =
  process.env.SMTP_FROM ||
  "Collectif Aragon <no-reply@residence-aragon.local>";

let transporter: Transporter | null = null;
if (host) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
  });
}

/** Indique si un serveur SMTP est configuré (sinon on est en mode local). */
export function emailConfigured(): boolean {
  return transporter !== null;
}

/**
 * Envoie un e-mail. Si aucun SMTP n'est configuré (usage local), l'envoi est
 * simplement journalisé dans la console — rien ne casse.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const { to, subject, html, text } = params;

  if (!transporter) {
    console.log(
      `[e-mail non envoyé — SMTP non configuré] → ${to} · sujet : « ${subject} »`,
    );
    return;
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text ?? html.replace(/<[^>]+>/g, " "),
    });
  } catch (err) {
    // On ne bloque jamais une action utilisateur à cause d'un e-mail.
    console.error("Échec de l'envoi d'un e-mail :", err);
  }
}

const APP_URL = process.env.APP_URL || "http://localhost:3000";

/** Gabarit HTML minimal et sobre, cohérent avec la marque du collectif. */
export function emailLayout(title: string, bodyHtml: string): string {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
    <div style="border-bottom: 2px solid #e11d48; padding-bottom: 12px; margin-bottom: 20px;">
      <div style="font-size: 18px; font-weight: bold; color: #be123c;">Voisins Collectif &amp; en Colère</div>
      <div style="font-size: 12px; color: #6b7280;">Résidence Aragon</div>
    </div>
    <h1 style="font-size: 18px;">${title}</h1>
    <div style="font-size: 14px; line-height: 1.6; color: #374151;">${bodyHtml}</div>
    <div style="margin-top: 24px;">
      <a href="${APP_URL}" style="background: #e11d48; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: bold;">Ouvrir la plateforme</a>
    </div>
    <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">
      Vous recevez cet e-mail car vous êtes inscrit sur la plateforme du collectif.
      Vous pouvez désactiver ces notifications dans « Mon compte ».
    </p>
  </div>`;
}
