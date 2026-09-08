/**
 * Batería SIG-SST · motor de puntuación
 *
 * Reglas que no se negocian y por eso están aquí y no en la interfaz:
 *  · Los bloques ipsativos (parte 3) NO producen puntajes comparables entre
 *    candidatos. Solo distancia al perfil de referencia del cargo.
 *  · No se calcula ni se reporta ningún cociente intelectual. Percentil interno
 *    contra las sesiones ya completadas, con el n a la vista.
 *  · Los índices de validez no miden a la persona: miden si el dato sirve.
 */

import { ITEMS, findItem, type Item } from './items';

export type RawAnswer = {
  item_code: string;
  answer: any;
  latency_ms?: number | null;
};

export type Scores = {
  conocimiento: { total: number; correct: number; of: number; bySubdomain: Record<string, { correct: number; of: number; pct: number }> };
  razonamiento: { total: number; correct: number; of: number; bySubdomain: Record<string, { correct: number; of: number; pct: number }> };
  estilo: {
    natural: Record<string, number>;
    adaptado: Record<string, number>;
    motivadores: Record<string, number>;
    procesamiento: Record<string, number>;
    tensionRol: number | null;
  };
  integridad: { byDimension: Record<string, number>; permisividadGlobal: number | null };
  criterio: { total: number | null; of: number };
  muestraAbierta: { palabras: number; texto: string | null; pendienteRubrica: true }[];
};

export type Validity = {
  deseabilidadSocial: { extremas: number; of: number; alerta: boolean };
  consistencia: { pares: number; concordantes: number; alerta: boolean };
  latencia: { rapidos: number; itemCodes: string[]; alerta: boolean };
  patronPlano: { alerta: boolean; detalle: string | null };
  proctoring: { eventos: number; capturas: number; alerta: boolean };
  veredicto: 'sin_alertas' | 'con_reservas' | 'no_interpretable';
};

const LIKERT_MIN = 1;
const LIKERT_MAX = 5;

function pct(correct: number, of: number) {
  return of === 0 ? 0 : Math.round((correct / of) * 100);
}

/** Normaliza un reparto ipsativo a base 100 sobre el total repartido. */
function normalizeIpsative(raw: Record<string, number>): Record<string, number> {
  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  if (total === 0) return raw;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) out[k] = Math.round((v / total) * 100);
  return out;
}

export function score(answers: RawAnswer[]): { scores: Scores; validity: Validity } {
  const byCode = new Map<string, RawAnswer>();
  for (const a of answers) byCode.set(a.item_code, a);

  // ── Conocimiento y razonamiento ────────────────────────────
  const mkBucket = () => ({
    total: 0,
    correct: 0,
    of: 0,
    bySubdomain: {} as Record<string, { correct: number; of: number; pct: number }>,
  });
  const conocimiento = mkBucket();
  const razonamiento = mkBucket();

  for (const item of ITEMS) {
    if (item.type !== 'mc' && item.type !== 'figure') continue;
    const bucket = item.block === 'A' ? conocimiento : item.block === 'B' ? razonamiento : null;
    if (!bucket) continue;
    const given = byCode.get(item.code)?.answer?.choice;
    const ok = given === item.answer;
    bucket.of += 1;
    if (ok) bucket.correct += 1;
    const sd = (bucket.bySubdomain[item.subdomain] ||= { correct: 0, of: 0, pct: 0 });
    sd.of += 1;
    if (ok) sd.correct += 1;
  }
  for (const b of [conocimiento, razonamiento]) {
    b.total = pct(b.correct, b.of);
    for (const sd of Object.values(b.bySubdomain)) sd.pct = pct(sd.correct, sd.of);
  }

  // ── Estilo · ipsativo ──────────────────────────────────────
  const natural: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
  const adaptado: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
  const motivadores: Record<string, number> = {};
  const procesamiento: Record<string, number> = {};

  for (const item of ITEMS) {
    if (item.type !== 'forced') continue;
    const a = byCode.get(item.code)?.answer;
    if (!a?.most && !a?.least) continue;
    const axisOf = (k: string) => item.statements.find((s) => s.key === k)?.axis;
    const target =
      item.subdomain === '3.3' ? motivadores : item.subdomain === '3.4' ? procesamiento : item.facet === 'adaptado' ? adaptado : natural;
    // +2 a la elegida como MÁS, −1 a la elegida como MENOS, base 3 por eje presente.
    for (const s of item.statements) target[s.axis] = (target[s.axis] ?? 0) + 3;
    const mostAxis = a.most ? axisOf(a.most) : null;
    const leastAxis = a.least ? axisOf(a.least) : null;
    if (mostAxis) target[mostAxis] += 2;
    if (leastAxis) target[leastAxis] = Math.max(0, target[leastAxis] - 1);
  }

  const nat = normalizeIpsative(natural);
  const ada = normalizeIpsative(adaptado);
  const axes = ['D', 'I', 'S', 'C'];
  const bothPresent = axes.some((k) => nat[k] > 0) && axes.some((k) => ada[k] > 0);
  const tensionRol = bothPresent
    ? Math.round((axes.reduce((acc, k) => acc + Math.abs((nat[k] ?? 0) - (ada[k] ?? 0)), 0) / 4) * 10) / 10
    : null;

  // ── Integridad ─────────────────────────────────────────────
  const dimAcc: Record<string, { sum: number; n: number }> = {};
  for (const item of ITEMS) {
    if (item.block !== 'D') continue;
    const raw = byCode.get(item.code)?.answer;
    if (item.type === 'likert') {
      if (item.sd) continue; // los SD no puntúan integridad
      const v = Number(raw?.value);
      if (!Number.isFinite(v)) continue;
      // reverse: estar de acuerdo con la racionalización resta
      const norm = item.reverse ? LIKERT_MAX + LIKERT_MIN - v : v;
      const scaled = ((norm - LIKERT_MIN) / (LIKERT_MAX - LIKERT_MIN)) * 100;
      const d = (dimAcc[item.subdomain] ||= { sum: 0, n: 0 });
      d.sum += scaled;
      d.n += 1;
    } else if (item.type === 'situational') {
      const chosen = raw?.choice;
      if (!chosen) continue;
      const eff = item.options.find((o) => o.key === chosen)?.effectiveness;
      if (eff == null) continue;
      const scaled = (eff / 3) * 100;
      const d = (dimAcc[item.subdomain] ||= { sum: 0, n: 0 });
      d.sum += scaled;
      d.n += 1;
    }
  }
  const byDimension: Record<string, number> = {};
  for (const [k, v] of Object.entries(dimAcc)) byDimension[k] = Math.round(v.sum / v.n);
  const dims = Object.values(byDimension);
  const permisividadGlobal = dims.length ? Math.round(dims.reduce((a, b) => a + b, 0) / dims.length) : null;

  // ── Criterio situacional (parte 5) ─────────────────────────
  let critSum = 0;
  let critOf = 0;
  for (const item of ITEMS) {
    if (item.block !== 'E' || item.type !== 'situational') continue;
    critOf += 1;
    const chosen = byCode.get(item.code)?.answer?.choice;
    const eff = item.options.find((o) => o.key === chosen)?.effectiveness;
    if (eff != null) critSum += (eff / 3) * 100;
  }

  // ── Muestra abierta · queda pendiente de rúbrica humana ────
  const muestraAbierta = ITEMS.filter((i) => i.type === 'open').map((i) => {
    const t: string | null = byCode.get(i.code)?.answer?.text ?? null;
    return {
      palabras: t ? t.trim().split(/\s+/).filter(Boolean).length : 0,
      texto: t,
      pendienteRubrica: true as const,
    };
  });

  // ── Validez ────────────────────────────────────────────────
  const sdItems = ITEMS.filter((i) => i.type === 'likert' && i.sd);
  let extremas = 0;
  for (const i of sdItems) {
    const v = Number(byCode.get(i.code)?.answer?.value);
    if (v >= 4) extremas += 1;
  }

  const pairs = new Set<string>();
  let concordantes = 0;
  let paresContados = 0;
  for (const i of ITEMS) {
    if (i.type !== 'likert' || !i.pairWith) continue;
    const key = [i.code, i.pairWith].sort().join('|');
    if (pairs.has(key)) continue;
    pairs.add(key);
    const a = Number(byCode.get(i.code)?.answer?.value);
    const b = Number(byCode.get(i.pairWith)?.answer?.value);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    paresContados += 1;
    if (Math.abs(a - b) <= 1) concordantes += 1;
  }

  const rapidos: string[] = [];
  for (const a of answers) {
    const item = findItem(a.item_code);
    if (!item) continue;
    if (item.type !== 'mc' && item.type !== 'figure') continue;
    if (a.latency_ms != null && a.latency_ms < 1500) rapidos.push(a.item_code);
  }

  const likertValues = ITEMS.filter((i) => i.type === 'likert')
    .map((i) => Number(byCode.get(i.code)?.answer?.value))
    .filter((v) => Number.isFinite(v));
  const distintos = new Set(likertValues).size;
  const patronPlano = likertValues.length >= 5 && distintos <= 1;

  return {
    scores: {
      conocimiento,
      razonamiento,
      estilo: { natural: nat, adaptado: ada, motivadores: normalizeIpsative(motivadores), procesamiento: normalizeIpsative(procesamiento), tensionRol },
      integridad: { byDimension, permisividadGlobal },
      criterio: { total: critOf ? Math.round(critSum / critOf) : null, of: critOf },
      muestraAbierta,
    },
    validity: {
      deseabilidadSocial: { extremas, of: sdItems.length, alerta: extremas >= 4 },
      consistencia: { pares: paresContados, concordantes, alerta: paresContados > 0 && concordantes < paresContados },
      latencia: { rapidos: rapidos.length, itemCodes: rapidos, alerta: rapidos.length >= 5 },
      patronPlano: { alerta: patronPlano, detalle: patronPlano ? 'Misma respuesta en todos los ítems de escala' : null },
      proctoring: { eventos: 0, capturas: 0, alerta: false },
      veredicto: 'sin_alertas',
    },
  };
}

/** Se llama después de score(), cuando ya se conocen eventos y capturas. */
export function applyProctoring(v: Validity, eventos: number, capturas: number, minutos: number): Validity {
  const esperadas = Math.max(1, Math.floor((minutos * 60) / 45));
  const cobertura = capturas / esperadas;
  const alerta = eventos >= 3 || (capturas > 0 && cobertura < 0.5);
  const out: Validity = { ...v, proctoring: { eventos, capturas, alerta } };

  const graves = (out.latencia.alerta ? 1 : 0) + (out.patronPlano.alerta ? 1 : 0) + (alerta && eventos >= 6 ? 1 : 0);
  const leves = (out.deseabilidadSocial.alerta ? 1 : 0) + (out.consistencia.alerta ? 1 : 0) + (alerta ? 1 : 0);

  out.veredicto = graves >= 2 ? 'no_interpretable' : graves >= 1 || leves >= 2 ? 'con_reservas' : leves >= 1 ? 'con_reservas' : 'sin_alertas';
  return out;
}

/** Desempeño D de la capa 2. Los pesos salen del análisis del cargo: aún provisionales. */
export const PESOS_DESEMPENO = { conocimiento: 0.35, muestra: 0.3, razonamiento: 0.2, criterio: 0.15 };

export function desempeno(s: Scores): { D: number | null; parcial: boolean } {
  // La muestra abierta requiere rúbrica humana: hasta entonces D es parcial.
  const partes = [
    { v: s.conocimiento.total, w: PESOS_DESEMPENO.conocimiento },
    { v: s.razonamiento.total, w: PESOS_DESEMPENO.razonamiento },
    { v: s.criterio.total, w: PESOS_DESEMPENO.criterio },
  ].filter((p) => p.v != null) as { v: number; w: number }[];
  if (!partes.length) return { D: null, parcial: true };
  const wSum = partes.reduce((a, p) => a + p.w, 0);
  return { D: Math.round(partes.reduce((a, p) => a + p.v * p.w, 0) / wSum), parcial: true };
}
