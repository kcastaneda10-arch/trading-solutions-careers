/**
 * Texto en ingles de las Partes 2 y 3 · tetradas DISC y motivadores.
 *
 * Bloque B · las cuatro opciones de cada tetrada deben seguir siendo
 * igual de atractivas y de largo parecido. Si una queda como la respuesta
 * "buena", la eleccion forzada deja de funcionar y las tres graficas se
 * aplanan. Cada clave conserva su eje (a=D, b=I, c=S, d=C): el eje no se
 * traduce, va en items.ts y el candidato nunca lo ve.
 * Las tetradas 12 y 24 van en tono negativo a proposito; en ingles tambien.
 *
 * Bloque C · cada item conserva su motivador y su direccion. Los items
 * invertidos (M-05, M-09, M-10, M-15, M-19, M-20, M-24, M-25, M-29, M-30)
 * siguen invertidos en ingles: si uno se traduce en positivo, el puntaje
 * del motivador queda al reves.
 */
import type { ItemTextEn } from './i18n';

const PROMPT_T = 'Choose the one that describes you MOST and the one that describes you LEAST.';

/** a=D · b=I · c=S · d=C */
const t = (a: string, b: string, c: string, d: string): ItemTextEn => ({
  prompt: PROMPT_T,
  statements: { a, b, c, d },
});

export const ITEMS_EN_BC: Record<string, ItemTextEn> = {
  // ── Parte 2 · 24 tetradas DISC ──────────────────────────────
  'T-01': t('Direct', 'Enthusiastic', 'Patient', 'Precise'),
  'T-02': t('Decisive', 'Sociable', 'Calm', 'Careful'),
  'T-03': t('Competitive', 'Persuasive', 'Loyal', 'Analytical'),
  'T-04': t('Firm', 'Optimistic', 'Steady', 'Orderly'),
  'T-05': t('Forthright', 'Expressive', 'Conciliatory', 'Rigorous'),
  'T-06': t('Determined', 'Upbeat', 'Stable', 'Methodical'),
  'T-07': t('Demanding', 'Convincing', 'Good listener', 'Detail-focused'),
  'T-08': t('Bold', 'Spontaneous', 'Easygoing', 'Prudent'),
  'T-09': t('Independent', 'Approachable', 'Cooperative', 'Systematic'),
  'T-10': t('Challenging', 'Inspiring', 'Predictable', 'Proper'),
  'T-11': t('Takes the lead', 'Well liked', 'Never rattled', 'Checks twice'),
  // tono negativo en las cuatro
  'T-12': t('Impatient', 'Scattered', 'Too agreeable', 'Nitpicky'),
  'T-13': t('Energetic', 'Communicative', 'Friendly', 'Formal'),
  'T-14': t('Assertive', 'Outgoing', 'Modest', 'Reserved'),
  'T-15': t('Gets to the point', 'Builds trust', 'Keeps a steady pace', 'Follows the procedure'),
  'T-16': t('Takes risks', 'Motivates others', 'Supports others', 'Checks details'),
  'T-17': t('Dominant', 'Charming', 'Gentle', 'Perfectionist'),
  'T-18': t('Forceful', 'Cordial', 'Discreet', 'Cautious'),
  'T-19': t('Results-oriented', 'People-oriented', 'Team-oriented', 'Quality-oriented'),
  'T-20': t('Never gives up', 'Breaks the ice', 'Listens before speaking', 'Asks for the data'),
  'T-21': t('Ambitious', 'Cheerful', 'Even-tempered', 'Objective'),
  'T-22': t('Takes charge', 'Wins people over', 'Reaches agreement', 'Shows the evidence'),
  'T-23': t('Quick to decide', 'Easy to talk to', 'Firm in commitments', 'Strict about standards'),
  // tono negativo en las cuatro
  'T-24': t('Stubborn', 'Talks too much', 'Slow to change', 'Gets lost in detail'),

  // ── Parte 3 · 30 motivadores ────────────────────────────────
  // Logro
  'M-01': { stem: 'Finishing something difficult satisfies me more than any praise.' },
  'M-02': { stem: 'I need to see real progress to feel the day was worth it.' },
  'M-03': { stem: 'I test myself with tasks I do not yet know how to do.' },
  'M-04': { stem: 'A job without challenges drains me quickly.' },
  'M-05': { stem: 'I do not care whether the result is good or just acceptable.' }, // invertido
  // Afiliacion
  'M-06': { stem: 'I work better when I get along well with my team.' },
  'M-07': { stem: 'A good work environment matters more to me than a better title.' },
  'M-08': { stem: 'Being included in what the team does matters to me.' },
  'M-09': { stem: 'I can perform just as well without being close to anyone.' }, // invertido
  'M-10': { stem: 'I prefer to work on my own and be left alone.' }, // invertido
  // Influencia
  'M-11': { stem: 'It motivates me when my opinion changes a decision.' },
  'M-12': { stem: 'I want to be where the decisions are made.' },
  'M-13': { stem: 'I enjoy convincing others of an idea.' },
  'M-14': { stem: 'I want to have people reporting to me.' },
  'M-15': { stem: 'I would rather do the work well than lead other people.' }, // invertido
  // Autonomia
  'M-16': { stem: 'I need to decide how I do my work.' },
  'M-17': { stem: 'Being checked at every step takes away my motivation.' },
  'M-18': { stem: 'I perform better when I am given the goal and then left alone.' },
  'M-19': { stem: 'I prefer to be told exactly what to do.' }, // invertido
  'M-20': { stem: 'I feel comfortable working under close supervision.' }, // invertido
  // Seguridad y estabilidad
  'M-21': { stem: 'Job stability weighs heavily in my decisions.' },
  'M-22': { stem: 'I prefer a solid company over a promising new venture.' },
  'M-23': { stem: 'It reassures me to know that the rules are not going to change.' },
  'M-24': { stem: 'I would change jobs for an interesting opportunity even if it were uncertain.' }, // invertido
  'M-25': { stem: 'Uncertainty does not keep me up at night.' }, // invertido
  // Reconocimiento
  'M-26': { stem: 'I need my contribution to be noticed.' },
  'M-27': { stem: 'Public recognition drives me more than a raise.' },
  'M-28': { stem: 'It bothers me when someone else takes credit for my work.' },
  'M-29': { stem: 'I do not mind if nobody finds out what I did.' }, // invertido
  'M-30': { stem: 'I prefer to do my work without being in the spotlight.' }, // invertido
};
