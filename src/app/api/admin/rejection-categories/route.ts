/**
 * GET /api/admin/rejection-categories
 *
 * Devuelve el catálogo de motivos de rechazo activos, ordenados,
 * para alimentar el dropdown del modal "Rechazar candidato".
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { data, error } = await supabaseAdmin
    .from("ts_rejection_categories")
    .select("category_key, category_label, description, sub_details, public_message_template, display_order")
    .eq("active", true)
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data || [] });
}
