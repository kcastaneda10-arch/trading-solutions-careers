/**
 * PATCH /api/headhunting/vacancies/[vacancyId]/template
 *
 * Cambia el cuestionario de prefiltro que se le envia a los candidatos de una
 * vacante. Antes esto solo se podia hacer con un UPDATE a mano en Supabase.
 *
 * Body: { form_template_key: TemplateKey }
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { PREFILTER_TEMPLATES, type TemplateKey } from "@/lib/prefilter-templates";

const TS_CLIENT_ID = "98b62872-5767-4815-9b49-1394b9527c1f";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ vacancyId: string }> }
) {
  try {
    const { vacancyId } = await params;
    const body = await req.json().catch(() => ({}));
    const key = String(body.form_template_key || "");

    if (!(key in PREFILTER_TEMPLATES)) {
      return NextResponse.json(
        { error: "plantilla_invalida", valid: Object.keys(PREFILTER_TEMPLATES) },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("ht_vacancies")
      .update({ form_template_key: key as TemplateKey })
      .eq("id", vacancyId)
      .eq("client_id", TS_CLIENT_ID)
      .select("id, title, form_template_key")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "vacante_no_encontrada" }, { status: 404 });

    return NextResponse.json({ ok: true, vacancy: data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
