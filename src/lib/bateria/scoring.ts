/**
 * Bateria de Seleccion TS · motor de puntuacion
 *
 * Reglas que no se negocian y por eso viven aqui y no en la interfaz:
 *  · El bloque DISC es ipsativo. NO ordena candidatos entre si: solo mide
 *    distancia al perfil de referencia de un cargo. Un "D alto" ipsativo no
 *    significa mas dominante que otra persona, significa mas dominante que
 *    los otros tres ejes DENTRO de esta persona.
 *  · No se calcula ni se reporta ningun cociente intelectual. Percentil interno
 *    contra las sesiones ya completadas, con el n a la vista.
 *  · Los indices de validez no miden a la persona: miden si el dato sirve.
 *  · Ninguna escala se convierte en diagnostico. Estabilidad emocional baja es
 *    un rango de una escala de personalidad laboral, no una condicion.
 */

import { ITEMS, findItem, type Item } from './items';
import { FACTORS, CARGOS_TIPO, DISC_PATRONES, type FactorKey } from './interpretacion';

export type RawAnswer = { item_code: string; answer: any; latency_ms?: number | null };

type Axis = 'D' | 'I' | 'S' | 'C';
const AXES: Axis[] = ['D', 'I', 'S', 'C'];
const FACTOR_ORDER: FactorKey[] = ['EXT', 'APE', 'AMA', 'RES', 'EST'];

export type Scores = {
  personalidad: {
    factores: Record<string, number>;
    facetas: Record<string, number>;
    arquetipo: string;
    arquetipoAlterno: string | null;
    itemsRespondidos: number;
  };
  disc: {
    natural: Record<string, { pct: number; seg: number }>;
    mascara: Record<string, { pct: number; seg: number }>;
    presion: Record<string, { pct: number; seg: number }>;
    patron: string;
    tetradasRespondidas: number;
    afinidades: { key: string; nombre: string; pct: number; nota: string }[];
  };
  motivadores: { pct: Record<string, number>; orden: string[] };
  razonamiento: {
    total: number; correct: number; of: number;
    bySubdomain: Record<string, { correct: number; of: number; pct: number }>;
  };
  integridad: { byDimension: Record<string, number>; permisividadGlobal: number | null };
};

export type Validity = {
  deseabilidadSocial: { extremas: number; of: number; alerta: boolean };
  consistencia: { pares: number; concordantes: number; alerta: boolean };
  latencia: { rapidos: number; itemCodes: string[]; alerta: boolean };
  patronPlano: { alerta: boolean; detalle: string | null };
  completitud: { respondidos: number; total: number; alerta: boolean };
  proctoring: { eventos: number; capturas: number; alerta: boolean };
  veredicto: 'sin_alertas' | 'con_reservas' | 'no_interpretable';
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const pctOf = (c: number, o: number) => (o === 0 ? 0 : Math.round((c / o) * 100));

/** Likert bruto → 0-100, aplicando inversion. */
function likertPct(value: number, scale: 5 | 7, reverse?: boolean): number {
  const v = reverse ? scale + 1 - value : value;
  return ((v - 1) / (scale - 1)) * 100;
}

/** % relativo del eje (los cuatro suman ~100) → segmento 1-7. Midline = 25% = 4. */
function toSegment(pct: number): number {
  if (pct <= 12) return 1;
  if (pct <= 17) return 2;
  if (pct <= 22) return 3;
  if (pct <= 27) return 4;
  if (pct <= 33) return 5;
  if (pct <= 40) return 6;
  return 7;
}

export function score(answers: RawAnswer[]): { scores: Scores; validity: Validity } {
  const byCode = new Map<string, RawAnswer>();
  for (const a of answers) byCode.set(a.item_code, a);

  // ══ PARTE 1 · Personalidad ═════════════════════════════════
  const facetAcc: Record<string, { sum: number; n: number }> = {};
  let personalidadRespondidos = 0;
  for (const item of ITEMS) {
    if (item.block !== 'A' || item.type !== 'likert') continue;
    const v = Number(byCode.get(item.code)?.answer?.value);
    if (!Number.isFinite(v)) continue;
    personalidadRespondidos += 1;
    const acc = (facetAcc[item.subdomain] ||= { sum: 0, n: 0 });
    acc.sum += likertPct(v, item.scale, item.reverse);
    acc.n += 1;
  }
  const facetas: Record<string, number> = {};
  for (const [k, v] of Object.entries(facetAcc)) facetas[k] = Math.round(v.sum / v.n);

  const factores: Record<string, number> = {};
  for (const fk of FACTOR_ORDER) {
    const keys = FACTORS[fk].facets.map((f) => f.key).filter((k) => facetas[k] != null);
    factores[fk] = keys.length ? Math.round(keys.reduce((a, k) => a + facetas[k], 0) / keys.length) : 0;
  }

  // Arquetipo · los dos factores mas altos, en orden canonico
  const ranked = FACTOR_ORDER.slice().sort((a, b) => factores[b] - factores[a]);
  const spread = factores[ranked[0]] - factores[ranked[4]];
  let arquetipo = 'EQUILIBRADO';
  let arquetipoAlterno: string | null = null;
  if (personalidadRespondidos >= 30 && spread >= 15 && factores[ranked[0]] >= 55) {
    const canon = (a: FactorKey, b: FactorKey) =>
      [a, b].sort((x, y) => FACTOR_ORDER.indexOf(x) - FACTOR_ORDER.indexOf(y)).join('+');
    arquetipo = canon(ranked[0], ranked[1]);
    // Si el segundo y el tercero estan pegados, el perfil esta entre dos arquetipos.
    if (Math.abs(factores[ranked[1]] - factores[ranked[2]]) < 8) {
      arquetipoAlterno = canon(ranked[0], ranked[2]);
    }
  }

  // ══ PARTE 2 · DISC · tres graficas ═════════════════════════
  const most: Record<Axis, number> = { D: 0, I: 0, S: 0, C: 0 };
  const least: Record<Axis, number> = { D: 0, I: 0, S: 0, C: 0 };
  let tetradas = 0;
  for (const item of ITEMS) {
    if (item.type !== 'tetrad') continue;
    const a = byCode.get(item.code)?.answer;
    if (!a?.most || !a?.least || a.most === a.least) continue;
    tetradas += 1;
    const axisOf = (k: string) => item.statements.find((s) => s.key === k)?.axis;
    const mA = axisOf(a.most);
    const lA = axisOf(a.least);
    if (mA) most[mA] += 1;
    if (lA) least[lA] += 1;
  }

  const mkDisc = (raw: Record<Axis, number>) => {
    const total = AXES.reduce((s, k) => s + raw[k], 0) || 1;
    const out: Record<string, { pct: number; seg: number }> = {};
    for (const k of AXES) {
      const pct = Math.round((raw[k] / total) * 1000) / 10;
      out[k] = { pct, seg: toSegment(pct) };
    }
    return out;
  };

  // Grafica I · mascara social: lo que eligio como MAS, el yo que muestra.
  const mascara = mkDisc(most);
  // Grafica II · bajo presion: un eje que casi nunca rechaza es al que recurre.
  const presionRaw: Record<Axis, number> = { D: 0, I: 0, S: 0, C: 0 };
  for (const k of AXES) presionRaw[k] = Math.max(0, tetradas - least[k]);
  const presion = mkDisc(presionRaw);
  // Grafica III · natural: la sintesis de las dos, el perfil de trabajo.
  const naturalRaw: Record<Axis, number> = { D: 0, I: 0, S: 0, C: 0 };
  for (const k of AXES) naturalRaw[k] = most[k] * 2 + Math.max(0, tetradas - least[k]);
  const natural = mkDisc(naturalRaw);

  // Patron · ejes por encima de la linea media (segmento >= 5)
  const altos = AXES.filter((k) => natural[k].seg >= 5);
  let patron = 'EQ';
  if (altos.length >= 1 && altos.length <= 3) patron = altos.join('');
  else if (altos.length === 4) {
    patron = AXES.slice().sort((a, b) => natural[b].pct - natural[a].pct).slice(0, 3)
      .sort((a, b) => AXES.indexOf(a) - AXES.indexOf(b)).join('');
  }
  if (!DISC_PATRONES[patron]) patron = 'EQ';

  const afinidades = CARGOS_TIPO.map((c) => {
    const dist = AXES.reduce((s, k) => s + Math.abs(natural[k].seg - c.ref[k]), 0);
    return { key: c.key, nombre: c.nombre, nota: c.nota, pct: Math.round(clamp(100 - (dist / 24) * 100, 0, 100)) };
  }).sort((a, b) => b.pct - a.pct);

  // ══ PARTE 3 · Motivadores ══════════════════════════════════
  const motAcc: Record<string, { sum: number; n: number }> = {};
  for (const item of ITEMS) {
    if (item.block !== 'C' || item.type !== 'likert') continue;
    const v = Number(byCode.get(item.code)?.answer?.value);
    if (!Number.isFinite(v)) continue;
    const acc = (motAcc[item.subdomain] ||= { sum: 0, n: 0 });
    acc.sum += likertPct(v, item.scale, item.reverse);
    acc.n += 1;
  }
  const motPct: Record<string, number> = {};
  for (const [k, v] of Object.entries(motAcc)) motPct[k] = Math.round(v.sum / v.n);
  const motOrden = Object.keys(motPct).sort((a, b) => motPct[b] - motPct[a]);

  // ══ PARTE 4 · Razonamiento ═════════════════════════════════
  const raz = { total: 0, correct: 0, of: 0, bySubdomain: {} as Record<string, { correct: number; of: number; pct: number }> };
  for (const item of ITEMS) {
    if (item.block !== 'D') continue;
    if (item.type !== 'mc' && item.type !== 'figure') continue;
    const given = byCode.get(item.code)?.answer?.choice;
    const ok = given === item.answer;
    raz.of += 1;
    if (ok) raz.correct += 1;
    const sd = (raz.bySubdomain[item.subdomain] ||= { correct: 0, of: 0, pct: 0 });
    sd.of += 1;
    if (ok) sd.correct += 1;
  }
  raz.total = pctOf(raz.correct, raz.of);
  for (const sd of Object.values(raz.bySubdomain)) sd.pct = pctOf(sd.correct, sd.of);

  // ══ PARTE 5 · Integridad ═══════════════════════════════════
  const dimAcc: Record<string, { sum: number; n: number }> = {};
  for (const item of ITEMS) {
    if (item.block !== 'E') continue;
    const raw = byCode.get(item.code)?.answer;
    if (item.type === 'likert') {
      if (item.sd) continue;
      const v = Number(raw?.value);
      if (!Number.isFinite(v)) continue;
      const d = (dimAcc[item.subdomain] ||= { sum: 0, n: 0 });
      d.sum += likertPct(v, item.scale, item.reverse);
      d.n += 1;
    } else if (item.type === 'situational') {
      const chosen = raw?.choice;
      if (!chosen) continue;
      const eff = item.options.find((o) => o.key === chosen)?.effectiveness;
      if (eff == null) continue;
      const d = (dimAcc[item.subdomain] ||= { sum: 0, n: 0 });
      d.sum += (eff / 3) * 100;
      d.n += 1;
    }
  }
  const byDimension: Record<string, number> = {};
  for (const [k, v] of Object.entries(dimAcc)) byDimension[k] = Math.round(v.sum / v.n);
  const dims = Object.values(byDimension);
  const permisividadGlobal = dims.length ? Math.round(dims.reduce((a, b) => a + b, 0) / dims.length) : null;

  // ══ VALIDEZ ════════════════════════════════════════════════
  const sdItems = ITEMS.filter((i) => i.type === 'likert' && i.sd);
  let extremas = 0;
  for (const i of sdItems) {
    const v = Number(byCode.get(i.code)?.answer?.value);
    if (v >= 4) extremas += 1;
  }

  const seen = new Set<string>();
  let concordantes = 0;
  let paresContados = 0;
  for (const i of ITEMS) {
    if (i.type !== 'likert' || !i.pairWith) continue;
    const key = [i.code, i.pairWith].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    const a = Number(byCode.get(i.code)?.answer?.value);
    const b = Number(byCode.get(i.pairWith)?.answer?.value);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    paresContados += 1;
    if (Math.abs(a - b) <= 1) concordantes += 1;
  }

  const rapidos: string[] = [];
  for (const a of answers) {
    const item = findItem(a.item_code);
    if (!item || (item.type !== 'mc' && item.type !== 'figure')) continue;
    if (a.latency_ms != null && a.latency_ms < 1500) rapidos.push(a.item_code);
  }

  // Patron plano · sin varianza en las escalas de 7 puntos no hay perfil que leer
  const likert7 = ITEMS.filter((i) => i.type === 'likert' && i.scale === 7)
    .map((i) => Number(byCode.get(i.code)?.answer?.value))
    .filter((v) => Number.isFinite(v));
  const distintos = new Set(likert7).size;
  const plano = likert7.length >= 20 && distintos <= 2;

  return {
    scores: {
      personalidad: { factores, facetas, arquetipo, arquetipoAlterno, itemsRespondidos: personalidadRespondidos },
      disc: { natural, mascara, presion, patron, tetradasRespondidas: tetradas, afinidades },
      motivadores: { pct: motPct, orden: motOrden },
      razonamiento: raz,
      integridad: { byDimension, permisividadGlobal },
    },
    validity: {
      deseabilidadSocial: { extremas, of: sdItems.length, alerta: extremas >= 4 },
      consistencia: { pares: paresContados, concordantes, alerta: paresContados > 0 && concordantes < paresContados },
      latencia: { rapidos: rapidos.length, itemCodes: rapidos, alerta: rapidos.length >= 5 },
      patronPlano: { alerta: plano, detalle: plano ? 'Prácticamente la misma respuesta en todas las escalas' : null },
      completitud: { respondidos: answers.length, total: ITEMS.length, alerta: answers.length < ITEMS.length * 0.9 },
      proctoring: { eventos: 0, capturas: 0, alerta: false },
      veredicto: 'sin_alertas',
    },
  };
}

/** Se llama despues de score(), cuando ya se conocen eventos y capturas. */
export function applyProctoring(v: Validity, eventos: number, capturas: number, minutos: number): Validity {
  const esperadas = Math.max(1, Math.floor((minutos * 60) / 45));
  const cobertura = capturas / esperadas;
  const alerta = eventos >= 3 || (capturas > 0 && cobertura < 0.5);
  const out: Validity = { ...v, proctoring: { eventos, capturas, alerta } };

  const graves =
    (out.latencia.alerta ? 1 : 0) +
    (out.patronPlano.alerta ? 1 : 0) +
    (out.completitud.alerta ? 1 : 0) +
    (alerta && eventos >= 6 ? 1 : 0);
  const leves = (out.deseabilidadSocial.alerta ? 1 : 0) + (out.consistencia.alerta ? 1 : 0) + (alerta ? 1 : 0);

  out.veredicto = graves >= 2 ? 'no_interpretable' : graves >= 1 || leves >= 1 ? 'con_reservas' : 'sin_alertas';
  return out;
}
