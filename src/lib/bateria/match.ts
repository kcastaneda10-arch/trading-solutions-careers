/**
 * Bateria de Seleccion TS · calculo del match con el cargo
 *
 * Que hace y que NO hace:
 *  · Compara el perfil obtenido contra el perfil de referencia del cargo.
 *  · El estilo DISC entra como DISTANCIA, no como puntaje: la escala es
 *    ipsativa y no permite decir que alguien es "mas D" que otro.
 *  · Los pisos no bajan el puntaje: levantan una alerta. Un candidato por
 *    debajo del piso de integridad no es "menos match", es un caso a revisar.
 *  · Banda de indiferencia de +-5: dos candidatos separados por menos de eso
 *    se presentan empatados. El error de medicion no permite distinguirlos.
 */

import type { Scores } from './scoring';
import { perfilDe, type PerfilCargo, type Axis } from './perfiles-cargo';
import { FACTORS, INTEGRIDAD_LABEL, type FactorKey } from './interpretacion';

const AXES: Axis[] = ['D', 'I', 'S', 'C'];
const FACTOR_ORDER: FactorKey[] = ['EXT', 'APE', 'AMA', 'RES', 'EST'];
export const BANDA_INDIFERENCIA = 5;

export type MatchDetalle = {
  perfil: { key: string; nombre: string; version: string };
  global: number;
  banda: number;
  componentes: {
    key: 'personalidad' | 'estilo' | 'razonamiento' | 'integridad';
    label: string;
    puntaje: number;
    peso: number;
    aporte: number;
  }[];
  rasgos: { key: string; label: string; obtenido: number; referencia: number; distancia: number; ajuste: number }[];
  ejesDisc: { key: Axis; obtenido: number; referencia: number; distancia: number }[];
  alertas: { tipo: 'piso' | 'critico'; label: string; obtenido: number; minimo: number; porque: string }[];
  encajeMotivadores: { label: string; lectura: string }[];
  apto: boolean;
};

/** Ajuste 0-100 a partir de una distancia, con zona de tolerancia sin castigo. */
function ajustePorDistancia(dist: number, tolerancia: number, escala: number): number {
  const exceso = Math.max(0, dist - tolerancia);
  return Math.round(Math.max(0, 100 - (exceso / escala) * 100));
}

export function calcularMatch(scores: Scores, perfilKey: string | null): MatchDetalle | null {
  const p: PerfilCargo | null = perfilDe(perfilKey);
  if (!p || !scores?.personalidad || !scores?.disc) return null;

  // ── Personalidad · distancia por rasgo, con tolerancia ──
  const rasgos = FACTOR_ORDER.map((k) => {
    const obtenido = scores.personalidad.factores?.[k] ?? 0;
    const referencia = p.bigfive[k];
    const distancia = Math.abs(obtenido - referencia);
    return {
      key: k,
      label: FACTORS[k].label,
      obtenido,
      referencia,
      distancia,
      ajuste: ajustePorDistancia(distancia, p.tolerancia, 50),
    };
  });
  const personalidad = Math.round(rasgos.reduce((a, r) => a + r.ajuste, 0) / rasgos.length);

  // ── Estilo · distancia en segmentos DISC (1-7) ──
  const ejesDisc = AXES.map((k) => {
    const obtenido = scores.disc.natural?.[k]?.seg ?? 0;
    const referencia = p.disc[k];
    return { key: k, obtenido, referencia, distancia: Math.abs(obtenido - referencia) };
  });
  const distDisc = ejesDisc.reduce((a, e) => a + e.distancia, 0);
  const estilo = Math.round(Math.max(0, 100 - (distDisc / 24) * 100));

  // ── Razonamiento e integridad ──
  const razonamiento = scores.razonamiento?.total ?? 0;
  const integridad = scores.integridad?.permisividadGlobal ?? 0;

  const componentes = [
    { key: 'personalidad' as const, label: 'Rasgos', puntaje: personalidad, peso: p.pesos.personalidad },
    { key: 'estilo' as const, label: 'Estilo de trabajo', puntaje: estilo, peso: p.pesos.estilo },
    { key: 'razonamiento' as const, label: 'Razonamiento', puntaje: razonamiento, peso: p.pesos.razonamiento },
    { key: 'integridad' as const, label: 'Integridad', puntaje: integridad, peso: p.pesos.integridad },
  ].map((c) => ({ ...c, aporte: Math.round(c.puntaje * c.peso) }));

  const global = Math.round(componentes.reduce((a, c) => a + c.puntaje * c.peso, 0));

  // ── Alertas · pisos y criticos. NO bajan el puntaje: lo marcan. ──
  const alertas: MatchDetalle['alertas'] = [];
  if (razonamiento < p.pisos.razonamiento) {
    alertas.push({
      tipo: 'piso', label: 'Razonamiento', obtenido: razonamiento, minimo: p.pisos.razonamiento,
      porque: 'Por debajo del mínimo definido para el cargo.',
    });
  }
  if (integridad < p.pisos.integridad) {
    alertas.push({
      tipo: 'piso', label: 'Integridad global', obtenido: integridad, minimo: p.pisos.integridad,
      porque: 'Permisividad por encima de lo aceptable para un cargo que firma y certifica.',
    });
  }
  for (const [dim, min] of Object.entries(p.pisos.porDimension ?? {})) {
    const v = scores.integridad?.byDimension?.[dim];
    if (v != null && v < min) {
      alertas.push({
        tipo: 'critico', label: INTEGRIDAD_LABEL[dim] ?? dim, obtenido: v, minimo: min,
        porque: p.criticos.find((c) => c.key === dim)?.porque ?? 'Dimensión crítica para el cargo.',
      });
    }
  }
  for (const c of p.criticos) {
    if (!FACTOR_ORDER.includes(c.key as FactorKey)) continue;
    const obtenido = scores.personalidad.factores?.[c.key] ?? 0;
    const referencia = p.bigfive[c.key as FactorKey];
    if (obtenido < referencia - p.tolerancia * 2) {
      alertas.push({
        tipo: 'critico', label: c.label, obtenido, minimo: referencia - p.tolerancia * 2, porque: c.porque,
      });
    }
  }

  // ── Motivadores · informan retencion, no puntuan ──
  const encajeMotivadores: MatchDetalle['encajeMotivadores'] = [];
  const orden = scores.motivadores?.orden ?? [];
  const pct = scores.motivadores?.pct ?? {};
  for (const k of p.motivadores.alto) {
    const v = pct[k];
    if (v == null) continue;
    encajeMotivadores.push({
      label: k,
      lectura: v >= 60 ? 'Coincide con lo que el cargo puede ofrecer.' : 'Por debajo de lo que el cargo necesita para sostener el esfuerzo.',
    });
  }
  for (const k of p.motivadores.bajo) {
    const v = pct[k];
    if (v == null) continue;
    encajeMotivadores.push({
      label: k,
      lectura: v >= 65 ? 'Alto, y este cargo da poco de eso: riesgo de permanencia.' : 'En rango: no choca con lo que el cargo ofrece.',
    });
  }
  if (orden.length) {
    encajeMotivadores.push({ label: 'jerarquía', lectura: `Orden interno: ${orden.join(' > ')}` });
  }

  return {
    perfil: { key: p.key, nombre: p.nombre, version: p.version },
    global,
    banda: BANDA_INDIFERENCIA,
    componentes,
    rasgos,
    ejesDisc,
    alertas,
    encajeMotivadores,
    apto: alertas.filter((a) => a.tipo === 'critico').length === 0,
  };
}

/** Agrupa por banda de indiferencia: dentro de ±5 van empatados. */
export function agruparPorBanda<T extends { match: number }>(filas: T[]): T[][] {
  const orden = filas.slice().sort((a, b) => b.match - a.match);
  const grupos: T[][] = [];
  for (const f of orden) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && Math.abs(ultimo[0].match - f.match) <= BANDA_INDIFERENCIA) ultimo.push(f);
    else grupos.push([f]);
  }
  return grupos;
}
