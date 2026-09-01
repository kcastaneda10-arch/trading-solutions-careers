/**
 * GET /api/admin/candidates/[candidateId]/cv
 *
 * Devuelve la hoja de vida de un candidato del funnel.
 *
 * POR QUÉ EXISTE, SI YA HAY /api/admin/cv/[applicationId]
 * Esa ruta pide el id de la aplicación en Neon, y el panel trabaja con el id
 * del candidato en Supabase. Para usarla había que ir a Neon, correr una
 * consulta, copiar el id y armar la URL a mano — cada vez que alguien pedía
 * una hoja de vida. Esta ruta hace ese puente del lado del servidor.
 *
 * CÓMO SE UNEN LAS DOS BASES
 * Por correo. No hay llave entre `ht_candidates` (Supabase) y `applications`
 * (Neon): la sincronización solo deja el id escrito dentro de un texto de
 * notas, que no se puede consultar de forma confiable. El correo es lo único
 * que ambas guardan igual. Si una persona aplicó varias veces, se devuelve la
 * más reciente que traiga archivo.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { candidateId: string } },
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { data: cand, error } = await supabaseAdmin
      .from("ht_candidates")
      .select("id, name, email")
      .eq("id", params.candidateId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!cand) return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    if (!cand.email) {
      return NextResponse.json(
        { error: "Este candidato no tiene correo, así que no hay cómo encontrar su hoja de vida." },
        { status: 404 },
      );
    }

    const filas = await sql`
      SELECT id, cv_filename, cv_data
      FROM applications
      WHERE lower(email) = lower(${cand.email})
        AND cv_data IS NOT NULL
      ORDER BY id DESC
      LIMIT 1
    `;

    if ((filas as any[]).length === 0) {
      // Pasa con quienes entraron por importación en vez del formulario
      // público: existen en el funnel pero nunca subieron archivo.
      return NextResponse.json(
        {
          error:
            `No hay hoja de vida guardada para ${cand.name || cand.email}. ` +
            "Suele pasar con los candidatos que entraron por importación: hay que pedírsela.",
        },
        { status: 404 },
      );
    }

    const fila = (filas as any[])[0] as { id: number; cv_filename: string | null; cv_data: string };

    // cv_data se guarda como data URL ("data:application/pdf;base64,...") o
    // como base64 pelado en las filas más viejas.
    let mimeType = "application/pdf";
    let b64 = fila.cv_data;
    const m = fila.cv_data.match(/^data:([^;]+);base64,(.+)$/);
    if (m) {
      mimeType = m[1];
      b64 = m[2];
    }

    const buf = Buffer.from(b64, "base64");
    const nombre = fila.cv_filename || `hoja-de-vida-${(cand.name || "candidato").replace(/\s+/g, "-").toLowerCase()}.pdf`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${nombre.replace(/"/g, "")}"`,
        "Content-Length": String(buf.length),
        // Es un dato personal: que no quede en cachés intermedias.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err: any) {
    console.error("[cv por candidato]", err);
    return NextResponse.json(
      { error: "No se pudo abrir la hoja de vida", detail: err?.message || String(err) },
      { status: 500 },
    );
  }
}
