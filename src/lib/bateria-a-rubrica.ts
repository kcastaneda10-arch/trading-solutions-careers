/**
 * LA BATERÍA YA ESTÁ CALIFICADA · traducirla a niveles de rúbrica es aritmética
 *
 * POR QUÉ ESTO NO LO HACE EL MODELO
 * Las anclas de estos criterios son umbrales numéricos escritos: «por debajo de
 * 70 · no apto», «entre 70 y 85», «por encima de 85». Eso no es un juicio, es
 * una comparación. Pedirle a un modelo que la haga leyendo un JSON agrega una
 * fuente de error sin agregar nada: el mismo expediente podría dar 3 hoy y 4
 * mañana, y el puntaje dejaría de ser reproducible.
 *
 * QUÉ ARREGLA
 * El agente buscaba la batería en `ht_results`, donde no está. Vive en
 * `ts_bat_sessions`, que es lo que lee el funnel. Resultado: Edwin tenía 89 %
 * de match y los tres criterios de batería salían «sin evidencia», con el
 * agente sugiriendo preguntarle en la entrevista cuánto sacó — una pregunta
 * absurda, porque el dato estaba en la casa.
 *
 * DIRECCIÓN DE LA ESCALA
 * Se sigue la convención que ya usa `match.ts`: en integridad y razonamiento,
 * MÁS ES MEJOR, y los pisos del perfil son mínimos. Si algún día eso se
 * invierte en el instrumento, se invierte acá y en un solo lugar.
 */

import type { Rubrica } from "@/lib/rubricas";
import type { Veredicto } from "@/lib/evaluacion";

/** El pedazo de `scores` que nos interesa. Se tipa suelto a propósito: viene de
    un jsonb y puede estar a medias. */
type ScoresBateria = {
  razonamiento?: { total?: number; correct?: number; of?: number } | null;
  integridad?: { byDimension?: Record<string, number> | null; permisividadGlobal?: number | null } | null;
} | null | undefined;

/**
 * De 0–100 a 1–5, respetando las anclas escritas en la rúbrica.
 *
 * Los cortes 70 y 85 son los de las anclas. El 60 y el 92 abren las bandas 1–2
 * y 4–5 para que el puntaje no se aplane: sin ellos, todo el mundo por debajo
 * de 70 pesaría igual, y un 95 valdría lo mismo que un 86.
 */
export function nivelDesdePorcentaje(p: number | null | undefined): number | null {
  if (p == null || Number.isNaN(p)) return null;
  if (p < 60) return 1;
  if (p < 70) return 2;
  if (p <= 85) return 3;
  if (p <= 92) return 4;
  return 5;
}

/** Qué criterio de la rúbrica sale de qué número de la batería. */
type Lectura = { etiqueta: string; leer: (s: NonNullable<ScoresBateria>) => number | null | undefined };

const LECTURAS: Record<string, Lectura> = {
  razonamiento: {
    etiqueta: "Razonamiento",
    leer: (s) => s.razonamiento?.total,
  },
  cumplimiento: {
    etiqueta: "Integridad · cumplimiento de normas",
    leer: (s) => s.integridad?.byDimension?.["INT-nor"],
  },
  veracidad: {
    etiqueta: "Integridad · veracidad",
    leer: (s) => s.integridad?.byDimension?.["INT-ver"],
  },
  // TS Standard · «Lógica y agilidad mental» se mide con el mismo bloque de
  // razonamiento. Es el mismo dato en los dos ejes a propósito: los ejes no se
  // suman, así que no se está contando dos veces dentro de un total.
  ts2: {
    etiqueta: "Razonamiento",
    leer: (s) => s.razonamiento?.total,
  },
};

/** Los criterios que la batería resuelve sola, si hay batería. */
export function criteriosQueResuelveLaBateria(r: Rubrica): string[] {
  const ids = new Set<string>();
  for (const b of [...r.capacidad, ...r.ajuste]) {
    for (const c of b.criterios) if (LECTURAS[c.id]) ids.add(c.id);
  }
  return [...ids];
}

/**
 * Traduce la batería a veredictos.
 *
 * Un criterio cuyo número no esté en `scores` NO se devuelve: sigue el camino
 * normal y termina en «sin evidencia». No se rellena con el promedio ni con
 * nada: que el instrumento no haya medido algo es un dato, no un hueco.
 */
export function veredictosDeBateria(r: Rubrica, scores: ScoresBateria): Veredicto[] {
  if (!scores) return [];
  const out: Veredicto[] = [];

  for (const b of [...r.capacidad, ...r.ajuste]) {
    for (const c of b.criterios) {
      const lectura = LECTURAS[c.id];
      if (!lectura) continue;

      const valor = lectura.leer(scores);
      const nivel = nivelDesdePorcentaje(typeof valor === "number" ? valor : null);
      if (nivel == null) continue;

      out.push({
        criterio_id: c.id,
        estado: nivel >= 3 ? "cumple" : "no_cumple",
        nivel,
        evidencia: `${lectura.etiqueta}: ${Math.round(valor as number)} sobre 100`,
        fuente: "Batería psicométrica · resultado del instrumento",
        pregunta: null,
      });
    }
  }
  return out;
}
