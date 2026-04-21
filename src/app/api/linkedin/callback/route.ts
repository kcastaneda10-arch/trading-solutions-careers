/**
 * GET /api/linkedin/callback
 * LinkedIn redirige aquí después del consentimiento.
 * Intercambia el code por un access_token y lo guarda en una cookie
 * httpOnly (o en DB si tienes una).
 */
import { NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/linkedin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error) {
    return NextResponse.json({ error, description: url.searchParams.get("error_description") }, { status: 400 });
  }
  if (!code) return NextResponse.json({ error: "missing_code" }, { status: 400 });

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "missing_credentials" }, { status: 500 });
  }

  // CSRF check
  const cookieState = request.headers
    .get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith("li_oauth_state="))
    ?.split("=")[1];
  if (!state || state !== cookieState) {
    return NextResponse.json({ error: "state_mismatch" }, { status: 400 });
  }

  const origin = `${url.protocol}//${url.host}`;
  try {
    const token = await exchangeCodeForToken(
      {
        clientId,
        clientSecret,
        redirectUri: `${origin}/api/linkedin/callback`,
        companyId: process.env.LINKEDIN_COMPANY_ID ?? "",
        scope: [],
      },
      code
    );

    // Guardar el token de manera segura. En demo: cookie httpOnly.
    // En producción: encriptar y guardar en DB con relación a org_id.
    const res = NextResponse.redirect(`${origin}/hr-admin?li=connected`);
    res.cookies.set("li_access_token", token.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: url.protocol === "https:",
      path: "/",
      maxAge: Math.min(token.expiresIn, 60 * 60 * 24 * 30),
    });
    res.cookies.set("li_oauth_state", "", { maxAge: 0, path: "/" });
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: "token_exchange_failed", detail: msg }, { status: 500 });
  }
}
