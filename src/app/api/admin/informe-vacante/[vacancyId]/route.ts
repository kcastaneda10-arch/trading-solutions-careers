/**
 * GET /api/admin/informe-vacante/[vacancyId]
 *
 * Los números del informe de vacante, para la pantalla que lo prepara: la
 * frase y los próximos pasos sugeridos, y cuáles de los 10 primeros todavía
 * no tienen informe interpretativo.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { armarInforme } from "@/lib/informe-vacante/datos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { vacancyId: string } }) {
  const authError = requireAdmin(req);
  if (authError) return authError;
  try {
    const inf = await armarInforme(params.vacancyId);
    return NextResponse.json(inf, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "No se pudo armar el informe" }, { status: 500 });
  }
}
