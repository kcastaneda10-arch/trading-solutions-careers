/**
 * Bateria de Seleccion TS · perfiles de cargo
 *
 * Contra esto se calcula el % de match. Vive en git, no en la base, porque la
 * ficha tecnica exige control de versiones: si el perfil cambia, cambia la
 * version y los candidatos evaluados contra versiones distintas no se comparan.
 *
 * REGLA QUE NO SE ROMPE: cada numero lleva su `fundamento`. Un perfil sin
 * fundamento es una opinion con decimales, y es lo primero que se cae cuando
 * alguien impugna un descarte. Si no se puede explicar de donde sale el numero,
 * el numero no va.
 */

import type { FactorKey } from './interpretacion';

export type Axis = 'D' | 'I' | 'S' | 'C';

export type PerfilCargo = {
  key: string;
  nombre: string;
  version: string;
  /** Que hace la persona. En lenguaje de la operacion, no de RRHH. */
  descripcion: string;
  /** De donde salen los numeros. Es lo que se muestra si impugnan un descarte. */
  fundamento: string;
  /** Perfil DISC de referencia, en segmentos 1-7. */
  disc: Record<Axis, number>;
  /** Perfil de rasgos de referencia, 0-100. */
  bigfive: Record<FactorKey, number>;
  /** Cuanto puede alejarse un rasgo del ideal sin penalizar. */
  tolerancia: number;
  /** Pesos del match. Suman 1. */
  pesos: { personalidad: number; estilo: number; razonamiento: number; integridad: number };
  /** Por que esos pesos y no otros. Va impreso en el informe. */
  fundamentoPesos: string;
  /** Pisos: por debajo de esto se marca alerta, no solo baja el puntaje. */
  pisos: { razonamiento: number; integridad: number; porDimension?: Record<string, number> };
  /** Rasgos y dimensiones no negociables para este cargo. */
  criticos: { key: string; label: string; porque: string }[];
  /** Motivadores que sostienen o rompen la permanencia. No entran al match. */
  motivadores: { alto: string[]; bajo: string[]; nota: string };
};

/**
 * Mezcla dos perfiles puros con un peso. Se usa para cargos hibridos:
 * el resultado es trazable —se puede mostrar la cuenta— en vez de inventado.
 */
function mezclar<T extends Record<string, number>>(a: T, b: T, pesoA: number): T {
  const out: Record<string, number> = {};
  for (const k of Object.keys(a)) out[k] = Math.round(a[k] * pesoA + b[k] * (1 - pesoA));
  return out as T;
}

// ── Perfiles puros de referencia · insumo para las mezclas ──────────
const SIG_PURO = {
  disc: { D: 4, I: 3, S: 5, C: 7 } as Record<Axis, number>,
  bigfive: { EXT: 40, APE: 55, AMA: 45, RES: 85, EST: 65 } as Record<FactorKey, number>,
};
const SST_PURO = {
  disc: { D: 5, I: 6, S: 5, C: 5 } as Record<Axis, number>,
  bigfive: { EXT: 65, APE: 55, AMA: 60, RES: 62, EST: 75 } as Record<FactorKey, number>,
};

/** Inclinacion definida por Kelly para esta vacante: 70% SIG · 30% SST. */
const PESO_SIG = 0.7;

export const PERFILES: Record<string, PerfilCargo> = {
  'sig-sst': {
    key: 'sig-sst',
    nombre: 'Especialista SIG-SST',
    version: '1.0 · 70% SIG / 30% SST',
    descripcion:
      'Sostiene el sistema integrado de gestión y responde por que las certificaciones se mantengan. Documenta, audita, mide y cierra hallazgos; y sostiene la parte de seguridad y salud en campo, aunque no es donde pasa la mayor parte del tiempo.',
    fundamento:
      'El perfil es la mezcla ponderada de dos perfiles puros, 70% SIG y 30% SST, según la inclinación definida para esta vacante. ' +
      'SIG puro exige rigor documental, análisis y cierre (DISC D4 I3 S5 C7; Responsabilidad 85). ' +
      'SST puro exige presencia en piso, capacitación y trato con operarios (DISC D5 I6 S5 C5; Extraversión 65). ' +
      'Cada eje del perfil final es 0,7 × SIG + 0,3 × SST, redondeado. La cuenta se puede mostrar eje por eje.',
    disc: mezclar(SIG_PURO.disc, SST_PURO.disc, PESO_SIG),
    bigfive: mezclar(SIG_PURO.bigfive, SST_PURO.bigfive, PESO_SIG),
    tolerancia: 12,
    pesos: { personalidad: 0.3, estilo: 0.2, razonamiento: 0.3, integridad: 0.2 },
    fundamentoPesos:
      'Razonamiento 30%: auditar es distinguir lo que la evidencia permite concluir de lo que uno supone. ' +
      'Personalidad 30%, sostenida sobre todo en Responsabilidad: el cargo se mide por cierres, no por intenciones. ' +
      'Integridad 20%: es un cargo que firma y certifica. ' +
      'Estilo 20% y de último: la escala DISC es ipsativa y no ordena candidatos, solo mide distancia al perfil.',
    pisos: {
      razonamiento: 45,
      integridad: 70,
      porDimension: { 'INT-nor': 70, 'INT-ver': 70 },
    },
    criticos: [
      { key: 'RES', label: 'Responsabilidad', porque: 'Un sistema de gestión se cae por lo que no se cerró, no por lo que no se supo.' },
      { key: 'INT-nor', label: 'Cumplimiento de normas', porque: 'El cargo existe para sostener la norma cuando incomoda. Permisividad aquí anula el rol.' },
      { key: 'INT-ver', label: 'Veracidad', porque: 'Firma registros y hallazgos. Un umbral bajo en veracidad es riesgo de certificación.' },
    ],
    motivadores: {
      alto: ['MOT-log', 'MOT-aut'],
      bajo: ['MOT-rec'],
      nota:
        'Un perfil que se mueve por cerrar bien y por decidir el cómo encaja con un rol que trabaja solo buena parte del tiempo. ' +
        'Necesidad alta de reconocimiento es un riesgo de permanencia: es un cargo cuyo mejor resultado es que no pase nada, y eso rara vez se aplaude.',
    },
  },

  // ── Operations Executive and Support · Builder Team ────────────────
  'ops-exec': {
    key: 'ops-exec',
    nombre: 'Operations Executive and Support',
    version: '1.0 · job posting de agosto 2026',
    descripcion:
      'Ejecuta bookings contra SLA, coordina con navieras, aerolineas, agentes de aduana y bodegas, sostiene la trazabilidad al dia y emite y revisa HBL y MBL. Transmite AMS e ISF a aduanas dentro de plazo. Ademas apoya pricing y ventas mientras se arman los equipos especializados.',
    fundamento:
      'Sale del job posting, no de una idea del cargo. Tres cosas mandan. ' +
      'Uno: el dia se mide en SLA y en exactitud documental, y un HBL mal emitido o un ISF fuera de plazo es una multa, no un reproceso. De ahi C6 y Responsabilidad 80. ' +
      'Dos: la jornada entera es relacion con terceros, clientes, navieras, aduanas y proveedores. De ahi I5 y Extraversion 60. ' +
      'Tres: el posting pide detectar y comunicar demoras de forma proactiva y sostener la continuidad cuando algo se cae. De ahi Estabilidad 75. ' +
      'La versatilidad que exige la etapa temprana, asumir pricing y ventas por un tiempo, sostiene Apertura 60.',
    disc: { D: 4, I: 5, S: 5, C: 6 },
    bigfive: { EXT: 60, APE: 60, AMA: 55, RES: 80, EST: 75 },
    tolerancia: 12,
    pesos: { personalidad: 0.3, estilo: 0.25, razonamiento: 0.25, integridad: 0.2 },
    fundamentoPesos:
      'Personalidad 30%, sostenida en Responsabilidad y Estabilidad: el cargo se mide por entregas a tiempo y por no quebrarse cuando se cae un embarque. ' +
      'Estilo 25%, mas alto que en los otros perfiles, porque aca el estilo de trato SI es parte del trabajo: se negocia con navieras y se le da la cara al cliente todos los dias. ' +
      'Razonamiento 25%: hay que detectar el error en una transmision y resolver un incidente, pero no es un cargo de analisis. ' +
      'Integridad 20%: transmite ISF y AMS a aduanas de Estados Unidos y maneja telex release.',
    pisos: {
      razonamiento: 45,
      integridad: 65,
      porDimension: { 'INT-ver': 65 },
    },
    criticos: [
      { key: 'RES', label: 'Responsabilidad', porque: 'El SLA y la exactitud documental son el cargo. Lo que no se hizo a tiempo no se compensa despues.' },
      { key: 'EST', label: 'Estabilidad emocional', porque: 'Rollovers, demoras y reclamos son el dia normal. Quien se altera pierde al cliente dos veces.' },
      { key: 'INT-ver', label: 'Veracidad', porque: 'Transmite ISF y AMS a aduanas. Un dato acomodado aca es una sancion regulatoria.' },
    ],
    motivadores: {
      alto: ['MOT-log', 'MOT-afi'],
      bajo: ['MOT-seg'],
      nota:
        'Es una operacion que se esta montando: quien necesita reglas estables y un cargo definido va a sufrir el primer ano. ' +
        'Afiliacion alta ayuda, porque el trabajo se hace hablando con gente todo el dia.',
    },
  },

  // ── Administration & Office Setup Lead · China ─────────────────────
  'china-admin': {
    key: 'china-admin',
    nombre: 'Administration & Office Setup Lead — China',
    version: '1.0 · job posting de septiembre 2026',
    descripcion:
      'Abre la operacion en China: busca y negocia la oficina, contrata proveedores, coordina con la agencia de empleo, el contador y el banco, y apoya la contratacion del primer equipo. Despues sostiene la administracion, la caja menor, los pagos menores, los fapiao y los registros.',
    fundamento:
      'El posting dice textualmente que es una posicion de alta confianza porque maneja recursos, proveedores, documentos y pagos en nombre de la compania. ' +
      'Eso, mas la distancia y la ausencia de supervision presencial, es lo que explica que la integridad pese aqui mas que en cualquier otro perfil. ' +
      'C6 y Responsabilidad 85 salen de registros, politicas internas, control de gastos e inventario. ' +
      'D5 e I5 salen de negociar arriendo y proveedores y de coordinar con socios locales en dos idiomas. ' +
      'S4, por debajo de los demas perfiles, porque el cargo es montar algo que no existe, no sostener una rutina; y Apertura 70 y Estabilidad 75 por la misma razon: el posting pide comodidad con la ambiguedad.',
    disc: { D: 5, I: 5, S: 4, C: 6 },
    bigfive: { EXT: 60, APE: 70, AMA: 50, RES: 85, EST: 75 },
    tolerancia: 12,
    pesos: { personalidad: 0.3, estilo: 0.2, razonamiento: 0.2, integridad: 0.3 },
    fundamentoPesos:
      'Integridad 30%, el peso mas alto de todos los perfiles, y no es una postura moral: es la persona que va a manejar dinero, escoger proveedores y firmar documentos a doce husos horarios de la sede, sin nadie mirando. ' +
      'Personalidad 30%, sostenida en Responsabilidad: la administracion se cae por lo que no se registro. ' +
      'Razonamiento 20%: el cargo pide recursividad y organizacion, no analisis complejo. ' +
      'Estilo 20%: importa como negocia, pero la escala DISC no ordena candidatos, solo mide distancia.',
    pisos: {
      razonamiento: 40,
      integridad: 75,
      porDimension: { 'INT-act': 75, 'INT-cnf': 75, 'INT-ver': 70 },
    },
    criticos: [
      { key: 'INT-act', label: 'Cuidado de activos', porque: 'Maneja caja menor, pagos y compras sin supervision presencial. Es el riesgo central del cargo.' },
      { key: 'INT-cnf', label: 'Conflicto de interes', porque: 'Escoge proveedores y negocia arriendos. Quien no separa el interes propio del de la compania cuesta mas de lo que ahorra.' },
      { key: 'RES', label: 'Responsabilidad', porque: 'Registros, politicas y control de gastos. Lo que no queda documentado no existe para el auditor ni para el contador local.' },
    ],
    motivadores: {
      alto: ['MOT-aut', 'MOT-log'],
      bajo: ['MOT-seg'],
      nota:
        'Va a estar solo y va a tener que decidir sin preguntar: autonomia baja es un problema real aqui, no un matiz. ' +
        'Necesidad alta de seguridad choca con un contrato a un ano y una operacion que apenas nace.',
    },
  },

  // ── Talent Acquisition Specialist ──────────────────────────────────
  'talent-acquisition': {
    key: 'talent-acquisition',
    nombre: 'Talent Acquisition Specialist',
    version: '1.0 · alcance angostado a adquisicion de talento',
    descripcion:
      'Lleva los procesos de seleccion punta a punta: evalua, entrevista, aplica e interpreta psicometria, hace sourcing, cierra y sostiene la experiencia del candidato. No decide contrataciones: evalua, sustenta y presenta terna.',
    fundamento:
      'El reparto de dedicacion definido para el cargo manda: evaluacion y psicometria 40%, atraccion y sourcing 30%, cierre y experiencia 20%, datos e indicadores 10%. ' +
      'Ese 40% de evaluacion es lo que sube Razonamiento por encima del resto de los rasgos: interpretar una prueba y sustentar un descarte es distinguir lo que el dato permite concluir de lo que uno quiere ver. ' +
      'El 30% de sourcing y el 20% de experiencia del candidato son I6 y Extraversion 65: el dia entero es hablar con gente que todavia no le debe nada a la compania. ' +
      'C5 y Responsabilidad 78 salen del 10% de datos y ATS, que suena poco pero es lo que sostiene el indicador de tiempo de cubrimiento.',
    disc: { D: 4, I: 6, S: 5, C: 5 },
    bigfive: { EXT: 65, APE: 60, AMA: 60, RES: 78, EST: 70 },
    tolerancia: 12,
    pesos: { personalidad: 0.3, estilo: 0.2, razonamiento: 0.3, integridad: 0.2 },
    fundamentoPesos:
      'Razonamiento 30% y con el piso mas alto de los cuatro perfiles: es el unico cargo cuyo producto principal es una inferencia sobre otra persona. ' +
      'Personalidad 30%: el cargo vive de sostener conversaciones y de no soltar el proceso. ' +
      'Integridad 20%, concentrada en veracidad y conflicto de interes: maneja informacion reservada de candidatos y de empleadores anteriores, y revelarla es causal de descarte declarada en el propio perfil. ' +
      'Estilo 20%.',
    pisos: {
      razonamiento: 50,
      integridad: 70,
      porDimension: { 'INT-ver': 70, 'INT-cnf': 70 },
    },
    criticos: [
      { key: 'INT-ver', label: 'Veracidad', porque: 'Sustenta descartes y presenta ternas. Un informe acomodado contrata a la persona equivocada y no deja rastro de por que.' },
      { key: 'INT-cnf', label: 'Conflicto de interes', porque: 'Maneja informacion reservada de candidatos y de empleadores anteriores. Es causal de descarte declarada del propio cargo.' },
      { key: 'RES', label: 'Responsabilidad', porque: 'El cargo se mide por tiempo de cubrimiento. Un proceso que se suelta dos dias ya perdio al mejor candidato.' },
    ],
    motivadores: {
      alto: ['MOT-log', 'MOT-afi'],
      bajo: ['MOT-seg'],
      nota:
        'Logro alto sostiene el cierre de vacantes, que es lo unico que se cuenta. Afiliacion alta sostiene el volumen de conversaciones. ' +
        'Necesidad alta de seguridad choca con un cargo donde la mitad de los procesos cambian de prioridad en la semana.',
    },
  },

  // ── FullStack Developer Junior ─────────────────────────────────────
  'fullstack-jr': {
    key: 'fullstack-jr',
    nombre: 'FullStack Developer Junior',
    version: '1.0 · criterio de Kelly: razonamiento por encima de todo',
    descripcion:
      'Desarrolla backend y frontend para los proyectos de UX Team y Trading Solutions. Es un cargo de entrada: entra a aprender el stack de la casa y a producir bajo revision.',
    fundamento:
      'En un junior lo que predice el desempeno no es lo que ya sabe sino la velocidad con que abstrae, deduce y resuelve: el stack se aprende en meses, la capacidad de razonar no. ' +
      'Por eso Razonamiento lleva el peso mas alto y el piso mas alto de los cuatro perfiles. ' +
      'C6 sale de que en codigo la precision no es una virtud, es el requisito. ' +
      'Apertura 70 es la disposicion a aprender herramientas nuevas cada mes. ' +
      'D3 e I3 y Extraversion 40 reconocen lo que el cargo es de verdad: trabajo individual y concentrado, no coordinacion. ' +
      'ADVERTENCIA: esta bateria no mide si la persona sabe programar. Mide razonamiento, rasgos, motivadores e integridad. La capacidad tecnica se prueba con la prueba tecnica, no con este match.',
    disc: { D: 3, I: 3, S: 5, C: 6 },
    bigfive: { EXT: 40, APE: 70, AMA: 50, RES: 75, EST: 65 },
    tolerancia: 14,
    pesos: { personalidad: 0.25, estilo: 0.15, razonamiento: 0.45, integridad: 0.15 },
    fundamentoPesos:
      'Razonamiento 45%: en un cargo de entrada es el unico predictor que la bateria puede aportar de verdad. ' +
      'Personalidad 25%, sostenida en Responsabilidad y Apertura: entregar lo que se compromete y aprender rapido. ' +
      'Integridad 15%: es el piso de cualquier empleado, no un eje de este cargo. No firma, no certifica, no maneja dinero. ' +
      'Estilo 15%, el mas bajo de los cuatro: es un rol individual y la escala DISC aporta poco aca.',
    pisos: {
      razonamiento: 60,
      integridad: 55,
    },
    criticos: [
      // El razonamiento no va como critico: ya lo cubre el piso de 60, que es
      // el mas alto de los cuatro perfiles y dispara su propia alerta.
      { key: 'APE', label: 'Apertura', porque: 'El stack de hoy no es el de dentro de un ano. Quien no disfruta aprender herramientas nuevas se queda en la primera.' },
      { key: 'RES', label: 'Responsabilidad', porque: 'Un junior se sostiene entregando lo que se comprometio. Lo demas se ensena.' },
    ],
    motivadores: {
      alto: ['MOT-log', 'MOT-aut'],
      bajo: ['MOT-rec'],
      nota:
        'Logro y autonomia sostienen a alguien que va a pasar horas solo resolviendo. ' +
        'Necesidad alta de reconocimiento es riesgo en un cargo junior donde el merito se reparte con el equipo y la revision es constante.',
    },
  },
};

/** Para el selector del panel: no hay que adivinar el cargo cuando la sesion
 *  se creo suelta y el titulo no coincide con ningun perfil. */
export const LISTA_PERFILES: { key: string; nombre: string }[] =
  Object.values(PERFILES).map((p) => ({ key: p.key, nombre: p.nombre }));

export function perfilDe(key: string | null | undefined): PerfilCargo | null {
  if (!key) return null;
  return PERFILES[key] ?? null;
}

/** Adivina el perfil a partir del titulo de la vacante. Conservador a proposito:
 *  si no hay match claro devuelve null y el informe lo dice, en vez de comparar
 *  contra un perfil que no corresponde. */
export function perfilPorTitulo(titulo: string | null | undefined): string | null {
  if (!titulo) return null;
  const t = titulo.toLowerCase();
  if (t.includes('sig') || t.includes('sst') || t.includes('hse')) return 'sig-sst';
  if (t.includes('talent acquisition')) return 'talent-acquisition';
  if (t.includes('fullstack') || t.includes('full stack') || t.includes('developer')) return 'fullstack-jr';
  // El de China va antes que Operations: su titulo tambien lleva 'office' y
  // 'setup', y si Operations ganara el orden, el administrativo se mediria
  // contra un perfil de operacion documental que no es el suyo.
  if (t.includes('administration') || t.includes('office setup')) return 'china-admin';
  if (t.includes('operations executive')) return 'ops-exec';
  return null;
}
