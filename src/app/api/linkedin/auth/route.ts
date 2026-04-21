/**
 * GET /api/linkedin/auth
 * Inicia el flujo OAuth 2.0 de LinkedIn.
 * Redirige al admin corporativo a la pantalla de consentimiento
 * de LinkedIn con los scopes requeridos para el ATS.
 */
import { NextResponse, type NextRequest } from "next/server";
import { buildAuthUrl } from "@/lib/linkedin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      {
        error: "LINKEDIN_CLIENT_ID missing",
        help:
          "Crea la LinkedIn App en https://www.linkedin.com/developers/ con la cuenta admin de la Company Page de Trading Solutions, y agrega LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET a las variables de entorno en Vercel.",
      },
      { status: 500 }
    );
  }

  // state = CSRF protection. En producción guardar en cookie httpOnly signed.
  const state = crypto.randomUUID();

  const authUrl = buildAuthUrl(
    {
      clientId,
      clientSecret: "",
      redirectUri: `${origin}/api/linkedin/callback`,
      companyId: process.env.LINKEDIN_COMPANY_ID ?? "",
      // Scopes autorizados con los productos activados actualmente:
      //   - Sign In with LinkedIn using OpenID Connect  → openid, profile, email
      //   - Share on LinkedIn                           → w_member_social
      // Los scopes de organización (w_organization_social, rw_organization_admin)
      // requieren productos adicionales (Marketing Developer Platform o Community
      // Management API) que se solicitan después de la aprobación de LinkedIn.
      scope: ["openid", "profile", "email", "w_member_social"],
    },
    state
  );

  const response = NextResponse.redirect(authUrl);
  // Usar Set-Cookie directo para asegurar que se envía en redirects 307.
  const isHttps = url.protocol === "https:";
  response.headers.append(
    "Set-Cookie",
    [
      `li_oauth_state=${encodeURIComponent(state)}`,
      "Path=/",
      "HttpOnly",
      isHttps ? "Secure" : "",
      "SameSite=Lax",
      "Max-Age=600",
    ]
      .filter(Boolean)
      .join("; ")
  );
  return response;
}
