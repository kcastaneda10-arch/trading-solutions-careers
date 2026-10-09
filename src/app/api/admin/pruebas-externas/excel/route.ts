/**
 * GET /api/admin/pruebas-externas/excel?vacancy_id=UUID[&vacancy_id=...]
 *
 * Baja la matriz de pruebas en .xlsx. Sin `vacancy_id` saca todas las
 * vacantes abiertas.
 *
 * POR QUÉ UN EXCEL, SI YA HAY PANTALLA
 * Porque la pantalla sirve para ver y el Excel sirve para repartir. El
 * seguimiento de pruebas se trabaja con el líder de cada área y con la
 * psicóloga, que no entran al ATS. Mientras eso siga siendo cierto, obligar a
 * que todo pase por la pantalla es garantizar que el seguimiento viva en un
 * WhatsApp.
 *
 * Dos hojas:
 *   · «Matriz» — una fila por candidato, una columna por proveedor, con el
 *     estado en texto. Es la que se mira para saber a quién le falta qué.
 *   · «Detalle» — una fila por candidato y prueba, con resumen, fecha,
 *     quién la cargó y el enlace al soporte. Es la que se filtra.
 */
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { matrizDeVacante, etiquetaEstado } from "@/lib/pruebas-externas";
import { STAGE_LABEL_SHORT, normalizeStage } from "@/lib/stage-labels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fecha(iso: string | null | undefined): string {
  return iso ? String(iso).slice(0, 10) : "";
}

export async function GET(req: NextRequest) {
  const noAutorizado = requireAdmin(req);
  if (noAutorizado) return noAutorizado;

  try {
    let ids = req.nextUrl.searchParams.getAll("vacancy_id").filter(Boolean);

    if (!ids.length) {
      const { data } = await supabaseAdmin
        .from("ht_vacancies")
        .select("id, status")
        .or("status.is.null,status.eq.open");
      ids = (data ?? []).map((v: any) => v.id);
    }
    if (!ids.length) {
      return NextResponse.json({ error: "No hay vacantes abiertas" }, { status: 404 });
    }

    const { data: vacs } = await supabaseAdmin
      .from("ht_vacancies")
      .select("id, title")
      .in("id", ids);
    const titulo = new Map((vacs ?? []).map((v: any) => [v.id, v.title]));

    const matriz: any[][] = [];
    const detalle: any[][] = [];
    let encabezadoPuesto = false;

    for (const vid of ids) {
      const { proveedores, candidatos } = await matrizDeVacante(vid);

      if (!encabezadoPuesto) {
        matriz.push([
          "Vacante",
          "Candidato",
          "Correo",
          "Etapa",
          ...proveedores.map((p) => p.nombre),
          "Pruebas con resultado",
          "Pruebas pendientes",
        ]);
        detalle.push([
          "Vacante",
          "Candidato",
          "Correo",
          "Prueba",
          "Categoría",
          "Estado",
          "Resultado",
          "Presentada",
          "Cargada por",
          "Soporte",
          "Notas",
        ]);
        encabezadoPuesto = true;
      }

      for (const c of candidatos) {
        const conResultado = c.pruebas.filter((p: any) => p.estado === "cargada").length;
        const pendientes = c.pruebas.filter(
          (p: any) => p.estado !== "cargada" && p.estado !== "no_aplica",
        ).length;

        matriz.push([
          titulo.get(vid) ?? "",
          c.nombre ?? "",
          c.email ?? "",
          STAGE_LABEL_SHORT[normalizeStage(c.stage)] ?? c.stage ?? "",
          ...c.pruebas.map((p: any) => etiquetaEstado(p.estado)),
          conResultado,
          pendientes,
        ]);

        for (const p of c.pruebas) {
          const prov = proveedores.find((x) => x.id === p.provider_id);
          detalle.push([
            titulo.get(vid) ?? "",
            c.nombre ?? "",
            c.email ?? "",
            prov?.nombre ?? "",
            prov?.categoria ?? "",
            etiquetaEstado(p.estado),
            p.resumen ?? "",
            fecha(p.presentada_at),
            "",
            p.archivo_url ?? prov?.portal_url ?? "",
            "",
          ]);
        }
      }
    }

    const libro = XLSX.utils.book_new();

    const hojaMatriz = XLSX.utils.aoa_to_sheet(matriz);
    hojaMatriz["!cols"] = (matriz[0] ?? []).map((_, i) => ({
      wch: i <= 2 ? 30 : i === 3 ? 22 : 18,
    }));
    hojaMatriz["!freeze"] = { xSplit: 2, ySplit: 1 };
    XLSX.utils.book_append_sheet(libro, hojaMatriz, "Matriz");

    const hojaDetalle = XLSX.utils.aoa_to_sheet(detalle);
    hojaDetalle["!cols"] = [
      { wch: 34 }, { wch: 30 }, { wch: 32 }, { wch: 26 }, { wch: 14 },
      { wch: 18 }, { wch: 46 }, { wch: 12 }, { wch: 24 }, { wch: 40 }, { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(libro, hojaDetalle, "Detalle");

    const buf = XLSX.write(libro, { type: "buffer", bookType: "xlsx" });
    const hoy = new Date().toISOString().slice(0, 10);

    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Pruebas_externas_${hoy}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "No se pudo generar el Excel" },
      { status: 500 },
    );
  }
}
