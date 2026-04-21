/**
 * GET /api/linkedin/callback
 * LinkedIn redirige aquí después del consentimiento.
 * Intercambia el code por un access_token y lo guarda en una cookie
 * httpOnly (o en DB si tienes una).
 */
import { NextResponse, type NextRequest } from "next/server";
import { exchangeCodeForToken } from "@/lib/linkedin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
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

  // CSRF check usando la API oficial de cookies de Next.js.
  // El valor viene URL-encoded porque así lo seteamos en /api/linkedin/auth.
  const rawCookieState = request.cookies.get("li_oauth_state")?.value;
  const cookieState = rawCookieState
    ? decodeURIComponent(rawCookieState)
    : undefined;
  if (!state || !cookieState || state !== cookieState) {
    return NextResponse.json(
      {
        error: "state_mismatch",
        hint:
          "Si persiste: asegúrate de iniciar el OAuth en el mismo navegador (sin modo incógnito ni cookies bloqueadas) y no cerrar la pestaña intermedia.",
        debug: {
          hasState: !!state,
          hasCookie: !!cookieState,
          equal: state === cookieState,
        },
      },
      { status: 400 }
    );
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
