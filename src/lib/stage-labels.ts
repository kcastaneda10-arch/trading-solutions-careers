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
  | 'assessment_invitado'
  | 'assessment_en_progreso'
  | 'assessment_completado'
  | 'entrevista_ia'
  | 'bateria_psicometrica'
  | 'recruiter_interview'
  | 'cwo_interview'
  | 'touring'
  | 'terna'
  | 'oferta'
  | 'contratado'
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
  bateria_psicometrica: 'Pruebas Psicométricas',
  recruiter_interview: 'Recruiter interview',
  cwo_interview: 'Entrevista CWO',
  touring: 'Touring',
  terna: 'Terna',
  oferta: 'Oferta enviada',
  contratado: 'Contratado',
  rechazado: 'Rechazado',
};

/** Etiqueta larga humana — para títulos y tooltips */
export const STAGE_LABEL_LONG: Record<string, string> = {
  aplico: 'Aplicó',
  prefiltro_enviado: 'Prefiltro enviado al candidato',
  prefiltro_revision: 'Esperando revisión del prefiltro',
  prefiltro_pasado: 'Prefiltro aprobado',
  prefiltro_rechazado: 'Prefiltro rechazado',
  assessment_invitado: 'Invitado a prueba de integridad',
  assessment_en_progreso: 'Tomando prueba de integridad',
  assessment_completado: 'Prueba de integridad completada',
  entrevista_ia: 'Entrevista con IA',
  bateria_psicometrica: 'Pruebas Psicométricas',
  recruiter_interview: 'Entrevista con reclutador',
  cwo_interview: 'Entrevista con CWO',
  touring: 'Touring de instalaciones',
  terna: 'En terna final',
  oferta: 'Oferta enviada · esperando respuesta',
  contratado: 'Contratado',
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
  aplico: 3,                    // 3d para mandar prefiltro
  prefiltro_enviado: 5,         // 5d para que candidato responda
  prefiltro_revision: 2,        // 2d para que reclutador revise
  prefiltro_pasado: 2,          // 2d para invitar a Elevare
  assessment_invitado: 5,       // 5d para que candidato tome Elevare
  assessment_en_progreso: 3,    // 3d para terminar Elevare
  assessment_completado: 3,     // 3d para agendar recruiter interview
  entrevista_ia: 3,             // 3d para revisar resultado
  bateria_psicometrica: 5,      // 5d para revisar batería
  recruiter_interview: 5,       // 5d para completar scorecard + decidir
  cwo_interview: 5,             // 5d para que CWO decida
  touring: 5,                   // 5d para programar/realizar touring
  terna: 7,                     // 7d para selección final
  oferta: 7,                    // 7d para que candidato responda
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
