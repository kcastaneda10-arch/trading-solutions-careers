/**
 * GET /api/linkedin/auth
 * Inicia el flujo OAuth 2.0 de LinkedIn.
 * Redirige al admin corporativo a la pantalla de consentimiento
 * de LinkedIn con los scopes requeridos para el ATS.
 */
import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/linkedin";

export const runtime = "nodejs";

export async function GET(request: Request) {
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
      scope: [
        "openid",
        "profile",
        "email",
        "r_organization_social",
        "w_organization_social",
        "rw_organization_admin",
      ],
    },
    state
  );

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("li_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    path: "/",
    maxAge: 600,
  });
  return response;
}
