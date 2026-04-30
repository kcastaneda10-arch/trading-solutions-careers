/**
 * GET /api/google/auth
 *
 * Inicia el flujo OAuth con Google. Redirige a la pantalla de consentimiento
 * de Google donde Kelly autoriza al ATS a enviar correos en su nombre.
 *
 * Scopes solicitados:
 *   - gmail.compose: crear drafts (incluye gmail.send implícito) — para que HR
 *     pueda revisar el correo antes de enviar
 *   - email: identificar su correo (kcastaneda@tradingsolutions.com)
 *
 * Después del consent, Google redirige a /api/google/callback?code=...
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/userinfo.email",
];

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID no configurado en Vercel" },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trading-solutions-careers.vercel.app";
  const redirectUri = `${baseUrl}/api/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline", // crítico — sin esto no recibimos refresh_token
    prompt: "consent", // forzar pantalla consent para garantizar refresh_token nuevo
    include_granted_scopes: "true",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
