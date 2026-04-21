/**
 * GET /api/linkedin/auth
 * Inicia el flujo OAuth 2.0 de LinkedIn.
 * El state se firma con HMAC (stateless) — no depende de cookies.
 */
import { NextResponse, type NextRequest } from "next/server";
import { buildAuthUrl } from "@/lib/linkedin";
import { issueState } from "@/lib/linkedin-state";

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

  // State firmado con HMAC — auto-verificable sin cookies.
  let state: string;
  try {
    state = issueState();
  } catch {
    return NextResponse.json(
      { error: "LINKEDIN_CLIENT_SECRET missing" },
      { status: 500 }
    );
  }

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

  return NextResponse.redirect(authUrl);
}
