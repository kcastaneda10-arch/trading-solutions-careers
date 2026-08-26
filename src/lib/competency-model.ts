import { supabaseAdmin } from "@/lib/supabase";

export const TS_CLIENT_ID = "98b62872-5767-4815-9b49-1394b9527c1f";

/**
 * El modelo de competencias (los 16 mandatos) contra el que se evalúa a los
 * candidatos.
 *
 * `ht_vacancies.model_id` es NOT NULL y no tiene default. Olvidarlo es lo que
 * dejó a Talent Acquisition Specialist publicada en la web sin funnel en el
 * ATS: la vacante se veía, la gente aplicaba, y las aplicaciones no tenían a
 * dónde entrar. Como ahora hay dos caminos que crean vacantes —el botón de
 * publicar y la aprobación de una requisición— esto vive acá y no copiado en
 * cada uno.
 *
 * Todas las vacantes del cliente comparten modelo, así que se reutiliza el
 * vigente. Se prefiere el activo; si ninguno está marcado así, se toma el de
 * cualquier vacante existente.
 */
export async function modeloDeCompetencias(): Promise<string | null> {
  const { data: modelo } = await supabaseAdmin
    .from("ht_competency_models")
    .select("id")
    .eq("client_id", TS_CLIENT_ID)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  if (modelo?.id) return modelo.id;

  const { data: otraVacante } = await supabaseAdmin
    .from("ht_vacancies")
    .select("model_id")
    .eq("client_id", TS_CLIENT_ID)
    .not("model_id", "is", null)
    .limit(1)
    .maybeSingle();
  return otraVacante?.model_id ?? null;
}

// ht_vacancies.role_level tiene un CHECK: solo 'entry', 'lead' y 'c_suite'.
// Son niveles de jerarquía, no de seniority — un cargo junior o mid es 'entry'.
export function nivelDeJerarquia(level: string): string {
  const l = (level || "").toLowerCase();
  if (l.includes("senior") || l.includes("lead")) return "lead";
  return "entry";
}
