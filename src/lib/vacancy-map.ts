/**
 * Mapping job_id (Neon · jobs.ts) → vacancy_id (Supabase · ht_vacancies).
 *
 * POR QUÉ VIVE ACÁ
 * Había dos copias — una en /api/applications y otra en
 * /api/admin/sync-applications-to-funnel — y la del sync se quedó atrás con
 * solo los ids 2-5. Resultado: una aplicación a una vacante nueva entraba bien
 * por el formulario público pero el sync manual la descartaba por "no mapeada".
 * Con un solo módulo no pueden volver a divergir.
 *
 * Verificar con: SELECT id, title FROM ht_vacancies;
 */
export const VACANCY_MAP: Record<number, string> = {
  // CERRADAS · el mapeo se conserva para que las aplicaciones históricas
  // sigan resolviendo, pero ya no se publican en /careers.
  2: "c25ce70b-9244-4393-aea6-75372a99a6ef", // Inside Sales Support — CERRADA 18-ago-2026
  3: "6e4838dd-8aea-4426-bd26-ea588f0f493a", // Customer Documentation Specialist
  4: "d354c55a-eb1c-4aee-bd02-b0a20162e1f1", // Pricing Junior
  5: "70c39cab-adaf-49a0-b137-29d0ff9b56b0", // Talent Acquisition and Development Lead

  // ─── CHINA · Builder Team (form_template_key='china', country='China') ──
  6: "ac368792-1cde-4afb-9185-24d5b4aa0579", // Customer Documentation and Support (Finance)
  7: "da9ca124-e610-450b-a9f1-56f4a538fd9a", // Operations Executive and Support (Operations)
  8: "81d82ac5-9746-4f80-94d5-4595d09bd7ab", // Overseas Sales Executive and Support (Commercial)
  9: "7350dc25-2791-4a9c-8d30-1c09fe48cbad", // Pricing Executive - Support (Pricing)

  // ─── Producto & Tecnología ──
  // Full Stack Developer Junior. Antes era job_id 6, que chocaba con la
  // vacante de China de arriba: sus aplicaciones caían en el funnel
  // equivocado. Reasignado a 10.
  // ⚠️ PENDIENTE: reemplazar por el UUID real de ht_vacancies después de
  // correr scripts/20260818_vacantes.sql (ver PENDIENTE-BD.md).
  10: process.env.VACANCY_ID_FULLSTACK_JUNIOR || "",
};
