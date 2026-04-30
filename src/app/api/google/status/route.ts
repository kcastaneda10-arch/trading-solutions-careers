/**
 * GET /api/google/status — devuelve si Gmail está conectado y el email asociado.
 */
import { NextResponse } from "next/server";
import { isGmailConnected } from "@/lib/gmail";

export const runtime = "nodejs";

export async function GET() {
  const status = await isGmailConnected();
  return NextResponse.json(status);
}
