import nodemailer, { type Transporter } from "nodemailer";
import dns from "node:dns/promises";

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const from =
  process.env.SMTP_FROM ||
  "Collectif Aragon <no-reply@residence-aragon.local>";

// Brevo (API HTTPS) : recommandé sur Render, qui bloque les ports SMTP sortants.
const brevoKey = process.env.BREVO_API_KEY;

/** Déduit l'expéditeur { email, name } à partir de SMTP_FROM ("Nom <email>"). */
function parseSender(): { email: string; name?: string } {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m && m[2]) return { name: m[1] || undefined, email: m[2] };
  return { email: smtpUser || from };
}

async function sendViaBrevo(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  if (!brevoKey) return; // garde : évite un en-tête "api-key: undefined"
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: parseSender(),
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.html,
        textContent: params.text ?? params.html.replace(/<[^>]+>/g, " "),
      }),
    });
    if (!res.ok) {
      console.error(
        "Échec de l'envoi d'un e-mail (Brevo) :",
        res.status,
        await res.text(),
      );
    }
  } catch (err) {
    console.error("Échec de l'envoi d'un e-mail (Brevo) :", err);
  }
}

let transporterPromise: Promise<Transporter> | null = null;

/**
 * Crée (une seule fois) le transporteur SMTP. Render n'ayant pas de route IPv6
 * sortante, on résout d'abord l'adresse IPv4 du serveur SMTP et on s'y connecte
 * directement (le certificat TLS reste validé pour le vrai nom d'hôte).
 */
async function getTransporter(): Promise<Transporter | null> {
  if (!host) return null;
  if (!transporterPromise) {
    transporterPromise = (async () => {
      let connectHost = host;
      try {
        const res = await dns.lookup(host, { family: 4 });
        if (res.address) connectHost = res.address;
      } catch {
        // résolution impossible : on retombe sur le nom d'hôte d'origine
      }
      return nodemailer.createTransport({
        host: connectHost,
        port,
        secure: port === 465,
        requireTLS: port === 587,
        auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
        tls: { servername: host },
      });
    })();
  }
  return transporterPromise;
}

/** Indique si l'envoi d'e-mails est configuré (Brevo ou SMTP). */
export function emailConfigured(): boolean {
  return Boolean(brevoKey || host);
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

  // Priorité à Brevo (API HTTPS) si configuré : fonctionne sur Render.
  if (brevoKey) {
    await sendViaBrevo({ to, subject, html, text });
    return;
  }

  const transporter = await getTransporter();
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
      <div style="font-size: 12px; color: #6b7280;">Collectif des locataires</div>
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
