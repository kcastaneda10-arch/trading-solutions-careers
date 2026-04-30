/**
 * GET  /api/headhunting/prefilter/[token]  — valida token y devuelve datos básicos del candidato
 * POST /api/headhunting/prefilter/[token]  — guarda respuestas del prefiltro
 *
 * Sin auth admin — el token es la auth (uno por candidato, expira en 7 días).
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { data: candidate, error } = await supabaseAdmin
    .from("ht_candidates")
    .select("id, name, email, prefilter_token, prefilter_token_expires_at, prefilter_completed_at, ht_vacancies(title), ht_clients(name)")
    .eq("prefilter_token", params.token)
    .single();

  if (error || !candidate) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  if (candidate.prefilter_token_expires_at && new Date(candidate.prefilter_token_expires_at as string) < new Date()) {
    return NextResponse.json({ error: "expired_token" }, { status: 410 });
  }

  if (candidate.prefilter_completed_at) {
    return NextResponse.json({ error: "already_completed" }, { status: 409 });
  }

  return NextResponse.json({
    candidate: {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
    },
    // @ts-expect-error supabase relation type
    vacancy: { title: candidate.ht_vacancies?.title || "la vacante" },
    // @ts-expect-error supabase relation type
    client: { name: candidate.ht_clients?.name || "Trading Solutions" },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const body = await req.json();

  const { data: candidate, error } = await supabaseAdmin
    .from("ht_candidates")
    .select("id, prefilter_token_expires_at, prefilter_completed_at")
    .eq("prefilter_token", params.token)
    .single();

  if (error || !candidate) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  if (candidate.prefilter_token_expires_at && new Date(candidate.prefilter_token_expires_at as string) < new Date()) {
    return NextResponse.json({ error: "expired_token" }, { status: 410 });
  }

  if (candidate.prefilter_completed_at) {
    return NextResponse.json({ error: "already_completed" }, { status: 409 });
  }

  const { error: updateErr } = await supabaseAdmin
    .from("ht_candidates")
    .update({
      prefilter_data: body,
      prefilter_completed_at: new Date().toISOString(),
    })
    .eq("id", candidate.id);

  if (updateErr) {
    return NextResponse.json({ error: "save_failed", detail: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
