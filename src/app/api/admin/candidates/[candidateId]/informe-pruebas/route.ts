/**
 * GET /api/admin/candidates/[candidateId]/informe-pruebas?vista=talent|lider|ceo
 *
 * Todo lo que necesita el informe del candidato después de las pruebas, ya
 * filtrado por vista. El filtro vive en el servidor a propósito: si la
 * pantalla fuera la que decide qué ocultar, bastaría con abrir la consola
 * para ver la validez de la medición en la versión del líder.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { armarInforme, esVista } from "@/lib/informe-candidato";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { candidateId: string } },
) {
  const noAutorizado = requireAdmin(req);
  if (noAutorizado) return noAutorizado;

  try {
    const v = req.nextUrl.searchParams.get("vista");
    const informe = await armarInforme(params.candidateId, esVista(v) ? v : "talent");
    return NextResponse.json(informe, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "No se pudo armar el informe" },
      { status: 500 },
    );
  }
}
