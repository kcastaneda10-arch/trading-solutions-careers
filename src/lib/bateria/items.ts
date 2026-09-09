/**
 * Batería SIG-SST · banco de ítems
 *
 * El banco vive en git, no en la base de datos: la ficha técnica exige control
 * de versiones y que no se comparen candidatos evaluados con versiones distintas.
 * Cambiar un ítem obliga a subir BATTERY_VERSION.
 *
 * v1.1-piloto: 35 ítems representativos de los 22 subdominios del diseño
 * completo (137 ítems). Sirve para probar el motor, el proctoring y el
 * guardado extremo a extremo. NO es apto para decidir sobre un candidato real
 * hasta que pase juicio de expertos y piloto.
 */

export const BATTERY_VERSION = '1.1-piloto';

/** Version del texto de habeas data. Se guarda con cada consentimiento: en una
 *  auditoria hay que poder demostrar QUE acepto el candidato, no solo que acepto. */
export const CONSENT_TEXT_VERSION = 'hd-2026-09-08';

export type Block = 'A' | 'B' | 'C' | 'D' | 'E';

type Base = {
  code: string;
  block: Block;
  subdomain: string;
  /** Nunca se envía al candidato. Solo para el informe y la auditoría. */
  hiddenLabel: string;
};

export type MCItem = Base & {
  type: 'mc';
  stem: string;
  options: { key: string; text: string }[];
  answer: string;
  rationale: string;
  source?: string;
};

export type FigureItem = Base & {
  type: 'figure';
  stem: string;
  matrixSvg: string;
  options: { key: string; svg: string; alt: string }[];
  answer: string;
  rationale: string;
};

export type ForcedItem = Base & {
  type: 'forced';
  prompt: string;
  facet: 'natural' | 'adaptado';
  statements: { key: string; text: string; axis: string }[];
};

export type LikertItem = Base & {
  type: 'likert';
  stem: string;
  /** true = puntúa invertido (estar de acuerdo resta) */
  reverse?: boolean;
  /** ítem de deseabilidad social */
  sd?: boolean;
  /** par de consistencia */
  pairWith?: string;
};

export type SituationalItem = Base & {
  type: 'situational';
  stem: string;
  options: { key: string; text: string; effectiveness: number }[];
  rationale: string;
};

export type OpenItem = Base & {
  type: 'open';
  stem: string;
  bullets?: string[];
  prompt2?: string;
  minWords: number;
  rubric: string[];
};

export type Item = MCItem | FigureItem | ForcedItem | LikertItem | SituationalItem | OpenItem;

/** Metadatos de cada parte tal como los ve el candidato: sin nombre del constructo. */
export const BLOCKS: Record<Block, { label: string; intro: string; timedSeconds: number | null }> = {
  A: {
    label: 'Parte 1 de 5',
    intro:
      'Esta parte tiene tiempo. Responda lo mejor que pueda; si no está seguro, elija la opción que considere más razonable y siga.',
    timedSeconds: 16 * 60,
  },
  B: {
    label: 'Parte 2 de 5',
    intro:
      'Esta parte tiene tiempo. No requiere conocimientos previos de ningún oficio: todo lo necesario está en cada pregunta.',
    timedSeconds: 12 * 60,
  },
  C: {
    label: 'Parte 3 de 5',
    intro:
      'No hay respuestas correctas ni incorrectas. En cada grupo elija la frase que MÁS lo describe y la que MENOS lo describe.',
    timedSeconds: null,
  },
  D: {
    label: 'Parte 4 de 5',
    intro: 'Indique su grado de acuerdo o elija la opción que le parezca más razonable. Responda con franqueza.',
    timedSeconds: null,
  },
  E: {
    label: 'Parte 5 de 5',
    intro: 'Tómese el tiempo que necesite. Aquí interesa su criterio y cómo lo argumenta, no la rapidez.',
    timedSeconds: null,
  },
};

// ─────────────────────────────────────────────────────────────
// SVG helpers para los ítems figurales
// ─────────────────────────────────────────────────────────────
const S = (inner: string, vb = '0 0 70 70') =>
  `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="68" height="68" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.3"/><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">${inner}</g></svg>`;

const TRI = '<polygon points="35,14 54,56 16,56"/>';
const dots = (n: number) => {
  const pos = [
    [35, 35],
    [25, 25],
    [45, 45],
    [45, 25],
    [25, 45],
    [35, 20],
  ];
  return pos
    .slice(0, n)
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="currentColor"/>`)
    .join('');
};

// ─────────────────────────────────────────────────────────────
// PARTE 1 · Conocimiento técnico aplicado (10 ítems)
// ─────────────────────────────────────────────────────────────
const BLOCK_A: Item[] = [
  {
    code: 'A-01',
    block: 'A',
    subdomain: '1.1',
    hiddenLabel: 'Marco legal y estándares mínimos',
    type: 'mc',
    stem:
      'Una empresa de 80 trabajadores, clasificada en riesgo III, va a designar al responsable del diseño y la ejecución del sistema de gestión de seguridad y salud en el trabajo. ¿Qué perfil cumple los estándares mínimos?',
    options: [
      { key: 'A', text: 'Un técnico en SST con el curso de 50 horas aprobado.' },
      { key: 'B', text: 'Un tecnólogo en SST con cinco años de experiencia certificada.' },
      { key: 'C', text: 'Un profesional en SST, o profesional con posgrado en SST, con licencia vigente y curso de 50 horas.' },
      { key: 'D', text: 'Cualquier profesional con curso de 50 horas y aval escrito de la ARL.' },
    ],
    answer: 'C',
    rationale:
      'Por tamaño y nivel de riesgo aplica el estándar más exigente. A y B corresponden a empresas más pequeñas o de menor riesgo; D inventa una figura de aval que no existe.',
    source: 'Resolución 0312 de 2019',
  },
  {
    code: 'A-02',
    block: 'A',
    subdomain: '1.1',
    hiddenLabel: 'Marco legal · actualización de formación',
    type: 'mc',
    stem: '¿Con qué periodicidad y con qué intensidad debe actualizarse la formación obligatoria del responsable del sistema?',
    options: [
      { key: 'A', text: 'Veinte horas cada tres años.' },
      { key: 'B', text: 'Cincuenta horas cada cinco años.' },
      { key: 'C', text: 'Veinte horas cada dos años.' },
      { key: 'D', text: 'Cuarenta horas cada tres años.' },
    ],
    answer: 'A',
    rationale: 'Actualización de 20 horas cada tres años. Los distractores mezclan la intensidad del curso inicial con la periodicidad.',
    source: 'Resolución 4927 de 2016, art. 16',
  },
  {
    code: 'A-03',
    block: 'A',
    subdomain: '1.2',
    hiddenLabel: 'Jerarquía de controles',
    type: 'mc',
    stem:
      'En una bodega se identifica exposición a ruido por encima del límite permisible en la zona de empaque. El presupuesto alcanza para una sola medida este año. ¿Cuál se implementa primero según la jerarquía de controles?',
    options: [
      { key: 'A', text: 'Dotar protección auditiva certificada a todo el personal de la zona.' },
      { key: 'B', text: 'Encerrar acústicamente la fuente que genera el ruido.' },
      { key: 'C', text: 'Rotar al personal para reducir el tiempo de exposición individual.' },
      { key: 'D', text: 'Señalizar la zona como de uso obligatorio de protección auditiva.' },
    ],
    answer: 'B',
    rationale:
      'Control de ingeniería sobre la fuente. A y D son EPP y señalización (último nivel), C es control administrativo. Discrimina a quien conoce el orden de quien conoce la lista.',
    source: 'Decreto 1072 de 2015, art. 2.2.4.6.24',
  },
  {
    code: 'A-04',
    block: 'A',
    subdomain: '1.2',
    hiddenLabel: 'Actualización de la matriz de peligros',
    type: 'mc',
    stem: 'La identificación de peligros y valoración de riesgos debe actualizarse:',
    options: [
      { key: 'A', text: 'Solo cuando lo solicite la ARL o un ente de control.' },
      { key: 'B', text: 'Como mínimo una vez al año, y además cada vez que ocurra un accidente mortal o un evento catastrófico, o cuando cambien las condiciones o los procesos.' },
      { key: 'C', text: 'Cada dos años, coincidiendo con la auditoría interna.' },
      { key: 'D', text: 'Únicamente cuando se incorpore maquinaria nueva.' },
    ],
    answer: 'B',
    rationale: 'La periodicidad mínima y los disparadores por evento son acumulativos, no alternativos. C y D reducen la obligación a un solo disparador.',
    source: 'Decreto 1072 de 2015, art. 2.2.4.6.15',
  },
  {
    code: 'A-05',
    block: 'A',
    subdomain: '1.3',
    hiddenLabel: 'Equipo investigador de incidentes',
    type: 'mc',
    stem: 'El equipo que investiga un incidente o accidente de trabajo debe estar integrado, como mínimo, por:',
    options: [
      { key: 'A', text: 'El responsable del sistema de gestión y un representante de la ARL.' },
      { key: 'B', text: 'El jefe inmediato o supervisor del trabajador, un representante del comité paritario o el vigía, y el responsable del sistema de gestión.' },
      { key: 'C', text: 'Únicamente el responsable del sistema de gestión, para preservar la objetividad.' },
      { key: 'D', text: 'El jefe de recursos humanos y el trabajador involucrado.' },
    ],
    answer: 'B',
    rationale:
      'La composición tripartita es lo que da validez a la investigación. C es el error más común: investigar solo, creyendo que eso da neutralidad.',
    source: 'Resolución 1401 de 2007, art. 7',
  },
  {
    code: 'A-06',
    block: 'A',
    subdomain: '1.3',
    hiddenLabel: 'Plazo de remisión de la investigación',
    type: 'mc',
    stem: '¿Dentro de qué plazo debe remitirse a la ARL el informe de investigación de un accidente grave o mortal?',
    options: [
      { key: 'A', text: 'Dos días hábiles siguientes al evento.' },
      { key: 'B', text: 'Quince días calendario siguientes al evento.' },
      { key: 'C', text: 'Treinta días calendario siguientes al evento.' },
      { key: 'D', text: 'No hay plazo definido: se remite al cerrar el plan de acción.' },
    ],
    answer: 'B',
    rationale:
      'A confunde el plazo de reporte inicial del accidente con el de remisión del informe de investigación. D es la respuesta de quien nunca ha remitido uno.',
    source: 'Resolución 1401 de 2007, art. 14',
  },
  {
    code: 'A-07',
    block: 'A',
    subdomain: '1.4',
    hiddenLabel: 'Inspección de unidades de carga',
    type: 'mc',
    stem: 'Durante la inspección física de un contenedor previa al sellado, ¿cuántos puntos estructurales deben revisarse y documentarse?',
    options: [
      { key: 'A', text: '5 puntos' },
      { key: 'B', text: '7 puntos' },
      { key: 'C', text: '8 puntos, más 3 adicionales si es tráiler' },
      { key: 'D', text: '17 puntos' },
    ],
    answer: 'B',
    rationale:
      'Siete puntos para contenedor; diecisiete para tráiler. La opción D es la respuesta correcta del ítem hermano sobre tráiler y funciona como distractor fuerte.',
    source: 'Protocolo de inspección de unidades de carga',
  },
  {
    code: 'A-08',
    block: 'A',
    subdomain: '1.4',
    hiddenLabel: 'Sellos de alta seguridad',
    type: 'mc',
    stem: 'El sello que se instala en un contenedor de exportación debe cumplir la clasificación de alta seguridad conforme a:',
    options: [
      { key: 'A', text: 'ISO 9001' },
      { key: 'B', text: 'ISO 28000' },
      { key: 'C', text: 'ISO 17712' },
      { key: 'D', text: 'ISO 45001' },
    ],
    answer: 'C',
    rationale:
      'B es el distractor bueno: ISO 28000 sí es de seguridad en la cadena de suministro, pero es un sistema de gestión, no la norma de ensayo del sello físico.',
    source: 'ISO 17712',
  },
  {
    code: 'A-09',
    block: 'A',
    subdomain: '1.5',
    hiddenLabel: 'Integración de sistemas',
    type: 'mc',
    stem:
      'Una organización certifica calidad, ambiental y seguridad y salud en el trabajo bajo tres normas distintas. ¿Qué hace posible integrarlas en un solo sistema documental sin duplicar procedimientos?',
    options: [
      { key: 'A', text: 'Que las tres compartan la misma entidad certificadora.' },
      { key: 'B', text: 'Que las tres usen la misma estructura de alto nivel: mismo capitulado y mismos requisitos comunes de contexto, liderazgo, planificación y mejora.' },
      { key: 'C', text: 'Que las auditorías internas se realicen en la misma semana.' },
      { key: 'D', text: 'Que exista un único responsable designado para los tres sistemas.' },
    ],
    answer: 'B',
    rationale:
      'D es la trampa buena: suele haber un responsable único, pero eso es consecuencia organizacional, no la razón técnica. Quien elige D gestiona sistemas; quien elige B los diseña.',
    source: 'Estructura armonizada ISO (Anexo SL)',
  },
  {
    code: 'A-10',
    block: 'A',
    subdomain: '1.6',
    hiddenLabel: 'Corrección vs. acción correctiva',
    type: 'mc',
    stem:
      'En una auditoría interna se detecta que tres registros de inspección de un mismo mes no tienen firma del responsable. El auditado corrige y firma los tres al día siguiente. ¿Cómo debe cerrarse el asunto?',
    options: [
      { key: 'A', text: 'Cerrado: se firmaron los registros, la evidencia ya existe.' },
      { key: 'B', text: 'Se registra la corrección, pero el hallazgo permanece abierto hasta identificar por qué falló el control de firma y qué se cambia para que no se repita.' },
      { key: 'C', text: 'Se convierte en observación, porque no hubo consecuencia real sobre la operación.' },
      { key: 'D', text: 'Se cierra y se programa una auditoría de seguimiento en seis meses.' },
    ],
    answer: 'B',
    rationale:
      'Separa corrección de acción correctiva, la confusión más común y más cara en un sistema integrado. A administra papeles, C negocia el hallazgo con el auditado, D pospone.',
    source: 'Requisito de no conformidad y acción correctiva, estructura armonizada ISO',
  },
];

// ─────────────────────────────────────────────────────────────
// PARTE 2 · Razonamiento, contenido neutro (8 ítems)
// ─────────────────────────────────────────────────────────────
const BLOCK_B: Item[] = [
  {
    code: 'B-01',
    block: 'B',
    subdomain: '2.1',
    hiddenLabel: 'Inducción numérica',
    type: 'mc',
    stem: '¿Qué número continúa la serie?\n\n3 · 6 · 11 · 18 · 27 · ?',
    options: [
      { key: 'A', text: '34' },
      { key: 'B', text: '36' },
      { key: 'C', text: '38' },
      { key: 'D', text: '40' },
    ],
    answer: 'C',
    rationale: 'Diferencias +3, +5, +7, +9 → +11. A repite la diferencia anterior; B ve cuadrados; D salta a +13.',
  },
  {
    code: 'B-02',
    block: 'B',
    subdomain: '2.1',
    hiddenLabel: 'Inducción numérica',
    type: 'mc',
    stem: '¿Qué número continúa la serie?\n\n2 · 6 · 12 · 20 · 30 · ?',
    options: [
      { key: 'A', text: '40' },
      { key: 'B', text: '42' },
      { key: 'C', text: '44' },
      { key: 'D', text: '46' },
    ],
    answer: 'B',
    rationale: 'Diferencias +4, +6, +8, +10 → +12. A es el error de repetir la última diferencia.',
  },
  {
    code: 'B-03',
    block: 'B',
    subdomain: '2.2',
    hiddenLabel: 'Razonamiento abstracto',
    type: 'figure',
    stem: 'Complete la matriz.',
    matrixSvg: `<svg viewBox="0 0 330 240" xmlns="http://www.w3.org/2000/svg">
<g fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.3">
<rect x="10" y="10" width="70" height="70"/><rect x="90" y="10" width="70" height="70"/><rect x="170" y="10" width="70" height="70"/>
<rect x="10" y="90" width="70" height="70"/><rect x="90" y="90" width="70" height="70"/><rect x="170" y="90" width="70" height="70"/>
<rect x="10" y="170" width="70" height="70"/><rect x="90" y="170" width="70" height="70"/></g>
<g fill="none" stroke="currentColor" stroke-width="1.8">
<circle cx="45" cy="45" r="17"/>
<circle cx="125" cy="45" r="17"/><line x1="125" y1="28" x2="125" y2="62"/>
<circle cx="205" cy="45" r="17"/><line x1="205" y1="28" x2="205" y2="62"/><line x1="188" y1="45" x2="222" y2="45"/>
<rect x="28" y="108" width="34" height="34"/>
<rect x="108" y="108" width="34" height="34"/><line x1="125" y1="108" x2="125" y2="142"/>
<rect x="188" y="108" width="34" height="34"/><line x1="205" y1="108" x2="205" y2="142"/><line x1="188" y1="125" x2="222" y2="125"/>
<polygon points="45,190 62,222 28,222"/>
<polygon points="125,190 142,222 108,222"/><line x1="125" y1="190" x2="125" y2="222"/></g>
<rect x="170" y="170" width="70" height="70" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="205" y="213" text-anchor="middle" font-family="monospace" font-size="26" fill="currentColor" opacity="0.5">?</text></svg>`,
    options: [
      { key: 'A', svg: S(TRI), alt: 'Triángulo simple' },
      { key: 'B', svg: S(TRI + '<line x1="35" y1="14" x2="35" y2="56"/>'), alt: 'Triángulo con una línea vertical' },
      { key: 'C', svg: S(TRI + '<line x1="35" y1="14" x2="35" y2="56"/><line x1="23" y1="40" x2="47" y2="40"/>'), alt: 'Triángulo con línea vertical y horizontal' },
      { key: 'D', svg: S(TRI + '<line x1="28" y1="30" x2="28" y2="56"/><line x1="42" y1="30" x2="42" y2="56"/>'), alt: 'Triángulo con dos líneas verticales' },
    ],
    answer: 'C',
    rationale: 'Doble entrada: la fila define la figura base, la columna el número de líneas internas acumuladas. D es el error de captar "dos líneas" sin la orientación.',
  },
  {
    code: 'B-04',
    block: 'B',
    subdomain: '2.2',
    hiddenLabel: 'Razonamiento abstracto',
    type: 'figure',
    stem: 'Complete la matriz.',
    matrixSvg: `<svg viewBox="0 0 330 240" xmlns="http://www.w3.org/2000/svg">
<g fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.3">
<rect x="10" y="10" width="70" height="70"/><rect x="90" y="10" width="70" height="70"/><rect x="170" y="10" width="70" height="70"/>
<rect x="10" y="90" width="70" height="70"/><rect x="90" y="90" width="70" height="70"/><rect x="170" y="90" width="70" height="70"/>
<rect x="10" y="170" width="70" height="70"/><rect x="90" y="170" width="70" height="70"/></g>
<g stroke="currentColor" stroke-width="1.8" fill="currentColor">
<circle cx="45" cy="45" r="4.5"/>
<circle cx="115" cy="35" r="4.5"/><circle cx="135" cy="55" r="4.5"/>
<circle cx="195" cy="35" r="4.5"/><circle cx="215" cy="55" r="4.5"/><circle cx="215" cy="35" r="4.5"/>
<circle cx="35" cy="115" r="4.5"/><circle cx="55" cy="135" r="4.5"/>
<circle cx="115" cy="115" r="4.5"/><circle cx="135" cy="135" r="4.5"/><circle cx="135" cy="115" r="4.5"/>
<circle cx="195" cy="115" r="4.5"/><circle cx="215" cy="135" r="4.5"/><circle cx="215" cy="115" r="4.5"/><circle cx="195" cy="135" r="4.5"/>
<circle cx="35" cy="195" r="4.5"/><circle cx="55" cy="215" r="4.5"/><circle cx="55" cy="195" r="4.5"/>
<circle cx="115" cy="195" r="4.5"/><circle cx="135" cy="215" r="4.5"/><circle cx="135" cy="195" r="4.5"/><circle cx="115" cy="215" r="4.5"/></g>
<rect x="170" y="170" width="70" height="70" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4"/>
<text x="205" y="213" text-anchor="middle" font-family="monospace" font-size="26" fill="currentColor" opacity="0.5">?</text></svg>`,
    options: [
      { key: 'A', svg: S(dots(4)), alt: 'Cuatro puntos' },
      { key: 'B', svg: S(dots(5)), alt: 'Cinco puntos' },
      { key: 'C', svg: S(dots(3)), alt: 'Tres puntos' },
      { key: 'D', svg: S(dots(6)), alt: 'Seis puntos' },
    ],
    answer: 'B',
    rationale: 'El número de puntos es fila + columna − 1. La celda faltante es fila 3, columna 3 → cinco puntos. A y D son los errores de contar uno de menos o uno de más.',
  },
  {
    code: 'B-05',
    block: 'B',
    subdomain: '2.2',
    hiddenLabel: 'Razonamiento abstracto',
    type: 'figure',
    stem: '¿Cuál de las cuatro figuras NO pertenece al grupo?',
    matrixSvg: '',
    options: [
      { key: 'A', svg: S('<rect x="18" y="18" width="34" height="34"/><line x1="18" y1="18" x2="52" y2="52"/>'), alt: 'Cuadrado con una diagonal' },
      { key: 'B', svg: S('<polygon points="35,16 54,35 35,54 16,35"/><line x1="35" y1="16" x2="35" y2="54"/>'), alt: 'Rombo con una línea' },
      { key: 'C', svg: S('<circle cx="35" cy="35" r="19"/><line x1="16" y1="35" x2="54" y2="35"/><line x1="35" y1="16" x2="35" y2="54"/>'), alt: 'Círculo con dos líneas' },
      { key: 'D', svg: S(TRI + '<line x1="35" y1="14" x2="35" y2="56"/>'), alt: 'Triángulo con una línea' },
    ],
    answer: 'C',
    rationale: 'Las otras tres tienen una sola línea interna; C tiene dos. La forma exterior es irrelevante y funciona como distractor de superficie.',
  },
  {
    code: 'B-06',
    block: 'B',
    subdomain: '2.3',
    hiddenLabel: 'Razonamiento verbal',
    type: 'mc',
    stem: 'Escaso es a abundante como efímero es a:',
    options: [
      { key: 'A', text: 'breve' },
      { key: 'B', text: 'duradero' },
      { key: 'C', text: 'frágil' },
      { key: 'D', text: 'intenso' },
    ],
    answer: 'B',
    rationale: 'Relación de antonimia. A es sinónimo de efímero y es el distractor que atrapa a quien responde por asociación en vez de por relación.',
  },
  {
    code: 'B-07',
    block: 'B',
    subdomain: '2.4',
    hiddenLabel: 'Razonamiento cuantitativo',
    type: 'mc',
    stem:
      'Un tanque se llena en 6 horas usando solo la primera llave, y en 12 horas usando solo la segunda. Si se abren las dos al mismo tiempo, ¿en cuánto tiempo se llena?',
    options: [
      { key: 'A', text: '3 horas' },
      { key: 'B', text: '4 horas' },
      { key: 'C', text: '6 horas' },
      { key: 'D', text: '9 horas' },
    ],
    answer: 'B',
    rationale: '1/6 + 1/12 = 1/4 del tanque por hora. D es el error de promediar 6 y 12.',
  },
  {
    code: 'B-08',
    block: 'B',
    subdomain: '2.5',
    hiddenLabel: 'Deducción condicional',
    type: 'mc',
    stem: 'Si todas las piezas marcadas fueron revisadas, y ninguna pieza revisada quedó en el estante rojo, entonces con certeza:',
    options: [
      { key: 'A', text: 'Ninguna pieza marcada está en el estante rojo.' },
      { key: 'B', text: 'Todas las piezas del estante rojo están sin marcar y sin revisar.' },
      { key: 'C', text: 'Alguna pieza revisada está en el estante rojo.' },
      { key: 'D', text: 'Todas las piezas revisadas están marcadas.' },
    ],
    answer: 'A',
    rationale:
      'B invierte el condicional, C contradice la premisa, D confunde la implicación con su recíproca. Auditar es exactamente distinguir lo que la evidencia permite concluir de lo que uno supone.',
  },
];

// ─────────────────────────────────────────────────────────────
// PARTE 3 · Estilo de trabajo · elección forzada (6 bloques)
// Deseabilidad equiparada por jueces: pendiente de validación.
// ─────────────────────────────────────────────────────────────
const NAT = 'Cuando trabajo…';
const ADA = 'En el cargo al que estoy aplicando, lo que más se necesita es…';

const BLOCK_C: Item[] = [
  {
    code: 'C-01',
    block: 'C',
    subdomain: '3.1',
    hiddenLabel: 'DISC natural',
    type: 'forced',
    facet: 'natural',
    prompt: NAT,
    statements: [
      { key: 'a', text: 'Prefiero cerrar el tema hoy, aunque la conversación quede áspera.', axis: 'D' },
      { key: 'b', text: 'Prefiero que el equipo quede alineado antes de avanzar.', axis: 'S' },
      { key: 'c', text: 'Prefiero explicarlo las veces que haga falta hasta que se entienda.', axis: 'I' },
      { key: 'd', text: 'Prefiero verificar el dato antes de tomar la decisión.', axis: 'C' },
    ],
  },
  {
    code: 'C-02',
    block: 'C',
    subdomain: '3.1',
    hiddenLabel: 'DISC natural',
    type: 'forced',
    facet: 'natural',
    prompt: NAT,
    statements: [
      { key: 'a', text: 'Me incomoda dejar un punto sin resolver al final del día.', axis: 'D' },
      { key: 'b', text: 'Me incomoda que alguien del equipo se quede por fuera de la decisión.', axis: 'S' },
      { key: 'c', text: 'Me incomoda una reunión donde nadie dice lo que piensa.', axis: 'I' },
      { key: 'd', text: 'Me incomoda entregar algo sin haberlo revisado dos veces.', axis: 'C' },
    ],
  },
  {
    code: 'C-03',
    block: 'C',
    subdomain: '3.3',
    hiddenLabel: 'Motivadores',
    type: 'forced',
    facet: 'natural',
    prompt: 'Lo que más me sostiene el esfuerzo en el trabajo es…',
    statements: [
      { key: 'a', text: 'Ver terminado algo que costó.', axis: 'logro' },
      { key: 'b', text: 'Sentir que el equipo cuenta conmigo.', axis: 'afiliacion' },
      { key: 'c', text: 'Poder decidir cómo hago mi trabajo.', axis: 'autonomia' },
      { key: 'd', text: 'Que se note el aporte que hice.', axis: 'reconocimiento' },
    ],
  },
  {
    code: 'C-04',
    block: 'C',
    subdomain: '3.4',
    hiddenLabel: 'Preferencia de procesamiento',
    type: 'forced',
    facet: 'natural',
    prompt: 'Frente a un problema nuevo, lo primero que hago es…',
    statements: [
      { key: 'a', text: 'Buscar los datos y ver qué dicen.', axis: 'analitico' },
      { key: 'b', text: 'Ordenar los pasos y armar un plan.', axis: 'organizador' },
      { key: 'c', text: 'Hablar con quien está más cerca del problema.', axis: 'relacional' },
      { key: 'd', text: 'Preguntarme si el problema está bien planteado.', axis: 'conceptual' },
    ],
  },
  {
    code: 'C-05',
    block: 'C',
    subdomain: '3.2',
    hiddenLabel: 'DISC adaptado',
    type: 'forced',
    facet: 'adaptado',
    prompt: ADA,
    statements: [
      { key: 'a', text: 'Sostener la norma aunque incomode a quien la tiene que cumplir.', axis: 'D' },
      { key: 'b', text: 'Mantener la calma cuando todos empujan al mismo tiempo.', axis: 'S' },
      { key: 'c', text: 'Conseguir que la gente quiera cumplirla, no solo que la cumpla.', axis: 'I' },
      { key: 'd', text: 'Que nada quede sin registro ni sin trazabilidad.', axis: 'C' },
    ],
  },
  {
    code: 'C-06',
    block: 'C',
    subdomain: '3.2',
    hiddenLabel: 'DISC adaptado',
    type: 'forced',
    facet: 'adaptado',
    prompt: ADA,
    statements: [
      { key: 'a', text: 'Tomar la decisión aunque falte información y no haya tiempo.', axis: 'D' },
      { key: 'b', text: 'Sostener el ritmo sin que se caiga lo que ya está funcionando.', axis: 'S' },
      { key: 'c', text: 'Explicar por qué la norma existe, no solo que existe.', axis: 'I' },
      { key: 'd', text: 'Conocer el detalle técnico mejor que nadie en la mesa.', axis: 'C' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// PARTE 4 · Integridad y criterio normativo (9 ítems)
// Mide permisividad ante racionalizaciones. No pregunta por
// conducta propia pasada: eso invita a mentir y no predice.
// ─────────────────────────────────────────────────────────────
const BLOCK_D: Item[] = [
  {
    code: 'D-01',
    block: 'D',
    subdomain: '4.1',
    hiddenLabel: 'Veracidad',
    type: 'likert',
    reverse: true,
    pairWith: 'D-09',
    stem: 'Registrar la salida de un compañero que ya se fue no le hace daño a nadie, si de todos modos cumplió su jornada.',
  },
  {
    code: 'D-02',
    block: 'D',
    subdomain: '4.2',
    hiddenLabel: 'Cuidado de activos',
    type: 'likert',
    reverse: true,
    stem: 'Usar el vehículo de la empresa para una diligencia personal corta, cuando uno ya terminó su ruta, no tiene nada de malo.',
  },
  {
    code: 'D-03',
    block: 'D',
    subdomain: '4.3',
    hiddenLabel: 'Cumplimiento de normas',
    type: 'likert',
    reverse: true,
    stem: 'Cuando el procedimiento retrasa una entrega urgente y uno sabe que no va a pasar nada, lo sensato es saltárselo y documentarlo después.',
  },
  {
    code: 'D-04',
    block: 'D',
    subdomain: 'V1',
    hiddenLabel: 'Deseabilidad social',
    type: 'likert',
    sd: true,
    stem: 'Nunca he llegado tarde a un compromiso.',
  },
  {
    code: 'D-05',
    block: 'D',
    subdomain: '4.3',
    hiddenLabel: 'Cumplimiento de normas',
    type: 'likert',
    reverse: true,
    stem: 'Firmar un registro de una inspección que uno sí hizo, aunque haya sido dos días antes de la fecha que aparece, es un detalle menor.',
  },
  {
    code: 'D-06',
    block: 'D',
    subdomain: '4.4',
    hiddenLabel: 'Conflicto de interés',
    type: 'situational',
    stem:
      'Un proveedor invita a un coordinador a un curso pagado en el exterior. La invitación llega mientras se está evaluando la renovación del contrato de ese proveedor. Lo más razonable es:',
    options: [
      { key: 'A', text: 'Aceptar: el curso es formación válida y el coordinador no firma el contrato.', effectiveness: 0 },
      { key: 'B', text: 'Aceptar, e informarlo a su jefe después del viaje para que quede el antecedente.', effectiveness: 2 },
      { key: 'C', text: 'Informarlo por escrito antes de decidir y apartarse de la evaluación de ese proveedor.', effectiveness: 3 },
      { key: 'D', text: 'Rechazar sin comentarlo, para no incomodar la relación comercial.', effectiveness: 1 },
    ],
    rationale:
      'Las cuatro son defendibles en voz alta y se diferencian solo en cuándo se declara y si hay recusación. D, la más "moral" en apariencia, también falla porque oculta.',
  },
  {
    code: 'D-07',
    block: 'D',
    subdomain: '4.5',
    hiddenLabel: 'Criterio ante sustancias',
    type: 'situational',
    stem:
      'Al iniciar el turno usted percibe aliento a alcohol en el operario de montacargas. Es el único operario disponible y hay un despacho urgente comprometido para esa mañana. Lo primero que hace es:',
    options: [
      { key: 'A', text: 'Dejarlo operar bajo supervisión cercana y hablar con él al terminar el turno.', effectiveness: 0 },
      { key: 'B', text: 'Retirarlo de la operación de inmediato y activar el procedimiento definido, aunque el despacho se retrase.', effectiveness: 3 },
      { key: 'C', text: 'Consultar con el jefe de operaciones si se puede sacar el despacho primero.', effectiveness: 1 },
      { key: 'D', text: 'Pedirle que se tome un café y esperar media hora antes de decidir.', effectiveness: 1 },
    ],
    rationale:
      'El ítem mide qué hace ante un tercero en condición de riesgo, no consumo propio. C y D posponen la decisión sin retirar el riesgo, que es la falla real.',
  },
  {
    code: 'D-08',
    block: 'D',
    subdomain: '4.6',
    hiddenLabel: 'Tolerancia en el servicio',
    type: 'situational',
    stem:
      'Un jefe de operaciones le insiste, delante de su equipo, en que autorice una salida que no cumple un requisito documental. Es la tercera vez en el mes y le dice que usted "traba todo". Lo más razonable es:',
    options: [
      { key: 'A', text: 'Sostener la negativa allí mismo, explicando el requisito, y proponer verse después para revisar por qué se repite.', effectiveness: 3 },
      { key: 'B', text: 'Autorizar esta vez y dejar constancia escrita de que se hizo bajo presión.', effectiveness: 0 },
      { key: 'C', text: 'Cortar la conversación diciendo que la norma no se discute, y retirarse.', effectiveness: 1 },
      { key: 'D', text: 'Escalar de inmediato a la dirección sin responderle a él.', effectiveness: 2 },
    ],
    rationale:
      'Mide sostener la posición sin romper la relación. C sostiene pero quema el vínculo; D sostiene pero delega la conversación que le corresponde.',
  },
  {
    code: 'D-09',
    block: 'D',
    subdomain: '4.1',
    hiddenLabel: 'Veracidad · par de consistencia',
    type: 'likert',
    reverse: true,
    pairWith: 'D-01',
    stem: 'Marcar la salida por un compañero que ya cumplió su jornada es un favor entre colegas, no una falta.',
  },
];

// ─────────────────────────────────────────────────────────────
// PARTE 5 · Muestra de trabajo y criterio situacional (2 ítems)
// ─────────────────────────────────────────────────────────────
const BLOCK_E: Item[] = [
  {
    code: 'E-01',
    block: 'E',
    subdomain: '5.1',
    hiddenLabel: 'Criterio situacional',
    type: 'situational',
    stem:
      'Un indicador que usted reporta mensualmente lleva cuatro meses en verde. Al revisar la fuente descubre que la fórmula excluye una categoría de eventos, y que incluyéndola el indicador estaría en rojo desde el segundo mes. El comité de dirección es en dos días. Lo más razonable es:',
    options: [
      { key: 'A', text: 'Presentar el indicador corregido en el comité, explicando el error de la fórmula y desde cuándo viene.', effectiveness: 3 },
      { key: 'B', text: 'Corregir la fórmula desde este mes y explicar el cambio en el próximo comité, cuando haya más contexto.', effectiveness: 1 },
      { key: 'C', text: 'Avisar a su jefe antes del comité y llevar las dos versiones para que la dirección vea la diferencia.', effectiveness: 2 },
      { key: 'D', text: 'Presentar lo que estaba planeado y abrir el tema por separado cuando esté el plan de acción listo.', effectiveness: 0 },
    ],
    rationale:
      'C es una respuesta razonable y prudente, pero A asume la corrección completa sin diluir la responsabilidad. B y D retrasan una información que ya cambia decisiones.',
  },
  {
    code: 'E-02',
    block: 'E',
    subdomain: '5.2',
    hiddenLabel: 'Muestra de trabajo',
    type: 'open',
    stem: 'Durante un recorrido usted observa lo siguiente en una zona de almacenamiento:',
    bullets: [
      'Dos extintores con la marca de última recarga vencida hace cuatro meses.',
      'Una estantería con la carga sobresaliendo del nivel superior.',
      'Un trabajador contratista sin el elemento de protección que exige la tarea, trabajando junto a personal propio que sí lo usa.',
    ],
    prompt2:
      'a) Redacte el hallazgo tal como lo dejaría por escrito.\nb) Indique qué haría en las próximas dos horas y qué en los próximos treinta días, y por qué en ese orden.',
    minWords: 120,
    rubric: [
      'Identifica los tres hallazgos y distingue el que exige acción inmediata',
      'Redacta con evidencia y no con opinión',
      'Diferencia contención de causa raíz',
      'Reconoce que el contratista es responsabilidad de la empresa contratante',
    ],
  },
];

export const ITEMS: Item[] = [...BLOCK_A, ...BLOCK_B, ...BLOCK_C, ...BLOCK_D, ...BLOCK_E];

export const BLOCK_ORDER: Block[] = ['A', 'B', 'C', 'D', 'E'];

export function itemsOfBlock(b: Block): Item[] {
  return ITEMS.filter((i) => i.block === b);
}

export function findItem(code: string): Item | undefined {
  return ITEMS.find((i) => i.code === code);
}

/**
 * Versión que se envía al navegador del candidato.
 * Quita claves, efectividad, ejes, rúbricas y etiquetas de constructo.
 * Si algo de esto llega al cliente, la prueba queda comprometida.
 */
export function sanitizeForCandidate(item: Item): Record<string, unknown> {
  const base = { code: item.code, block: item.block, type: item.type };
  switch (item.type) {
    case 'mc':
      return { ...base, stem: item.stem, options: item.options.map((o) => ({ key: o.key, text: o.text })) };
    case 'figure':
      return {
        ...base,
        stem: item.stem,
        matrixSvg: item.matrixSvg,
        options: item.options.map((o) => ({ key: o.key, svg: o.svg, alt: o.alt })),
      };
    case 'forced':
      return {
        ...base,
        prompt: item.prompt,
        statements: item.statements.map((s) => ({ key: s.key, text: s.text })),
      };
    case 'likert':
      return { ...base, stem: item.stem };
    case 'situational':
      return { ...base, stem: item.stem, options: item.options.map((o) => ({ key: o.key, text: o.text })) };
    case 'open':
      return { ...base, stem: item.stem, bullets: item.bullets, prompt2: item.prompt2, minWords: item.minWords };
  }
}
