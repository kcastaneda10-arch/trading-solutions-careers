import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Autenticación de las llamadas que vienen de WXM.
 *
 * POR QUÉ UN SECRETO PROPIO Y NO ADMIN_SECRET
 * ADMIN_SECRET abre todo el ATS: borrar candidatos, cambiar vacantes, leer
 * cualquier expediente. WXM solo necesita crear requisiciones y leer estatus
 * agregado. Compartir la llave grande para eso significa que si WXM se ve
 * comprometido, el atacante entra al ATS entero. Con una llave propia el daño
 * queda acotado a lo que WXM podía hacer de todas formas.
 *
 * EN QUÉ SE CONFÍA
 * WXM valida la sesión de la persona (Supabase Auth) y su rol antes de llamar.
 * El ATS confía en el correo que WXM le manda. Esa confianza es lo que hace
 * indispensable que el secreto NUNCA salga del servidor de WXM: sin prefijo
 * NEXT_PUBLIC_, sin llegar al navegador. Quien tenga el secreto puede pedir el
 * estatus de cualquier líder.
 */
export function requireWxm(req: NextRequest): NextResponse | null {
  // Se normaliza igual que del lado de WXM: al pegar la llave desde una
  // terminal se cuela el prompt del shell ("abc123 usuario@Mac ~ %"). Tomar
  // solo el primer token hace que los dos lados coincidan aunque a uno le haya
  // quedado basura pegada, en vez de fallar con un "token inválido" que no
  // explica nada.
  const secret = (process.env.WXM_SERVICE_SECRET || "").trim().split(/\s+/)[0];
  if (!secret) {
    return NextResponse.json(
      { error: "WXM_SERVICE_SECRET no está configurado en el ATS" },
      { status: 500 },
    );
  }

  const auth = req.headers.get("authorization") || "";
  const enviado = (auth.startsWith("Bearer ") ? auth.slice(7) : "").trim().split(/\s+/)[0];
  if (!enviado) {
    return NextResponse.json({ error: "Falta el token de servicio" }, { status: 401 });
  }

  // Comparación de tiempo constante. Con `===` el tiempo de respuesta filtra
  // cuántos caracteres iniciales acertó quien prueba, y el secreto se puede
  // adivinar carácter por carácter.
  const a = Buffer.from(enviado, "utf8");
  const b = Buffer.from(secret, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Token de servicio inválido" }, { status: 401 });
  }

  return null;
}

/**
 * El correo con el que WXM dice estar llamando.
 *
 * Se normaliza igual que en el resto del ATS (minúsculas, sin espacios): el
 * mismo correo escrito con una mayúscula distinta no puede dejar a un líder
 * sin ver sus propias vacantes.
 */
export function correoDelLider(req: NextRequest): string {
  const raw =
    req.headers.get("x-wxm-user-email") ||
    req.nextUrl.searchParams.get("lead_email") ||
    "";
  return raw.toLowerCase().trim();
}
