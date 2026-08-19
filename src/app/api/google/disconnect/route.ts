/**
 * POST /api/google/disconnect — borra los tokens de Gmail.
 * Después de esto, los emails vuelven a salir vía Resend (default).
 */
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { clearTokens } from "@/lib/gmail";

export const runtime = "nodejs";

export async function POST() {
  await clearTokens();
  return NextResponse.json({ ok: true });
}
