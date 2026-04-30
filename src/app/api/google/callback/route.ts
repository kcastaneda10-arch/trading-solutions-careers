/**
 * GET /api/google/callback
 *
 * Recibe el ?code de Google después del consent, lo intercambia por
 * access_token + refresh_token, identifica el email del usuario y guarda
 * todo en la tabla google_oauth_tokens (singleton id=1).
 *
 * Redirige al HR Admin con un flag de éxito.
 */
import { NextRequest, NextResponse } from "next/server";
import { saveTokens } from "@/lib/gmail";

export const runtime = "nodejs";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trading-solutions-careers.vercel.app";

  if (error) {
    return NextResponse.redirect(`${baseUrl}/hr-admin?gmail_error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return NextResponse.redirect(`${baseUrl}/hr-admin?gmail_error=no_code`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/hr-admin?gmail_error=missing_credentials`);
  }

  const redirectUri = `${baseUrl}/api/google/callback`;

  try {
    // Exchange code → tokens
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      console.error("Token exchange failed:", t);
      return NextResponse.redirect(`${baseUrl}/hr-admin?gmail_error=token_exchange_failed`);
    }

    const tokens = (await tokenRes.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope?: string;
      token_type?: string;
    };

    if (!tokens.refresh_token) {
      // Esto pasa si Kelly ya autorizó antes y Google no manda refresh_token de nuevo.
      // La fix es revocar acceso en https://myaccount.google.com/permissions y reintentar.
      console.warn("No refresh_token received — usuario ya había autorizado antes");
      return NextResponse.redirect(`${baseUrl}/hr-admin?gmail_error=no_refresh_token_revoke_first`);
    }

    // Identificar email del usuario
    const userRes = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userRes.ok) {
      return NextResponse.redirect(`${baseUrl}/hr-admin?gmail_error=userinfo_failed`);
    }
    const user = (await userRes.json()) as { email: string; name?: string };

    await saveTokens({
      email: user.email,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      scope: tokens.scope ?? "",
    });

    return NextResponse.redirect(`${baseUrl}/hr-admin?gmail_connected=${encodeURIComponent(user.email)}`);
  } catch (e) {
    console.error("Callback error:", e);
    return NextResponse.redirect(`${baseUrl}/hr-admin?gmail_error=internal`);
  }
}
