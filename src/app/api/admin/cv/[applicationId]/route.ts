/**
 * GET /api/admin/cv/[applicationId]
 *
 * Devuelve el CV (PDF) de una aplicación pública.
 * cv_data está en la tabla applications (Neon) como base64.
 *
 * Auth: requireAdmin (cookie de sesión o bearer)
 *
 * Uso: para que Yohanna y el equipo puedan abrir un CV directo desde links
 * en correos, drafts o el Excel de handoff sin tener que rebuscarlo en el admin.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const id = parseInt(params.applicationId, 10);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "applicationId inválido" }, { status: 400 });
    }

    const rows = await sql`
      SELECT cv_filename, cv_data
      FROM applications
      WHERE id = ${id}
      LIMIT 1
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Aplicación no encontrada" }, { status: 404 });
    }

    const row = rows[0] as { cv_filename: string | null; cv_data: string | null };
    if (!row.cv_data) {
      return NextResponse.json({ error: "Esta aplicación no tiene CV cargado" }, { status: 404 });
    }

    // cv_data viene como data URL: "data:application/pdf;base64,..."
    // Si no tiene prefijo, asumimos PDF.
    let mimeType = "application/pdf";
    let b64 = row.cv_data;
    const dataUrlMatch = row.cv_data.match(/^data:([^;]+);base64,(.+)$/);
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1];
      b64 = dataUrlMatch[2];
    }

    const buf = Buffer.from(b64, "base64");
    const filename = row.cv_filename || `cv-${id}.pdf`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err: any) {
    console.error("admin/cv error:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
