/**
 * Bateria de Seleccion TS · banco de items
 *
 * El banco vive en git, no en la base de datos: la ficha tecnica exige control
 * de versiones y que no se comparen candidatos evaluados con versiones distintas.
 * Cambiar un item obliga a subir BATTERY_VERSION.
 *
 * v2.0 · bateria GENERAL, aplica a cualquier cargo. El conocimiento tecnico
 * NO se mide aqui: se evalua en el assessment presencial.
 *
 * 172 items · ~95 min · una sola sesion
 *   Parte 1  Personalidad     60  Cinco Grandes, 15 facetas, escala de 7 puntos
 *   Parte 2  Estilo           24  tetradas de eleccion forzada (DISC, 3 graficas)
 *   Parte 3  Motivadores      30  6 motivadores, escala normativa comparable
 *   Parte 4  Razonamiento     28  contenido neutro, cronometrado
 *   Parte 5  Integridad       30  6 dimensiones + controles de validez
 *
 * Contenido propio. El modelo de los Cinco Grandes y el de Marston son ciencia
 * publica; la redaccion de cada item, de cada arquetipo y de cada informe es
 * nuestra. No se reproduce contenido de ningun instrumento comercial.
 */

export const BATTERY_VERSION = '2.0';

/** Version del texto de habeas data. Se guarda con cada consentimiento: en una
 *  auditoria hay que poder demostrar QUE acepto el candidato, no solo que acepto. */
export const CONSENT_TEXT_VERSION = 'hd-2026-09-08';

export type Block = 'A' | 'B' | 'C' | 'D' | 'E';

type Base = {
  code: string;
  block: Block;
  /** Faceta, eje o dimension. Nunca se envia al candidato. */
  subdomain: string;
  /** Nunca se envia al candidato. Solo para el informe y la auditoria. */
  hiddenLabel: string;
};

export type LikertItem = Base & {
  type: 'likert';
  stem: string;
  scale: 5 | 7;
  /** true = puntua invertido */
  reverse?: boolean;
  /** item de deseabilidad social */
  sd?: boolean;
  /** par de consistencia */
  pairWith?: string;
};

export type TetradItem = Base & {
  type: 'tetrad';
  prompt: string;
  statements: { key: string; text: string; axis: 'D' | 'I' | 'S' | 'C' }[];
};

export type MCItem = Base & {
  type: 'mc';
  stem: string;
  options: { key: string; text: string }[];
  answer: string;
  rationale: string;
};

export type FigureItem = Base & {
  type: 'figure';
  stem: string;
  matrixSvg: string;
  options: { key: string; svg: string; alt: string }[];
  answer: string;
  rationale: string;
};

export type SituationalItem = Base & {
  type: 'situational';
  stem: string;
  options: { key: string; text: string; effectiveness: number }[];
  rationale: string;
};

export type Item = LikertItem | TetradItem | MCItem | FigureItem | SituationalItem;

/** Metadatos de cada parte tal como los ve el candidato: sin nombre del constructo. */
export const BLOCKS: Record<Block, { label: string; intro: string; timedSeconds: number | null }> = {
  A: {
    label: 'Parte 1 de 5',
    intro:
      'Va a leer una serie de afirmaciones. Indique qué tan de acuerdo está con cada una, pensando en cómo es usted normalmente y no en cómo le gustaría ser. No hay respuestas correctas ni incorrectas, y esta parte no tiene tiempo. Responda con lo primero que le parezca; pensarlo demasiado no mejora el resultado.',
    timedSeconds: null,
  },
  B: {
    label: 'Parte 2 de 5',
    intro:
      'En cada grupo verá cuatro palabras o frases. Elija la que MÁS lo describe y la que MENOS lo describe. Las cuatro pueden parecerle parecidas: escoja de todos modos. Sin tiempo.',
    timedSeconds: null,
  },
  C: {
    label: 'Parte 3 de 5',
    intro: 'Otra serie de afirmaciones, esta vez sobre lo que le importa en el trabajo. Igual que antes: qué tan de acuerdo está. Sin tiempo.',
    timedSeconds: null,
  },
  D: {
    label: 'Parte 4 de 5',
    intro:
      'Esta parte sí tiene tiempo. No requiere conocimientos previos de ningún oficio: todo lo necesario está en cada pregunta. Si no está seguro, elija la que le parezca más razonable y siga.',
    timedSeconds: 30 * 60,
  },
  E: {
    label: 'Parte 5 de 5',
    intro: 'Última parte. Indique su grado de acuerdo, o elija la opción que le parezca más razonable. Responda con franqueza. Sin tiempo.',
    timedSeconds: null,
  },
};

// ────────────────────────────────────────────────────────────
// Helpers de SVG para los items figurales
// ────────────────────────────────────────────────────────────
const SV = (inner: string) =>
  `<svg viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="68" height="68" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.3"/><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${inner}</g></svg>`;

const GRID = (cells: string) =>
  `<svg viewBox="0 0 330 240" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.3"><rect x="10" y="10" width="70" height="70"/><rect x="90" y="10" width="70" height="70"/><rect x="170" y="10" width="70" height="70"/><rect x="10" y="90" width="70" height="70"/><rect x="90" y="90" width="70" height="70"/><rect x="170" y="90" width="70" height="70"/><rect x="10" y="170" width="70" height="70"/><rect x="90" y="170" width="70" height="70"/></g>${cells}<rect x="170" y="170" width="70" height="70" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/><text x="205" y="213" text-anchor="middle" font-family="monospace" font-size="26" fill="currentColor" opacity="0.5">?</text></svg>`;

const TRI = '<polygon points="35,14 54,56 16,56"/>';
const dotsAt = (n: number) => {
  const pos = [[35, 35], [25, 25], [45, 45], [45, 25], [25, 45], [35, 20]];
  return pos.slice(0, n).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="currentColor"/>`).join('');
};

// ════════════════════════════════════════════════════════════
// PARTE 1 · PERSONALIDAD · Cinco Grandes · 60 items · escala de 7
// 5 factores × 3 facetas × 4 items. Mitad de los items invertidos,
// para que marcar siempre "de acuerdo" no produzca un perfil alto.
// ════════════════════════════════════════════════════════════
const P = (n: number, sub: string, label: string, stem: string, reverse?: boolean): LikertItem => ({
  code: `P-${String(n).padStart(2, '0')}`,
  block: 'A',
  subdomain: sub,
  hiddenLabel: label,
  type: 'likert',
  scale: 7,
  stem,
  ...(reverse ? { reverse: true } : {}),
});

const BLOCK_A: Item[] = [
  // ── Extraversion · sociabilidad ──
  P(1, 'EXT-soc', 'Extraversión · sociabilidad', 'Me siento cómodo entrando a un grupo donde no conozco a nadie.'),
  P(2, 'EXT-soc', 'Extraversión · sociabilidad', 'Después de un día largo, me repone más ver gente que quedarme solo.'),
  P(3, 'EXT-soc', 'Extraversión · sociabilidad', 'Prefiero un fin de semana tranquilo en casa antes que un plan con mucha gente.', true),
  P(4, 'EXT-soc', 'Extraversión · sociabilidad', 'En una reunión grande, hablo solo si me preguntan.', true),
  // ── Extraversion · asertividad ──
  P(5, 'EXT-ase', 'Extraversión · asertividad', 'Cuando el grupo no se decide, termino tomando yo la iniciativa.'),
  P(6, 'EXT-ase', 'Extraversión · asertividad', 'Digo lo que pienso aunque sepa que no va a caer bien.'),
  P(7, 'EXT-ase', 'Extraversión · asertividad', 'Me cuesta llevarle la contraria a alguien de frente.', true),
  P(8, 'EXT-ase', 'Extraversión · asertividad', 'Prefiero que otro lleve la vocería.', true),
  // ── Extraversion · energia ──
  P(9, 'EXT-ene', 'Extraversión · energía', 'La gente me describe como una persona con mucha energía.'),
  P(10, 'EXT-ene', 'Extraversión · energía', 'Se me nota cuando algo me entusiasma.'),
  P(11, 'EXT-ene', 'Extraversión · energía', 'Mantengo un ritmo pausado, sin acelerarme.', true),
  P(12, 'EXT-ene', 'Extraversión · energía', 'Rara vez me emociono de forma visible.', true),

  // ── Apertura · curiosidad ──
  P(13, 'APE-cur', 'Apertura · curiosidad intelectual', 'Me interesan temas que no tienen nada que ver con mi trabajo.'),
  P(14, 'APE-cur', 'Apertura · curiosidad intelectual', 'Cuando algo me llama la atención, leo hasta entenderlo bien.'),
  P(15, 'APE-cur', 'Apertura · curiosidad intelectual', 'Prefiero aplicar lo que ya sé antes que ponerme a estudiar algo nuevo.', true),
  P(16, 'APE-cur', 'Apertura · curiosidad intelectual', 'Las discusiones sobre ideas abstractas me aburren.', true),
  // ── Apertura · imaginacion ──
  P(17, 'APE-ima', 'Apertura · generación de ideas', 'Se me ocurren maneras distintas de hacer cosas que ya funcionan.'),
  P(18, 'APE-ima', 'Apertura · generación de ideas', 'Disfruto imaginando escenarios que todavía no existen.'),
  P(19, 'APE-ima', 'Apertura · generación de ideas', 'Soy más de aterrizar ideas que de generarlas.', true),
  P(20, 'APE-ima', 'Apertura · generación de ideas', 'Me cuesta pensar en algo sin tener el caso concreto delante.', true),
  // ── Apertura · cambio ──
  P(21, 'APE-cam', 'Apertura · adaptación al cambio', 'Un cambio de planes me parece más una oportunidad que un problema.'),
  P(22, 'APE-cam', 'Apertura · adaptación al cambio', 'Me acomodo rápido a una forma nueva de trabajar.'),
  P(23, 'APE-cam', 'Apertura · adaptación al cambio', 'Prefiero los procesos que ya conozco, aunque existan opciones más nuevas.', true),
  P(24, 'APE-cam', 'Apertura · adaptación al cambio', 'Los cambios frecuentes me desgastan.', true),

  // ── Amabilidad · empatia ──
  P(25, 'AMA-emp', 'Amabilidad · empatía', 'Me doy cuenta rápido cuando alguien está incómodo aunque no lo diga.'),
  P(26, 'AMA-emp', 'Amabilidad · empatía', 'Me importa cómo queda la otra persona después de una conversación difícil.'),
  P(27, 'AMA-emp', 'Amabilidad · empatía', 'Me cuesta ponerme en el lugar del otro cuando no comparto su reacción.', true),
  P(28, 'AMA-emp', 'Amabilidad · empatía', 'Lo que le pase a la gente fuera del trabajo no es asunto mío.', true),
  // ── Amabilidad · cooperacion ──
  P(29, 'AMA-coo', 'Amabilidad · cooperación', 'Prefiero llegar a un acuerdo antes que imponer mi posición.'),
  P(30, 'AMA-coo', 'Amabilidad · cooperación', 'Cedo en lo que no es esencial para no romper la relación.'),
  P(31, 'AMA-coo', 'Amabilidad · cooperación', 'Cuando tengo la razón, la sostengo hasta el final.', true),
  P(32, 'AMA-coo', 'Amabilidad · cooperación', 'Negociar posiciones me parece perder tiempo.', true),
  // ── Amabilidad · confianza ──
  P(33, 'AMA-con', 'Amabilidad · confianza en otros', 'Doy por sentado que la gente actúa de buena fe.'),
  P(34, 'AMA-con', 'Amabilidad · confianza en otros', 'Puedo confiar en lo que me dicen sin verificarlo todo.'),
  P(35, 'AMA-con', 'Amabilidad · confianza en otros', 'Con la gente nueva soy reservado hasta ver de qué está hecha.', true),
  P(36, 'AMA-con', 'Amabilidad · confianza en otros', 'Suelo pensar que hay un interés propio detrás de lo que la gente dice.', true),

  // ── Responsabilidad · orden ──
  P(37, 'RES-ord', 'Responsabilidad · orden', 'Mi espacio y mis archivos de trabajo están ordenados.'),
  P(38, 'RES-ord', 'Responsabilidad · orden', 'Antes de empezar algo, organizo lo que voy a necesitar.'),
  P(39, 'RES-ord', 'Responsabilidad · orden', 'Trabajo bien en medio del desorden.', true),
  P(40, 'RES-ord', 'Responsabilidad · orden', 'Se me pierden cosas entre mis propios papeles y carpetas.', true),
  // ── Responsabilidad · disciplina ──
  P(41, 'RES-dis', 'Responsabilidad · disciplina', 'Cuando me comprometo con algo lo termino, aunque deje de gustarme.'),
  P(42, 'RES-dis', 'Responsabilidad · disciplina', 'Cumplo los plazos que yo mismo me pongo, no solo los que me ponen.'),
  P(43, 'RES-dis', 'Responsabilidad · disciplina', 'Dejo para después lo que no me provoca hacer.', true),
  P(44, 'RES-dis', 'Responsabilidad · disciplina', 'Empiezo más cosas de las que termino.', true),
  // ── Responsabilidad · logro ──
  P(45, 'RES-log', 'Responsabilidad · orientación al logro', 'Me pongo metas más altas de las que me piden.'),
  P(46, 'RES-log', 'Responsabilidad · orientación al logro', 'No me conformo con que algo quede apenas aceptable.'),
  P(47, 'RES-log', 'Responsabilidad · orientación al logro', 'Prefiero un ritmo sostenible antes que exigirme al máximo.', true),
  P(48, 'RES-log', 'Responsabilidad · orientación al logro', 'Me da igual destacar, mientras cumpla con lo mío.', true),

  // ── Estabilidad · calma ──
  P(49, 'EST-cal', 'Estabilidad · calma bajo presión', 'En una situación tensa me mantengo tranquilo.'),
  P(50, 'EST-cal', 'Estabilidad · calma bajo presión', 'Bajo presión pienso con la misma claridad de siempre.'),
  P(51, 'EST-cal', 'Estabilidad · calma bajo presión', 'Cuando se complican las cosas se me nota la tensión.', true),
  P(52, 'EST-cal', 'Estabilidad · calma bajo presión', 'Los imprevistos me alteran.', true),
  // ── Estabilidad · seguridad ──
  P(53, 'EST-seg', 'Estabilidad · seguridad en sí mismo', 'Confío en mi criterio aunque otros opinen distinto.'),
  P(54, 'EST-seg', 'Estabilidad · seguridad en sí mismo', 'No necesito que me confirmen que hice bien mi trabajo.'),
  P(55, 'EST-seg', 'Estabilidad · seguridad en sí mismo', 'Le doy muchas vueltas a si tomé la decisión correcta.', true),
  P(56, 'EST-seg', 'Estabilidad · seguridad en sí mismo', 'Una crítica me hace dudar de mí.', true),
  // ── Estabilidad · regulacion ──
  P(57, 'EST-reg', 'Estabilidad · recuperación', 'Cuando algo me molesta, se me pasa rápido.'),
  P(58, 'EST-reg', 'Estabilidad · recuperación', 'Puedo dejar el trabajo en el trabajo.'),
  P(59, 'EST-reg', 'Estabilidad · recuperación', 'Me quedo pensando en una conversación incómoda mucho después de que pasó.', true),
  P(60, 'EST-reg', 'Estabilidad · recuperación', 'Un mal rato en la mañana me daña el resto del día.', true),
];

// ════════════════════════════════════════════════════════════
// PARTE 2 · ESTILO · 24 tetradas de eleccion forzada (DISC)
//
// Formato clasico de Marston: en cada tetrada una palabra por eje.
// El MAS y el MENOS producen dos perfiles distintos, y de la diferencia
// entre ambos sale el tercero:
//   Grafica I   · lo que MAS eligio  → mascara social, el yo publico
//   Grafica II  · lo que MENOS eligio → el yo bajo presion, instintivo
//   Grafica III · I − II              → el yo natural, el perfil de trabajo
// Dos tetradas (12 y 24) tienen las cuatro palabras en tono negativo:
// sin ellas, marcar siempre lo mas amable produce un perfil plano.
// ════════════════════════════════════════════════════════════
const T = (n: number, d: string, i: string, s: string, c: string): TetradItem => ({
  code: `T-${String(n).padStart(2, '0')}`,
  block: 'B',
  subdomain: 'DISC',
  hiddenLabel: `Tétrada ${n}`,
  type: 'tetrad',
  prompt: 'Elija la que MÁS lo describe y la que MENOS lo describe.',
  statements: [
    { key: 'a', text: d, axis: 'D' },
    { key: 'b', text: i, axis: 'I' },
    { key: 'c', text: s, axis: 'S' },
    { key: 'd', text: c, axis: 'C' },
  ],
});

const BLOCK_B: Item[] = [
  T(1, 'Directo', 'Entusiasta', 'Paciente', 'Preciso'),
  T(2, 'Decidido', 'Sociable', 'Sereno', 'Cuidadoso'),
  T(3, 'Competitivo', 'Persuasivo', 'Leal', 'Analítico'),
  T(4, 'Firme', 'Optimista', 'Constante', 'Ordenado'),
  T(5, 'Frontal', 'Expresivo', 'Conciliador', 'Riguroso'),
  T(6, 'Resuelto', 'Animado', 'Estable', 'Metódico'),
  T(7, 'Exigente', 'Convincente', 'Buen oyente', 'Detallista'),
  T(8, 'Audaz', 'Espontáneo', 'Tranquilo', 'Prudente'),
  T(9, 'Independiente', 'Cercano', 'Cooperador', 'Sistemático'),
  T(10, 'Retador', 'Inspirador', 'Predecible', 'Correcto'),
  T(11, 'Toma la delantera', 'Cae bien', 'No se altera', 'Revisa dos veces'),
  T(12, 'Impaciente', 'Se dispersa', 'Complaciente', 'Quisquilloso'),
  T(13, 'Enérgico', 'Comunicativo', 'Amable', 'Formal'),
  T(14, 'Asertivo', 'Extrovertido', 'Modesto', 'Reservado'),
  T(15, 'Va al grano', 'Genera confianza', 'Sostiene el ritmo', 'Sigue el procedimiento'),
  T(16, 'Se arriesga', 'Motiva', 'Acompaña', 'Verifica'),
  T(17, 'Dominante', 'Encantador', 'Apacible', 'Perfeccionista'),
  T(18, 'Contundente', 'Cordial', 'Discreto', 'Cauteloso'),
  T(19, 'Orientado al resultado', 'Orientado a las personas', 'Orientado al equipo', 'Orientado a la calidad'),
  T(20, 'No se rinde', 'Rompe el hielo', 'Escucha antes de hablar', 'Pregunta por el dato'),
  T(21, 'Ambicioso', 'Alegre', 'Ecuánime', 'Objetivo'),
  T(22, 'Se impone', 'Convence', 'Acuerda', 'Demuestra'),
  T(23, 'Rápido para decidir', 'Fácil para relacionarse', 'Firme en el compromiso', 'Estricto con el estándar'),
  T(24, 'Terco', 'Habla de más', 'Lento para cambiar', 'Se pierde en el detalle'),
];

// ════════════════════════════════════════════════════════════
// PARTE 3 · MOTIVADORES · 30 items · escala de 7 · normativa
//
// Seis motivadores, cinco items cada uno. Escala normativa a proposito:
// los repartos ipsativos dicen el orden interno pero no permiten comparar
// candidatos, y para retencion hace falta saber cuanto, no solo cual.
// El informe reporta las dos lecturas: nivel y jerarquia interna.
// ════════════════════════════════════════════════════════════
const M = (n: number, sub: string, label: string, stem: string, reverse?: boolean): LikertItem => ({
  code: `M-${String(n).padStart(2, '0')}`,
  block: 'C',
  subdomain: sub,
  hiddenLabel: label,
  type: 'likert',
  scale: 7,
  stem,
  ...(reverse ? { reverse: true } : {}),
});

const BLOCK_C: Item[] = [
  // Logro
  M(1, 'MOT-log', 'Logro', 'Terminar algo difícil me deja más satisfecho que cualquier felicitación.'),
  M(2, 'MOT-log', 'Logro', 'Necesito ver avance concreto para sentir que el día valió la pena.'),
  M(3, 'MOT-log', 'Logro', 'Me pongo a prueba con tareas que todavía no sé hacer.'),
  M(4, 'MOT-log', 'Logro', 'Un trabajo sin retos me apaga rápido.'),
  M(5, 'MOT-log', 'Logro', 'Me da igual si el resultado es bueno o apenas aceptable.', true),
  // Afiliacion
  M(6, 'MOT-afi', 'Afiliación', 'Trabajo mejor cuando me llevo bien con el equipo.'),
  M(7, 'MOT-afi', 'Afiliación', 'Un buen ambiente pesa más que un cargo mejor.'),
  M(8, 'MOT-afi', 'Afiliación', 'Que me inviten a lo del equipo me importa.'),
  M(9, 'MOT-afi', 'Afiliación', 'Puedo rendir igual aunque no tenga cercanía con nadie.', true),
  M(10, 'MOT-afi', 'Afiliación', 'Prefiero trabajar solo y que me dejen tranquilo.', true),
  // Influencia
  M(11, 'MOT-inf', 'Influencia', 'Me motiva que mi opinión cambie una decisión.'),
  M(12, 'MOT-inf', 'Influencia', 'Busco estar donde se deciden las cosas.'),
  M(13, 'MOT-inf', 'Influencia', 'Disfruto convenciendo a otros de una idea.'),
  M(14, 'MOT-inf', 'Influencia', 'Aspiro a tener gente a cargo.'),
  M(15, 'MOT-inf', 'Influencia', 'Prefiero ejecutar bien antes que dirigir.', true),
  // Autonomia
  M(16, 'MOT-aut', 'Autonomía', 'Necesito decidir cómo hago mi trabajo.'),
  M(17, 'MOT-aut', 'Autonomía', 'Que me revisen paso a paso me desmotiva.'),
  M(18, 'MOT-aut', 'Autonomía', 'Rindo más cuando me dan el objetivo y me sueltan.'),
  M(19, 'MOT-aut', 'Autonomía', 'Prefiero que me digan exactamente qué hacer.', true),
  M(20, 'MOT-aut', 'Autonomía', 'Me siento cómodo trabajando con supervisión cercana.', true),
  // Seguridad
  M(21, 'MOT-seg', 'Seguridad y estabilidad', 'La estabilidad del empleo pesa mucho en mis decisiones.'),
  M(22, 'MOT-seg', 'Seguridad y estabilidad', 'Prefiero una empresa sólida antes que un proyecto prometedor.'),
  M(23, 'MOT-seg', 'Seguridad y estabilidad', 'Me tranquiliza saber que las reglas del juego no van a cambiar.'),
  M(24, 'MOT-seg', 'Seguridad y estabilidad', 'Cambiaría de trabajo por una oportunidad interesante aunque fuera incierta.', true),
  M(25, 'MOT-seg', 'Seguridad y estabilidad', 'La incertidumbre no me quita el sueño.', true),
  // Reconocimiento
  M(26, 'MOT-rec', 'Reconocimiento', 'Necesito que se note lo que aporté.'),
  M(27, 'MOT-rec', 'Reconocimiento', 'Un reconocimiento público me impulsa más que un ajuste de sueldo.'),
  M(28, 'MOT-rec', 'Reconocimiento', 'Me molesta que el crédito de mi trabajo se lo lleve otro.'),
  M(29, 'MOT-rec', 'Reconocimiento', 'Me da lo mismo si nadie se entera de lo que hice.', true),
  M(30, 'MOT-rec', 'Reconocimiento', 'Prefiero trabajar sin figurar.', true),
];

// ════════════════════════════════════════════════════════════
// PARTE 4 · RAZONAMIENTO · 28 items · 30 min · contenido neutro
//
// Ni una sola pregunta usa material de logistica, calidad o seguridad.
// Un item de razonamiento con contenido de oficio deja de medir razonamiento
// y empieza a medir experiencia previa. Todas las alternativas figurales se
// dibujan: describirlas con palabras lo convierte en comprension lectora.
// ════════════════════════════════════════════════════════════

// Primitivas de dibujo · centro (x,y) dentro de una celda de 70×70
const cx_ = (col: number) => 10 + col * 80 + 35;
const cy_ = (row: number) => 10 + row * 80 + 35;
const circ = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="17"/>`;
const squa = (x: number, y: number) => `<rect x="${x - 17}" y="${y - 17}" width="34" height="34"/>`;
const tria = (x: number, y: number) => `<polygon points="${x},${y - 19} ${x + 19},${y + 19} ${x - 19},${y + 19}"/>`;
const pent = (x: number, y: number) =>
  `<polygon points="${x},${y - 20} ${x + 19},${y - 6.2} ${x + 11.8},${y + 16.2} ${x - 11.8},${y + 16.2} ${x - 19},${y - 6.2}"/>`;
const vln = (x: number, y: number) => `<line x1="${x}" y1="${y - 19}" x2="${x}" y2="${y + 19}"/>`;
const hln = (x: number, y: number) => `<line x1="${x - 19}" y1="${y}" x2="${x + 19}" y2="${y}"/>`;
const dgl = (x: number, y: number) => `<line x1="${x - 15}" y1="${y - 15}" x2="${x + 15}" y2="${y + 15}"/>`;
const pts = (x: number, y: number, n: number) => {
  const off = [[0, 0], [-9, -9], [9, 9]];
  return off.slice(0, n).map(([a, b]) => `<circle cx="${x + a}" cy="${y + b}" r="4" fill="currentColor"/>`).join('');
};
/** Escuadra en L · rot 0=esquina inf-izq, 1=sup-izq, 2=sup-der, 3=inf-der */
const elle = (x: number, y: number, rot: number) => {
  const a = x - 16, b = x + 16, c = y - 16, d = y + 16;
  const seg = [
    [`<line x1="${a}" y1="${c}" x2="${a}" y2="${d}"/>`, `<line x1="${a}" y1="${d}" x2="${b}" y2="${d}"/>`],
    [`<line x1="${a}" y1="${c}" x2="${b}" y2="${c}"/>`, `<line x1="${a}" y1="${c}" x2="${a}" y2="${d}"/>`],
    [`<line x1="${a}" y1="${c}" x2="${b}" y2="${c}"/>`, `<line x1="${b}" y1="${c}" x2="${b}" y2="${d}"/>`],
    [`<line x1="${b}" y1="${c}" x2="${b}" y2="${d}"/>`, `<line x1="${a}" y1="${d}" x2="${b}" y2="${d}"/>`],
  ][rot];
  return seg.join('');
};
const INK = (inner: string) => `<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${inner}</g>`;

const R = (n: number, sub: string, label: string, stem: string, opts: string[], answer: string, rationale: string): MCItem => ({
  code: `R-${String(n).padStart(2, '0')}`,
  block: 'D',
  subdomain: sub,
  hiddenLabel: label,
  type: 'mc',
  stem,
  options: opts.map((text, k) => ({ key: 'ABCD'[k], text })),
  answer,
  rationale,
});

const F = (
  n: number, sub: string, label: string, stem: string, matrixSvg: string,
  opts: { svg: string; alt: string }[], answer: string, rationale: string
): FigureItem => ({
  code: `R-${String(n).padStart(2, '0')}`,
  block: 'D',
  subdomain: sub,
  hiddenLabel: label,
  type: 'figure',
  stem,
  matrixSvg,
  options: opts.map((o, k) => ({ key: 'ABCD'[k], svg: o.svg, alt: o.alt })),
  answer,
  rationale,
});

const BLOCK_D: Item[] = [
  // ── Series numericas (6) ──
  R(1, 'RAZ-num', 'Inducción numérica', '¿Qué número continúa la serie?\n\n3 · 6 · 11 · 18 · 27 · ?',
    ['34', '36', '38', '40'], 'C',
    'Diferencias +3, +5, +7, +9 → +11. A repite la diferencia anterior; B ve cuadrados; D salta a +13.'),
  R(2, 'RAZ-num', 'Inducción numérica', '¿Qué número continúa la serie?\n\n2 · 6 · 12 · 20 · 30 · ?',
    ['40', '42', '44', '46'], 'B',
    'Diferencias +4, +6, +8, +10 → +12. A es el error de repetir la última diferencia.'),
  R(3, 'RAZ-num', 'Inducción numérica', '¿Qué número continúa la serie?\n\n1 · 2 · 4 · 8 · 16 · ?',
    ['24', '30', '32', '64'], 'C',
    'Duplicación. A suma la diferencia anterior; D duplica dos veces.'),
  R(4, 'RAZ-num', 'Inducción numérica', '¿Qué número continúa la serie?\n\n81 · 27 · 9 · 3 · ?',
    ['0', '1', '1,5', '2'], 'B',
    'División entre 3. A confunde dividir con restar hasta cero.'),
  R(5, 'RAZ-num', 'Inducción numérica', '¿Qué número continúa la serie?\n\n2 · 3 · 5 · 8 · 13 · ?',
    ['18', '20', '21', '26'], 'C',
    'Cada término es la suma de los dos anteriores. A y B suman diferencias constantes; D duplica.'),
  R(6, 'RAZ-num', 'Inducción numérica', '¿Qué número continúa la serie?\n\n5 · 11 · 23 · 47 · ?',
    ['71', '84', '94', '95'], 'D',
    'Cada término es el doble del anterior más uno. C es el error de solo duplicar.'),

  // ── Matrices figurales (8) ──
  F(7, 'RAZ-abs', 'Razonamiento abstracto', 'Complete la matriz.',
    GRID(INK([
      circ(cx_(0), cy_(0)),
      circ(cx_(1), cy_(0)) + vln(cx_(1), cy_(0)),
      circ(cx_(2), cy_(0)) + vln(cx_(2), cy_(0)) + hln(cx_(2), cy_(0)),
      squa(cx_(0), cy_(1)),
      squa(cx_(1), cy_(1)) + vln(cx_(1), cy_(1)),
      squa(cx_(2), cy_(1)) + vln(cx_(2), cy_(1)) + hln(cx_(2), cy_(1)),
      tria(cx_(0), cy_(2)),
      tria(cx_(1), cy_(2)) + `<line x1="${cx_(1)}" y1="${cy_(2) - 19}" x2="${cx_(1)}" y2="${cy_(2) + 19}"/>`,
    ].join(''))),
    [
      { svg: SV(TRI), alt: 'Triángulo simple' },
      { svg: SV(TRI + '<line x1="35" y1="14" x2="35" y2="56"/>'), alt: 'Triángulo con una línea vertical' },
      { svg: SV(TRI + '<line x1="35" y1="14" x2="35" y2="56"/><line x1="23" y1="40" x2="47" y2="40"/>'), alt: 'Triángulo con línea vertical y horizontal' },
      { svg: SV(TRI + '<line x1="28" y1="30" x2="28" y2="56"/><line x1="42" y1="30" x2="42" y2="56"/>'), alt: 'Triángulo con dos líneas verticales' },
    ], 'C',
    'Doble entrada: la fila define la figura base, la columna el número de líneas internas acumuladas. D es el error de captar "dos líneas" sin la orientación.'),

  F(8, 'RAZ-abs', 'Razonamiento abstracto', 'Complete la matriz.',
    GRID(INK([
      pts(cx_(0), cy_(0), 1), pts(cx_(1), cy_(0), 2), pts(cx_(2), cy_(0), 3),
      pts(cx_(0), cy_(1), 2), pts(cx_(1), cy_(1), 3), `<circle cx="${cx_(2)}" cy="${cy_(1)}" r="4" fill="currentColor"/><circle cx="${cx_(2) - 9}" cy="${cy_(1) - 9}" r="4" fill="currentColor"/><circle cx="${cx_(2) + 9}" cy="${cy_(1) + 9}" r="4" fill="currentColor"/><circle cx="${cx_(2) + 9}" cy="${cy_(1) - 9}" r="4" fill="currentColor"/>`,
      pts(cx_(0), cy_(2), 3),
      `<circle cx="${cx_(1)}" cy="${cy_(2)}" r="4" fill="currentColor"/><circle cx="${cx_(1) - 9}" cy="${cy_(2) - 9}" r="4" fill="currentColor"/><circle cx="${cx_(1) + 9}" cy="${cy_(2) + 9}" r="4" fill="currentColor"/><circle cx="${cx_(1) + 9}" cy="${cy_(2) - 9}" r="4" fill="currentColor"/>`,
    ].join(''))),
    [
      { svg: SV(dotsAt(4)), alt: 'Cuatro puntos' },
      { svg: SV(dotsAt(5)), alt: 'Cinco puntos' },
      { svg: SV(dotsAt(3)), alt: 'Tres puntos' },
      { svg: SV(dotsAt(6)), alt: 'Seis puntos' },
    ], 'B',
    'El número de puntos es fila + columna − 1. La celda faltante es fila 3, columna 3 → cinco puntos. A y D son contar uno de menos o uno de más.'),

  F(9, 'RAZ-abs', 'Razonamiento abstracto', '¿Cuál de las cuatro figuras NO pertenece al grupo?', '',
    [
      { svg: SV('<rect x="18" y="18" width="34" height="34"/><line x1="18" y1="18" x2="52" y2="52"/>'), alt: 'Cuadrado con una diagonal' },
      { svg: SV('<polygon points="35,16 54,35 35,54 16,35"/><line x1="35" y1="16" x2="35" y2="54"/>'), alt: 'Rombo con una línea' },
      { svg: SV('<circle cx="35" cy="35" r="19"/><line x1="16" y1="35" x2="54" y2="35"/><line x1="35" y1="16" x2="35" y2="54"/>'), alt: 'Círculo con dos líneas' },
      { svg: SV(TRI + '<line x1="35" y1="14" x2="35" y2="56"/>'), alt: 'Triángulo con una línea' },
    ], 'C',
    'Las otras tres tienen una sola línea interna; C tiene dos. La forma exterior es irrelevante y funciona como distractor de superficie.'),

  F(10, 'RAZ-abs', 'Razonamiento abstracto', 'La tercera figura de cada fila combina las dos anteriores. Complete la matriz.',
    GRID(INK([
      vln(cx_(0), cy_(0)), hln(cx_(1), cy_(0)), vln(cx_(2), cy_(0)) + hln(cx_(2), cy_(0)),
      circ(cx_(0), cy_(1)), squa(cx_(1), cy_(1)), circ(cx_(2), cy_(1)) + squa(cx_(2), cy_(1)),
      tria(cx_(0), cy_(2)), hln(cx_(1), cy_(2)),
    ].join(''))),
    [
      { svg: SV(TRI), alt: 'Triángulo solo' },
      { svg: SV(TRI + '<line x1="16" y1="35" x2="54" y2="35"/>'), alt: 'Triángulo con una línea horizontal' },
      { svg: SV(TRI + '<line x1="35" y1="14" x2="35" y2="56"/>'), alt: 'Triángulo con una línea vertical' },
      { svg: SV('<line x1="16" y1="35" x2="54" y2="35"/>'), alt: 'Solo una línea horizontal' },
    ], 'B',
    'Superposición: la tercera celda contiene los elementos de las dos primeras. C cambia la orientación de la línea; D olvida la figura.'),

  F(11, 'RAZ-abs', 'Razonamiento abstracto', 'Complete la matriz.',
    GRID(INK([
      elle(cx_(0), cy_(0), 0), elle(cx_(1), cy_(0), 1), elle(cx_(2), cy_(0), 2),
      elle(cx_(0), cy_(1), 1), elle(cx_(1), cy_(1), 2), elle(cx_(2), cy_(1), 3),
      elle(cx_(0), cy_(2), 2), elle(cx_(1), cy_(2), 3),
    ].join(''))),
    [
      { svg: SV(elle(35, 35, 0)), alt: 'Escuadra con la esquina abajo a la izquierda' },
      { svg: SV(elle(35, 35, 1)), alt: 'Escuadra con la esquina arriba a la izquierda' },
      { svg: SV(elle(35, 35, 2)), alt: 'Escuadra con la esquina arriba a la derecha' },
      { svg: SV(elle(35, 35, 3)), alt: 'Escuadra con la esquina abajo a la derecha' },
    ], 'A',
    'La escuadra gira un cuarto de vuelta por columna y arranca una posición más adelante en cada fila. Después de la cuarta posición vuelve a la primera.'),

  F(12, 'RAZ-abs', 'Razonamiento abstracto', 'Complete la matriz.',
    GRID(INK([
      tria(cx_(0), cy_(0)), squa(cx_(1), cy_(0)), pent(cx_(2), cy_(0)),
      tria(cx_(0), cy_(1)) + pts(cx_(0), cy_(1), 1), squa(cx_(1), cy_(1)) + pts(cx_(1), cy_(1), 1), pent(cx_(2), cy_(1)) + pts(cx_(2), cy_(1), 1),
      tria(cx_(0), cy_(2)) + pts(cx_(0), cy_(2), 2), squa(cx_(1), cy_(2)) + pts(cx_(1), cy_(2), 2),
    ].join(''))),
    [
      { svg: SV(pent(35, 35) + pts(35, 35, 1)), alt: 'Pentágono con un punto' },
      { svg: SV(squa(35, 35) + pts(35, 35, 2)), alt: 'Cuadrado con dos puntos' },
      { svg: SV(pent(35, 35) + pts(35, 35, 2)), alt: 'Pentágono con dos puntos' },
      { svg: SV(pent(35, 35) + pts(35, 35, 3)), alt: 'Pentágono con tres puntos' },
    ], 'C',
    'Dos reglas independientes: la columna sube el número de lados (3, 4, 5) y la fila sube el número de puntos (0, 1, 2). A y B aciertan solo una de las dos.'),

  F(13, 'RAZ-abs', 'Razonamiento abstracto', '¿Cuál de las cuatro figuras NO pertenece al grupo?', '',
    [
      { svg: SV(circ(35, 35) + vln(35, 35)), alt: 'Círculo con línea vertical' },
      { svg: SV(squa(35, 35) + vln(35, 35)), alt: 'Cuadrado con línea vertical' },
      { svg: SV(squa(35, 35) + dgl(35, 35)), alt: 'Cuadrado con una diagonal' },
      { svg: SV(tria(35, 35) + vln(35, 35)), alt: 'Triángulo con línea vertical' },
    ], 'C',
    'Las otras tres quedan iguales al reflejarlas sobre su eje vertical; la diagonal rompe esa simetría. Es el mismo número de líneas en las cuatro, así que contar no sirve.'),

  F(14, 'RAZ-abs', 'Razonamiento abstracto', 'A la primera figura se le quita lo que muestra la segunda. Complete la matriz.',
    GRID(INK([
      squa(cx_(0), cy_(0)) + dgl(cx_(0), cy_(0)), dgl(cx_(1), cy_(0)), squa(cx_(2), cy_(0)),
      circ(cx_(0), cy_(1)) + vln(cx_(0), cy_(1)) + hln(cx_(0), cy_(1)), vln(cx_(1), cy_(1)) + hln(cx_(1), cy_(1)), circ(cx_(2), cy_(1)),
      tria(cx_(0), cy_(2)) + vln(cx_(0), cy_(2)), vln(cx_(1), cy_(2)),
    ].join(''))),
    [
      { svg: SV(vln(35, 35)), alt: 'Solo una línea vertical' },
      { svg: SV(TRI + '<line x1="35" y1="14" x2="35" y2="56"/>'), alt: 'Triángulo con línea vertical' },
      { svg: SV(TRI), alt: 'Triángulo solo' },
      { svg: SV(circ(35, 35)), alt: 'Círculo solo' },
    ], 'C',
    'Sustracción, no superposición. Quien viene de la matriz anterior tiende a sumar en vez de restar: B es exactamente ese error.'),

  // ── Analogias verbales (6) ──
  R(15, 'RAZ-ver', 'Razonamiento verbal', 'Escaso es a abundante como efímero es a:',
    ['breve', 'duradero', 'frágil', 'intenso'], 'B',
    'Relación de antonimia. A es sinónimo de efímero: atrapa a quien responde por asociación en vez de por relación.'),
  R(16, 'RAZ-ver', 'Razonamiento verbal', 'Termómetro es a temperatura como balanza es a:',
    ['volumen', 'peso', 'altura', 'densidad'], 'B',
    'Instrumento y magnitud que mide. D exige una segunda operación y por eso discrimina.'),
  R(17, 'RAZ-ver', 'Razonamiento verbal', 'Ensayo es a estreno como entrenamiento es a:',
    ['esfuerzo', 'disciplina', 'competencia', 'descanso'], 'C',
    'Preparación y evento real para el que se prepara. A y B son atributos de la preparación, no su destino.'),
  R(18, 'RAZ-ver', 'Razonamiento verbal', 'Isla es a agua como oasis es a:',
    ['palmera', 'desierto', 'sed', 'arena'], 'B',
    'Porción de tierra rodeada de un medio distinto. D es el material del entorno, no el entorno.'),
  R(19, 'RAZ-ver', 'Razonamiento verbal', 'Tímido es a sociable como rígido es a:',
    ['duro', 'flexible', 'frágil', 'estable'], 'B',
    'Antonimia otra vez, pero con un distractor de campo semántico (C) que suena a lo contrario de rígido y no lo es.'),
  R(20, 'RAZ-ver', 'Razonamiento verbal', 'Semilla es a árbol como boceto es a:',
    ['lápiz', 'artista', 'obra terminada', 'idea'], 'C',
    'Estado inicial y resultado desarrollado. D invierte la dirección: la idea antecede al boceto.'),

  // ── Cuantitativo (5) ──
  R(21, 'RAZ-cua', 'Razonamiento cuantitativo',
    'Un tanque se llena en 6 horas usando solo la primera llave, y en 12 horas usando solo la segunda. Si se abren las dos al mismo tiempo, ¿en cuánto tiempo se llena?',
    ['3 horas', '4 horas', '6 horas', '9 horas'], 'B',
    'Un sexto más un doceavo es un cuarto del tanque por hora. D es el error de promediar 6 y 12.'),
  R(22, 'RAZ-cua', 'Razonamiento cuantitativo',
    'El precio de un producto sube 20% y después baja 20%. Comparado con el precio original, el precio final es:',
    ['el mismo', '4% más bajo', '4% más alto', 'depende del precio original'], 'B',
    'La bajada se aplica sobre un valor mayor. A es la intuición equivocada más común; D confunde proporción con valor absoluto.'),
  R(23, 'RAZ-cua', 'Razonamiento cuantitativo',
    'Si 3 máquinas producen 3 piezas en 3 minutos, ¿cuántos minutos tardan 9 máquinas en producir 9 piezas?',
    ['3', '9', '27', '1'], 'A',
    'Cada máquina tarda 3 minutos por pieza y trabajan en paralelo. B es la respuesta automática por proporción aparente.'),
  R(24, 'RAZ-cua', 'Razonamiento cuantitativo',
    'Después de un descuento del 25%, un artículo queda en $90.000. ¿Cuál era el precio antes del descuento?',
    ['$112.500', '$115.000', '$120.000', '$135.000'], 'C',
    'Noventa mil es el 75% del original. A aplica el 25% sobre el precio ya rebajado: el error más frecuente.'),
  R(25, 'RAZ-cua', 'Razonamiento cuantitativo',
    'En un grupo de 40 personas, el 60% son mujeres. Si se retiran 4 hombres, ¿qué porcentaje del grupo son mujeres?',
    ['60%', 'aproximadamente 63%', 'aproximadamente 67%', '70%'], 'C',
    'Veinticuatro mujeres sobre treinta y seis personas. A supone que el porcentaje no cambia; el resto son aproximaciones cercanas para exigir el cálculo.'),

  // ── Deduccion (3) ──
  R(26, 'RAZ-ded', 'Deducción lógica',
    'Si todas las piezas marcadas fueron revisadas, y ninguna pieza revisada quedó en el estante rojo, entonces con certeza:',
    ['Ninguna pieza marcada está en el estante rojo.', 'Todas las piezas del estante rojo están sin marcar y sin revisar.', 'Alguna pieza revisada está en el estante rojo.', 'Todas las piezas revisadas están marcadas.'], 'A',
    'B invierte el condicional, C contradice la premisa, D confunde la implicación con su recíproca.'),
  R(27, 'RAZ-ded', 'Deducción lógica',
    'Si el documento está firmado, entonces fue revisado. Este documento no fue revisado. Se concluye que:',
    ['El documento está firmado.', 'El documento no está firmado.', 'No se puede concluir nada.', 'El documento fue revisado por otra persona.'], 'B',
    'Negar el consecuente obliga a negar el antecedente. C es la respuesta de quien confunde este caso con el de negar el antecedente, donde efectivamente no se concluye nada.'),
  R(28, 'RAZ-ded', 'Deducción lógica',
    'Algunos coordinadores tienen certificación. Todos los que tienen certificación asistieron al curso. Se concluye que:',
    ['Todos los coordinadores asistieron al curso.', 'Algunos coordinadores asistieron al curso.', 'Ningún coordinador asistió al curso.', 'Todos los que asistieron al curso son coordinadores.'], 'B',
    'De un "algunos" no se sigue un "todos". A generaliza de más y D invierte la relación.'),
];

// ════════════════════════════════════════════════════════════
// PARTE 5 · INTEGRIDAD Y CRITERIO · 30 items
//
// No se pregunta por conducta propia pasada: eso invita a mentir, no predice
// y toca terreno delicado. Se mide PERMISIVIDAD ante racionalizaciones —
// cada enunciado trae la justificación adentro, y quien tiene el umbral bajo
// se apoya en ella. Los items situacionales puntuan por gradiente de
// efectividad, no acierto/error, para distinguir criterio de reflejo.
// Cinco items de deseabilidad social van dispersos, nunca consecutivos.
// ════════════════════════════════════════════════════════════
const Q = (n: number, sub: string, label: string, stem: string, extra?: Partial<LikertItem>): LikertItem => ({
  code: `E-${String(n).padStart(2, '0')}`,
  block: 'E',
  subdomain: sub,
  hiddenLabel: label,
  type: 'likert',
  scale: 5,
  stem,
  reverse: true,
  ...extra,
});

const SQ = (n: number, sub: string, label: string, stem: string, opts: [string, number][], rationale: string): SituationalItem => ({
  code: `E-${String(n).padStart(2, '0')}`,
  block: 'E',
  subdomain: sub,
  hiddenLabel: label,
  type: 'situational',
  stem,
  options: opts.map(([text, effectiveness], k) => ({ key: 'ABCD'[k], text, effectiveness })),
  rationale,
});

const BLOCK_E: Item[] = [
  Q(1, 'INT-ver', 'Veracidad', 'Registrar la salida de un compañero que ya se fue no le hace daño a nadie, si de todos modos cumplió su jornada.', { pairWith: 'E-19' }),
  Q(2, 'INT-act', 'Cuidado de activos', 'Usar el vehículo de la empresa para una diligencia personal corta, cuando uno ya terminó su ruta, no tiene nada de malo.'),
  Q(3, 'INT-nor', 'Cumplimiento de normas', 'Cuando el procedimiento retrasa una entrega urgente y uno sabe que no va a pasar nada, lo sensato es saltárselo y documentarlo después.'),
  Q(4, 'INT-ver', 'Veracidad', 'Exagerar un poco la experiencia en una hoja de vida es normal: todo el mundo lo hace.'),
  Q(5, 'V1', 'Deseabilidad social', 'Nunca he llegado tarde a un compromiso.', { reverse: false, sd: true }),
  Q(6, 'INT-act', 'Cuidado de activos', 'Llevarse a la casa material de oficina que estaba sobrando no es robar.'),
  Q(7, 'INT-nor', 'Cumplimiento de normas', 'Firmar un registro de una revisión que uno sí hizo, aunque sea dos días después de la fecha que aparece, es un detalle menor.'),
  SQ(8, 'INT-cnf', 'Conflicto de interés',
    'Un proveedor invita a un coordinador a un curso pagado en el exterior. La invitación llega mientras se está evaluando la renovación del contrato de ese proveedor. Lo más razonable es:',
    [
      ['Aceptar: el curso es formación válida y el coordinador no firma el contrato.', 0],
      ['Aceptar, e informarlo a su jefe después del viaje para que quede el antecedente.', 2],
      ['Informarlo por escrito antes de decidir y apartarse de la evaluación de ese proveedor.', 3],
      ['Rechazar sin comentarlo, para no incomodar la relación comercial.', 1],
    ],
    'Las cuatro son defendibles en voz alta y se diferencian solo en cuándo se declara y si hay recusación. D, la más "moral" en apariencia, también falla porque oculta.'),
  Q(9, 'INT-ver', 'Veracidad', 'Decir que algo ya se envió cuando todavía no, para ganar unas horas, es un mal menor.'),
  Q(10, 'INT-act', 'Cuidado de activos', 'Sacar del trabajo algo que ya nadie iba a usar no le quita nada a la empresa.', { pairWith: 'E-20' }),
  Q(11, 'V1', 'Deseabilidad social', 'Jamás he dicho algo que no fuera del todo cierto para evitarle un disgusto a alguien.', { reverse: false, sd: true }),
  Q(12, 'INT-nor', 'Cumplimiento de normas', 'Las reglas están hechas para las situaciones normales; en una urgencia lo que importa es resolver.'),
  SQ(13, 'INT-tol', 'Tolerancia en el servicio',
    'Un jefe de otra área le insiste, delante de su equipo, en que autorice algo que no cumple un requisito. Es la tercera vez en el mes y le dice que usted "traba todo". Lo más razonable es:',
    [
      ['Sostener la negativa allí mismo, explicando el requisito, y proponer verse después para revisar por qué se repite.', 3],
      ['Autorizar esta vez y dejar constancia escrita de que se hizo bajo presión.', 0],
      ['Cortar la conversación diciendo que eso no se discute, y retirarse.', 1],
      ['Escalar de inmediato a la dirección sin responderle a él.', 2],
    ],
    'Mide sostener la posición sin romper la relación. C sostiene pero quema el vínculo; D sostiene pero delega la conversación que le corresponde.'),
  Q(14, 'INT-ver', 'Veracidad', 'Si un error propio no se va a notar, no vale la pena reportarlo.'),
  Q(15, 'INT-act', 'Cuidado de activos', 'Si la empresa mueve millones, un gasto pequeño mal justificado no cambia nada.'),
  Q(16, 'INT-nor', 'Cumplimiento de normas', 'Pedir permiso para todo vuelve el trabajo imposible: a veces hay que actuar y avisar después.'),
  Q(17, 'V1', 'Deseabilidad social', 'Nunca me ha molestado que me interrumpan.', { reverse: false, sd: true }),
  SQ(18, 'INT-cnf', 'Conflicto de interés',
    'Se abre una vacante en su área y la persona más calificada que usted conoce es un familiar cercano. Lo más razonable es:',
    [
      ['Postularlo sin mencionar el parentesco: de todos modos lo van a evaluar como a cualquiera.', 0],
      ['Postularlo, declarar el parentesco por escrito y apartarse de la decisión.', 3],
      ['No postularlo, para evitar comentarios.', 1],
      ['Postularlo y mencionarle el parentesco de palabra a quien decide.', 2],
    ],
    'C parece prudente pero le cuesta a la empresa un buen candidato sin necesidad. La diferencia entre B y D es si queda registro: la declaración verbal no protege a nadie.'),
  Q(19, 'INT-ver', 'Veracidad', 'Marcar la salida por un compañero que ya cumplió su jornada es un favor entre colegas, no una falta.', { pairWith: 'E-01' }),
  Q(20, 'INT-act', 'Cuidado de activos', 'Llevarse insumos que ya nadie reclamaba es distinto a tomar algo que sí hace falta.', { pairWith: 'E-10' }),
  SQ(21, 'INT-sus', 'Criterio ante situaciones de riesgo',
    'Al iniciar el turno usted percibe aliento a alcohol en el operario del montacargas. Es el único operario disponible y hay un despacho urgente comprometido para esa mañana. Lo primero que hace es:',
    [
      ['Dejarlo operar bajo supervisión cercana y hablar con él al terminar el turno.', 0],
      ['Retirarlo de la operación de inmediato y activar el procedimiento definido, aunque el despacho se retrase.', 3],
      ['Consultar con el jefe del área si se puede sacar el despacho primero.', 1],
      ['Pedirle que se tome un café y esperar media hora antes de decidir.', 1],
    ],
    'Mide qué hace ante un tercero en condición de riesgo, no consumo propio. C y D posponen la decisión sin retirar el riesgo, que es la falla real.'),
  Q(22, 'INT-nor', 'Cumplimiento de normas', 'Si el jefe pide algo que se sale del procedimiento, la responsabilidad es de él.'),
  Q(23, 'V1', 'Deseabilidad social', 'Siempre he escuchado con la misma atención a todo el mundo, sin importar quién sea.', { reverse: false, sd: true }),
  SQ(24, 'INT-cnf', 'Conflicto de interés',
    'En una entrevista, un candidato que viene de la competencia le ofrece compartir información comercial de su empleador anterior. Lo más razonable es:',
    [
      ['Escucharla: la trajo él, nadie se la pidió.', 0],
      ['Detenerlo, explicarle que eso no hace parte del proceso, y dejarlo registrado.', 3],
      ['Escucharla pero no usarla para nada.', 1],
      ['Cambiar de tema sin hacer ningún comentario.', 2],
    ],
    'A y C se diferencian solo en la intención declarada, que no es verificable; B es la única que además protege a la empresa dejando rastro.'),
  SQ(25, 'INT-tol', 'Tolerancia en el servicio',
    'Un cliente lo llama alterado y le habla en tono ofensivo por un retraso que no depende de su área. Lo más razonable es:',
    [
      ['Mantener el tono, reconocer el hecho y comprometerse con una fecha concreta.', 3],
      ['Escuchar sin interrumpir hasta que baje el tono, y entonces responder.', 2],
      ['Explicarle que ese retraso no depende de su área.', 0],
      ['Decirle que le devuelve la llamada cuando se pueda hablar con respeto.', 1],
    ],
    'C es la peor y la más tentadora: tiene razón y aun así deja al cliente sin respuesta. D pone un límite legítimo pero le cuesta la relación.'),
  SQ(26, 'INT-sus', 'Criterio ante situaciones de riesgo',
    'En una celebración de la empresa, un colaborador en evidente estado de embriaguez pide sus llaves para irse manejando. Lo más razonable es:',
    [
      ['Retener las llaves y organizarle el transporte, aunque se moleste.', 3],
      ['Entregárselas: es mayor de edad y está fuera del horario laboral.', 0],
      ['Aconsejarle que no maneje y, si insiste, entregárselas.', 1],
      ['Avisarle a un compañero cercano para que se encargue.', 2],
    ],
    'B es la racionalización más común y la más costosa. D delega el problema pero al menos no lo suelta.'),
  Q(27, 'INT-nor', 'Cumplimiento de normas', 'Un control que nadie revisa no vale la pena ejecutarlo con tanto rigor.'),
  SQ(28, 'INT-tol', 'Tolerancia en el servicio',
    'En una reunión, un colega dice delante de todos que el trabajo de usted "no sirvió para nada". Lo más razonable es:',
    [
      ['Pedirle en ese momento que precise qué parte no sirvió, y responder con datos.', 3],
      ['No responder ahí y buscarlo después para hablarlo en privado.', 2],
      ['Responderle en el mismo tono, para que quede claro que no se deja.', 0],
      ['Dejarlo pasar: no vale la pena entrar en eso.', 1],
    ],
    'B es una respuesta razonable y muy elegida, pero deja el juicio instalado en la sala. A lo desarma sin subir el tono.'),
  Q(29, 'V1', 'Deseabilidad social', 'Jamás he sentido envidia del éxito de otra persona.', { reverse: false, sd: true }),
  SQ(30, 'INT-sus', 'Criterio ante situaciones de riesgo',
    'Un compañero le dice que hoy no está en condiciones de operar el equipo y le pide que no lo reporte, que se queda haciendo otra cosa. Lo más razonable es:',
    [
      ['Aceptar: si no va a operar, no hay riesgo.', 1],
      ['Reportarlo al jefe inmediato para que quede registro y se defina qué hace hoy.', 3],
      ['Decirle que se vaya a la casa y no comentar nada.', 0],
      ['Aceptar hoy, y advertirle que si se repite lo reporta.', 2],
    ],
    'A es lo que hace casi todo el mundo y por eso discrimina bien: resuelve el riesgo inmediato pero deja a la empresa sin registro y al compañero sin ayuda.'),
];

// ════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════
export const ITEMS: Item[] = [...BLOCK_A, ...BLOCK_B, ...BLOCK_C, ...BLOCK_D, ...BLOCK_E];

export const BLOCK_ORDER: Block[] = ['A', 'B', 'C', 'D', 'E'];

export function itemsOfBlock(b: Block): Item[] {
  return ITEMS.filter((i) => i.block === b);
}

export function findItem(code: string): Item | undefined {
  return ITEMS.find((i) => i.code === code);
}

/**
 * Version que se envia al navegador del candidato.
 * Quita claves, efectividad, ejes DISC, inversion, marca de deseabilidad
 * social y etiquetas de constructo. Si algo de esto llega al cliente, la
 * prueba queda comprometida: bastaria abrir el inspector.
 */
export function sanitizeForCandidate(item: Item): Record<string, unknown> {
  const base = { code: item.code, block: item.block, type: item.type };
  switch (item.type) {
    case 'likert':
      return { ...base, stem: item.stem, scale: item.scale };
    case 'tetrad':
      return { ...base, prompt: item.prompt, statements: item.statements.map((s) => ({ key: s.key, text: s.text })) };
    case 'mc':
      return { ...base, stem: item.stem, options: item.options.map((o) => ({ key: o.key, text: o.text })) };
    case 'figure':
      return {
        ...base,
        stem: item.stem,
        matrixSvg: item.matrixSvg,
        options: item.options.map((o) => ({ key: o.key, svg: o.svg, alt: o.alt })),
      };
    case 'situational':
      return { ...base, stem: item.stem, options: item.options.map((o) => ({ key: o.key, text: o.text })) };
  }
}
