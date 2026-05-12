/**
 * Mapping centralizado de stage codes (técnicos, en BD) a etiquetas humanas (UI).
 *
 * REGLA: cuando vayas a renderizar un stage en pantalla, usá `stageLabel(code)` —
 * NUNCA imprimas el code crudo. Eso es para BD.
 *
 * También provee SLA targets por stage (días que un candidato debería pasar
 * en ese stage antes de considerarse "atascado"). Estos vienen de la práctica
 * estándar de ATS modernos (Greenhouse, Ashby, Lever) y la política RYS.
 */

export type StageCode =
  | 'aplico'
  | 'prefiltro_enviado'
  | 'prefiltro_revision'
  | 'prefiltro_pasado'
  | 'prefiltro_rechazado'
  | 'assessment_invitado'        // LEGACY · solo candidatos pre-mayo 2026
  | 'assessment_en_progreso'     // LEGACY
  | 'assessment_completado'      // LEGACY
  | 'entrevista_ia'              // LEGACY
  | 'recruiter_interview'
  | 'hiring_lead_interview'
  | 'cwo_interview'
  | 'bateria_psicometrica'       // cola Pruebas Psicométricas
  | 'solicitud_enviada_mary'     // batch enviado · Mary trabajando
  | 'touring'                    // Máquina de Turing
  | 'terna'
  | 'oferta'
  | 'contratado'
  | 'onboarding'
  | 'rechazado';

/** Etiqueta corta humana — para chips y tablas */
export const STAGE_LABEL_SHORT: Record<string, string> = {
  aplico: 'Aplicó',
  prefiltro_enviado: 'Prefiltro enviado',
  prefiltro_revision: 'Prefiltro · revisar',
  prefiltro_pasado: 'Prefiltro ✓',
  prefiltro_rechazado: 'Prefiltro ✗',
  assessment_invitado: 'Integridad invitada',
  assessment_en_progreso: 'Integridad en curso',
  assessment_completado: 'Integridad ✓',
  entrevista_ia: 'Entrevista IA',
  recruiter_interview: 'Recruiter Interview',
  hiring_lead_interview: 'Hiring Lead Interview',
  cwo_interview: 'CWO + Hiring Manager',
  bateria_psicometrica: 'Pruebas Psicométricas',
  solicitud_enviada_mary: 'Solicitud a HR Specialist',
  touring: 'Máquina de Turing',
  terna: 'Terna',
  oferta: 'Oferta enviada',
  contratado: 'Contratado',
  onboarding: 'Onboarding',
  rechazado: 'Rechazado',
};

/** Etiqueta larga humana — para títulos y tooltips */
export const STAGE_LABEL_LONG: Record<string, string> = {
  aplico: 'Aplicó',
  prefiltro_enviado: 'Prefiltro enviado al candidato',
  prefiltro_revision: 'Esperando revisión del prefiltro',
  prefiltro_pasado: 'Prefiltro aprobado',
  prefiltro_rechazado: 'Prefiltro rechazado',
  assessment_invitado: 'Invitado a prueba de integridad (legacy)',
  assessment_en_progreso: 'Tomando prueba de integridad (legacy)',
  assessment_completado: 'Prueba de integridad completada (legacy)',
  entrevista_ia: 'Entrevista con IA (legacy)',
  recruiter_interview: 'Entrevista con Recruiter',
  hiring_lead_interview: 'Entrevista con Hiring Lead',
  cwo_interview: 'Entrevista con CWO + Hiring Manager',
  bateria_psicometrica: 'Pruebas Psicométricas · cola de envío a HR Specialist',
  solicitud_enviada_mary: 'Solicitud enviada a HR Specialist · Mary aplicando pruebas',
  touring: 'Máquina de Turing · prueba propia del matemático interno',
  terna: 'En terna final',
  oferta: 'Oferta enviada · esperando respuesta',
  contratado: 'Contratado',
  onboarding: 'En proceso de onboarding',
  rechazado: 'Rechazado',
};

/** Acción concreta que debe ejecutar el reclutador en este stage */
export const STAGE_ACTION: Record<string, string> = {
  prefiltro_revision: 'Revisar respuestas y decidir avance',
  assessment_completado: 'Revisar resultado de prueba de integridad y agendar entrevista',
  entrevista_ia: 'Revisar resultado de entrevista IA',
  bateria_psicometrica: 'Revisar batería psicométrica',
  recruiter_interview: 'Completar scorecard y decidir avance a CWO',
  cwo_interview: 'Pedir decisión a CWO sobre touring/terna',
  touring: 'Confirmar fecha de touring',
  terna: 'Selección final del candidato',
  oferta: 'Hacer follow-up de respuesta del candidato',
  contratado: 'Iniciar onboarding',
};

/**
 * SLA en días — cuánto tiempo MÁXIMO debería un candidato estar en este stage.
 * Si lo supera, está atascado (mostrar en rojo en Stage Health).
 *
 * Inspirado en best practices ATS (Ashby, Greenhouse) + ajustado al ritmo TS.
 */
export const STAGE_SLA_DAYS: Record<string, number> = {
  aplico: 3,                       // 3d para mandar prefiltro
  prefiltro_enviado: 5,            // 5d para que candidato responda
  prefiltro_revision: 2,           // 2d para que reclutador revise
  prefiltro_pasado: 2,             // 2d para agendar recruiter interview
  // Legacy (Elevare / AI) — solo aplica a candidatos pre-mayo 2026
  assessment_invitado: 5,
  assessment_en_progreso: 3,
  assessment_completado: 3,
  entrevista_ia: 3,
  // Pipeline activo v3
  recruiter_interview: 5,          // 5d para completar scorecard + decidir
  hiring_lead_interview: 5,        // 5d para que Hiring Lead complete
  cwo_interview: 5,                // 5d para que CWO + HM completen
  bateria_psicometrica: 1,         // 1d en cola · debería irse en el próximo batch (mañana o tarde)
  solicitud_enviada_mary: 7,       // 7d para que Mary aplique pruebas y devuelva
  touring: 5,                      // 5d para programar/realizar Máquina de Turing
  terna: 7,                        // 7d para selección final
  oferta: 7,                       // 7d para que candidato responda
};

/**
 * Categorización del stage — útil para colorear en UI.
 * - "screening": stages tempranos (filtro)
 * - "assessment": pruebas
 * - "interview": entrevistas humanas
 * - "decision": stages de decisión final
 * - "terminal": estados finales (contratado/rechazado)
 */
export const STAGE_CATEGORY: Record<string, 'screening' | 'assessment' | 'interview' | 'decision' | 'terminal'> = {
  aplico: 'screening',
  prefiltro_enviado: 'screening',
  prefiltro_revision: 'screening',
  prefiltro_pasado: 'screening',
  prefiltro_rechazado: 'terminal',
  assessment_invitado: 'assessment',
  assessment_en_progreso: 'assessment',
  assessment_completado: 'assessment',
  entrevista_ia: 'interview',
  bateria_psicometrica: 'assessment',
  recruiter_interview: 'interview',
  cwo_interview: 'interview',
  touring: 'interview',
  terna: 'decision',
  oferta: 'decision',
  contratado: 'terminal',
  rechazado: 'terminal',
};

/** Helper: obtener etiqueta corta con fallback al code */
export function stageLabel(code: string | null | undefined): string {
  if (!code) return '—';
  return STAGE_LABEL_SHORT[code] || code;
}

/** Helper: obtener etiqueta larga con fallback */
export function stageLabelLong(code: string | null | undefined): string {
  if (!code) return '—';
  return STAGE_LABEL_LONG[code] || code;
}

/** Helper: acción a ejecutar en este stage (texto humano) */
export function stageAction(code: string | null | undefined): string | null {
  if (!code) return null;
  return STAGE_ACTION[code] || null;
}

/** Helper: SLA en días para un stage */
export function stageSla(code: string | null | undefined): number | null {
  if (!code) return null;
  return STAGE_SLA_DAYS[code] ?? null;
}
