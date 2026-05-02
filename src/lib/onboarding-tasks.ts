/**
 * Default onboarding tasks template — Trading Solutions
 * Plan estándar 30/60/90 con tareas Day 1, Week 1, Day 30, 60, 90.
 * Customizable por role_level.
 */

export type OnboardingMilestone = 'day1' | 'week1' | 'day30' | 'day60' | 'day90';

export type OnboardingTask = {
  id: string;
  milestone: OnboardingMilestone;
  label: string;
  owner: 'hr' | 'manager' | 'buddy' | 'it' | 'employee';
  done: boolean;
  done_at: string | null;
  notes?: string;
};

export const MILESTONE_LABEL: Record<OnboardingMilestone, string> = {
  day1: 'Día 1',
  week1: 'Semana 1',
  day30: 'Día 30',
  day60: 'Día 60',
  day90: 'Día 90',
};

export const MILESTONE_DAYS: Record<OnboardingMilestone, number> = {
  day1: 1, week1: 7, day30: 30, day60: 60, day90: 90,
};

const BASE_TASKS: Omit<OnboardingTask, 'done' | 'done_at'>[] = [
  // ─── Day 1 ───
  { id: 'd1_welcome_email', milestone: 'day1', label: 'Email de bienvenida con agenda Día 1', owner: 'hr' },
  { id: 'd1_equipment', milestone: 'day1', label: 'Entrega de equipo y accesos físicos', owner: 'it' },
  { id: 'd1_accounts', milestone: 'day1', label: 'Crear cuentas (correo, Slack, sistemas internos)', owner: 'it' },
  { id: 'd1_intro_team', milestone: 'day1', label: 'Presentación con el equipo inmediato', owner: 'manager' },
  { id: 'd1_buddy_intro', milestone: 'day1', label: 'Asignación y presentación con buddy', owner: 'hr' },
  { id: 'd1_office_tour', milestone: 'day1', label: 'Tour por oficina Barranquilla + áreas comunes', owner: 'buddy' },
  { id: 'd1_handbook', milestone: 'day1', label: 'Lectura del handbook + políticas TS', owner: 'employee' },
  { id: 'd1_welcome_lunch', milestone: 'day1', label: 'Almuerzo de bienvenida con buddy', owner: 'buddy' },

  // ─── Week 1 ───
  { id: 'w1_manager_1on1', milestone: 'week1', label: '1:1 con manager · expectativas y rituales', owner: 'manager' },
  { id: 'w1_role_training', milestone: 'week1', label: 'Training inicial del rol (procesos, herramientas)', owner: 'manager' },
  { id: 'w1_first_assignment', milestone: 'week1', label: 'Primer assignment pequeño (entregable end-of-week)', owner: 'manager' },
  { id: 'w1_industry_intro', milestone: 'week1', label: 'Sesión: industria freight forwarding + Trading Solutions', owner: 'manager' },
  { id: 'w1_systems_walkthrough', milestone: 'week1', label: 'Walkthrough sistemas operativos (TMS, CRM, etc.)', owner: 'buddy' },
  { id: 'w1_hr_checkin', milestone: 'week1', label: 'Check-in con HR · cómo se ha sentido', owner: 'hr' },

  // ─── Day 30 ───
  { id: 'd30_okrs', milestone: 'day30', label: 'OKRs / objetivos primer trimestre definidos', owner: 'manager' },
  { id: 'd30_manager_review', milestone: 'day30', label: 'Review informal de 30 días con manager', owner: 'manager' },
  { id: 'd30_hr_pulse', milestone: 'day30', label: 'Pulse check HR · onboarding satisfaction', owner: 'hr' },
  { id: 'd30_first_real_project', milestone: 'day30', label: 'Asignado a primer proyecto/cliente real', owner: 'manager' },
  { id: 'd30_team_integration', milestone: 'day30', label: 'Plenamente integrado en rituales del equipo', owner: 'manager' },

  // ─── Day 60 ───
  { id: 'd60_mid_review', milestone: 'day60', label: 'Mid-onboarding review (productividad esperada)', owner: 'manager' },
  { id: 'd60_feedback_360', milestone: 'day60', label: 'Feedback 360 informal de pares', owner: 'manager' },
  { id: 'd60_growth_plan', milestone: 'day60', label: 'Plan de crecimiento personalizado definido', owner: 'manager' },
  { id: 'd60_culture_immersion', milestone: 'day60', label: 'Inmersión cultural completa (clientes, oficinas, eventos)', owner: 'employee' },

  // ─── Day 90 ───
  { id: 'd90_final_review', milestone: 'day90', label: 'Review final periodo de prueba', owner: 'manager' },
  { id: 'd90_decision_pass', milestone: 'day90', label: 'Decisión: pase a indefinido / extensión / salida', owner: 'manager' },
  { id: 'd90_ramp_up_score', milestone: 'day90', label: 'Calificar ramp-up (1-5)', owner: 'manager' },
  { id: 'd90_employee_feedback', milestone: 'day90', label: 'Feedback del empleado sobre proceso onboarding', owner: 'employee' },
  { id: 'd90_handbook_quiz', milestone: 'day90', label: 'Conocimiento de procesos y políticas validado', owner: 'hr' },
];

export function defaultOnboardingTasks(roleLevel: string = 'entry'): OnboardingTask[] {
  const tasks: OnboardingTask[] = BASE_TASKS.map(t => ({ ...t, done: false, done_at: null }));

  // Lead/C-Suite: agregar tareas extra
  if (roleLevel === 'lead' || roleLevel === 'c_suite') {
    tasks.push(
      { id: 'lead_directs_intro', milestone: 'week1', label: 'Presentación con direct reports + 1:1 inicial', owner: 'manager', done: false, done_at: null },
      { id: 'lead_strategy_session', milestone: 'day30', label: 'Sesión de estrategia del área con liderazgo', owner: 'manager', done: false, done_at: null },
      { id: 'lead_team_ritual_audit', milestone: 'day60', label: 'Auditoría de rituales y procesos del equipo', owner: 'employee', done: false, done_at: null },
    );
  }
  if (roleLevel === 'c_suite') {
    tasks.push(
      { id: 'cs_board_intro', milestone: 'day30', label: 'Presentación con board / accionistas', owner: 'hr', done: false, done_at: null },
      { id: 'cs_external_stakeholders', milestone: 'day60', label: 'Tour por clientes y partners clave', owner: 'employee', done: false, done_at: null },
    );
  }

  return tasks;
}

export function computeProgress(tasks: OnboardingTask[]): {
  total: number; done: number; pct: number;
  byMilestone: Record<OnboardingMilestone, { total: number; done: number; pct: number }>;
} {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const byMilestone: any = {};
  (['day1','week1','day30','day60','day90'] as OnboardingMilestone[]).forEach(m => {
    const ms = tasks.filter(t => t.milestone === m);
    const md = ms.filter(t => t.done).length;
    byMilestone[m] = { total: ms.length, done: md, pct: ms.length ? Math.round((md / ms.length) * 100) : 0 };
  });
  return {
    total, done,
    pct: total ? Math.round((done / total) * 100) : 0,
    byMilestone,
  };
}

export function daysSinceStart(startDate: string): number {
  return Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
}

export function currentMilestone(daysSince: number): OnboardingMilestone {
  if (daysSince < 1) return 'day1';
  if (daysSince < 7) return 'week1';
  if (daysSince < 30) return 'day30';
  if (daysSince < 60) return 'day60';
  return 'day90';
}
