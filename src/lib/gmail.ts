/**
 * Gmail API helper — envía correos desde la cuenta Google Workspace de Kelly
 * (kcastaneda@tradingsolutions.com). Una sola fila singleton en
 * `google_oauth_tokens` (id=1) guarda refresh_token + access_token + expiry.
 *
 * Flujo:
 *   1) Kelly autoriza una vez en /api/google/auth → /api/google/callback
 *   2) Recibimos refresh_token (NUNCA expira) y access_token (1h)
 *   3) Cada vez que enviamos email: si access_token expirado, lo refrescamos
 *   4) POST a Gmail API users.messages.send con el RFC 822 del correo encoded base64
 *
 * Sin paquete `googleapis` — usamos fetch directo. Más liviano, sin deps extra.
 */
import { neon } from "@neondatabase/serverless";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
const GMAIL_DRAFTS_URL = "https://gmail.googleapis.com/gmail/v1/users/me/drafts";

export type GoogleTokens = {
  email: string;
  access_token: string;
  refresh_token: string;
  expires_at: string; // ISO timestamp
  scope: string;
};

async function ensureTable() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS google_oauth_tokens (
      id INTEGER PRIMARY KEY DEFAULT 1,
      email TEXT,
      access_token TEXT,
      refresh_token TEXT,
      expires_at TIMESTAMP WITH TIME ZONE,
      scope TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT singleton CHECK (id = 1)
    )
  `;
}

export async function getStoredTokens(): Promise<GoogleTokens | null> {
  await ensureTable();
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`SELECT * FROM google_oauth_tokens WHERE id = 1 LIMIT 1`;
  if (rows.length === 0 || !rows[0].refresh_token) return null;
  return {
    email: (rows[0].email as string) ?? "",
    access_token: (rows[0].access_token as string) ?? "",
    refresh_token: rows[0].refresh_token as string,
    expires_at: (rows[0].expires_at as string) ?? new Date(0).toISOString(),
    scope: (rows[0].scope as string) ?? "",
  };
}

export async function saveTokens(tokens: {
  email: string;
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  scope?: string;
}) {
  await ensureTable();
  const sql = neon(process.env.DATABASE_URL!);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  await sql`
    INSERT INTO google_oauth_tokens (id, email, access_token, refresh_token, expires_at, scope, updated_at)
    VALUES (1, ${tokens.email}, ${tokens.access_token}, ${tokens.refresh_token}, ${expiresAt}, ${tokens.scope ?? ""}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      access_token = EXCLUDED.access_token,
      refresh_token = COALESCE(EXCLUDED.refresh_token, google_oauth_tokens.refresh_token),
      expires_at = EXCLUDED.expires_at,
      scope = EXCLUDED.scope,
      updated_at = NOW()
  `;
}

export async function clearTokens() {
  await ensureTable();
  const sql = neon(process.env.DATABASE_URL!);
  await sql`DELETE FROM google_oauth_tokens WHERE id = 1`;
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number; scope?: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET no configurados en Vercel");
  }
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Google token refresh failed: ${r.status} ${txt}`);
  }
  const j = await r.json();
  return j as { access_token: string; expires_in: number; scope?: string };
}

async function getValidAccessToken(): Promise<{ access_token: string; email: string } | null> {
  const stored = await getStoredTokens();
  if (!stored) return null;

  const now = Date.now();
  const expiresAt = new Date(stored.expires_at).getTime();
  // Si quedan menos de 60s, refrescar
  if (now > expiresAt - 60_000) {
    const refreshed = await refreshAccessToken(stored.refresh_token);
    await saveTokens({
      email: stored.email,
      access_token: refreshed.access_token,
      refresh_token: stored.refresh_token, // mantenemos el refresh_token
      expires_in: refreshed.expires_in,
      scope: refreshed.scope ?? stored.scope,
    });
    return { access_token: refreshed.access_token, email: stored.email };
  }
  return { access_token: stored.access_token, email: stored.email };
}

export async function isGmailConnected(): Promise<{ connected: boolean; email?: string }> {
  try {
    const stored = await getStoredTokens();
    if (!stored) return { connected: false };
    return { connected: true, email: stored.email };
  } catch {
    return { connected: false };
  }
}

// Codifica un correo en formato RFC 822 → base64url para Gmail API
function buildRfc822(opts: {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  bcc?: string;
}): string {
  const lines: string[] = [];
  lines.push(`From: ${opts.from}`);
  lines.push(`To: ${opts.to}`);
  if (opts.replyTo) lines.push(`Reply-To: ${opts.replyTo}`);
  if (opts.bcc) lines.push(`Bcc: ${opts.bcc}`);
  lines.push(`Subject: =?UTF-8?B?${Buffer.from(opts.subject).toString("base64")}?=`);
  lines.push("MIME-Version: 1.0");
  lines.push('Content-Type: text/html; charset="UTF-8"');
  lines.push("Content-Transfer-Encoding: base64");
  lines.push("");
  lines.push(Buffer.from(opts.html).toString("base64"));
  return lines.join("\r\n");
}

/**
 * Crea un draft en Gmail (no envía). Útil para que HR revise y envíe manual.
 * Devuelve el draft_id; el usuario lo verá en su carpeta Drafts.
 */
export async function createDraftViaGmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  bcc?: string;
  fromName?: string;
}): Promise<{ ok: true; draft_id: string; gmail_email: string } | { ok: false; error: string }> {
  const valid = await getValidAccessToken();
  if (!valid) {
    return { ok: false, error: "Gmail no conectado. Pide a Kelly que vaya a Settings → Conectar Gmail." };
  }

  const fromDisplay = opts.fromName ?? "Trading Solutions Recruiting";
  const fromHeader = `${fromDisplay} <${valid.email}>`;
  const rfc822 = buildRfc822({
    from: fromHeader,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo,
    bcc: opts.bcc,
  });
  const raw = Buffer.from(rfc822).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const r = await fetch(GMAIL_DRAFTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${valid.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: { raw } }),
  });
  if (!r.ok) {
    const txt = await r.text();
    return { ok: false, error: `Gmail draft create failed: ${r.status} ${txt}` };
  }
  const j = await r.json();
  return { ok: true, draft_id: j.id as string, gmail_email: valid.email };
}

export async function sendViaGmail(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  bcc?: string;
  fromName?: string; // Display name (defaults to "Trading Solutions Recruiting")
}): Promise<{ ok: true; gmail_id: string } | { ok: false; error: string }> {
  const valid = await getValidAccessToken();
  if (!valid) {
    return { ok: false, error: "Gmail no conectado. Pide a Kelly que vaya a Settings → Conectar Gmail." };
  }

  const fromDisplay = opts.fromName ?? "Trading Solutions Recruiting";
  const fromHeader = `${fromDisplay} <${valid.email}>`;
  const rfc822 = buildRfc822({
    from: fromHeader,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo,
    bcc: opts.bcc,
  });
  const raw = Buffer.from(rfc822).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const r = await fetch(GMAIL_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${valid.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });
  if (!r.ok) {
    const txt = await r.text();
    return { ok: false, error: `Gmail send failed: ${r.status} ${txt}` };
  }
  const j = await r.json();
  return { ok: true, gmail_id: j.id as string };
}
