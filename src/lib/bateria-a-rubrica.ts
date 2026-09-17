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

/** El veredicto de validez que ya calcula el propio instrumento. */
export type VeredictoValidez = "sin_alertas" | "con_reservas" | "no_interpretable";

type ValidezBateria = { veredicto?: VeredictoValidez | null } | null | undefined;

/**
 * UN PROTOCOLO INVÁLIDO NO ES UN MAL RESULTADO: ES UN NO-RESULTADO
 *
 * Esto se escribió mirando un caso real. El informe decía, de una sola persona,
 * que la sesión era inválida —42 eventos de proctoring, deseabilidad social
 * alta— y acto seguido usaba los puntajes igual para concluir que no era apta
 * por integridad. Las dos cosas no se sostienen juntas. Si el protocolo no es
 * interpretable, los puntajes no son evidencia de nada: tampoco en contra.
 *
 * Y el costo de equivocarse no es simétrico. Rechazar a alguien fuerte por una
 * medición inválida es un error invisible y definitivo: la persona no vuelve y
 * nadie se entera de que se perdió. Citarla de nuevo cuesta una hora.
 *
 * La regla, entonces, escala con la consecuencia:
 *
 *   no_interpretable → la batería no aporta NINGÚN veredicto. Los criterios
 *                      quedan sin evidencia y se convierten en preguntas.
 *   con_reservas     → aporta veredictos, con la reserva escrita en la cita,
 *                      PERO no puede hundir un excluyente: un criterio que
 *                      termina la candidatura exige medición limpia.
 *   sin_alertas      → aporta todo.
 */
export const VALIDEZ_LABEL: Record<VeredictoValidez, string> = {
  sin_alertas: "Sin alertas de validez",
  con_reservas: "Con reservas de validez",
  no_interpretable: "Protocolo no interpretable",
};

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
export function veredictosDeBateria(
  r: Rubrica,
  scores: ScoresBateria,
  validez?: ValidezBateria,
): Veredicto[] {
  if (!scores) return [];

  const v: VeredictoValidez = validez?.veredicto ?? "sin_alertas";

  // Protocolo no interpretable: la batería no dice nada. Ni a favor ni en
  // contra. Los criterios salen de acá sin resolver y terminan como preguntas.
  if (v === "no_interpretable") return [];

  const out: Veredicto[] = [];
  const reserva = v === "con_reservas" ? " · lectura CON RESERVAS de validez" : "";

  for (const b of [...r.capacidad, ...r.ajuste]) {
    for (const c of b.criterios) {
      const lectura = LECTURAS[c.id];
      if (!lectura) continue;

      const valor = lectura.leer(scores);
      const nivel = nivelDesdePorcentaje(typeof valor === "number" ? valor : null);
      if (nivel == null) continue;

      // Un excluyente termina la candidatura. Con la validez en duda, eso no se
      // hace con este número: se declara sin evidencia y se verifica con
      // conducta, en el assessment o en la entrevista.
      if (c.excluyente && nivel <= 2 && v !== "sin_alertas") {
        out.push({
          criterio_id: c.id,
          estado: "sin_evidencia",
          nivel: null,
          evidencia:
            `La batería marca ${Math.round(valor as number)} sobre 100, pero la sesión quedó ` +
            `con reservas de validez. Un criterio excluyente no se resuelve con una medición en duda.`,
          fuente: "Batería psicométrica · validez comprometida",
          pregunta:
            `Verificar ${c.nombre.toLowerCase()} con conducta observable —un caso donde la norma ` +
            `le costaba algo— o repetir la batería en condiciones controladas.`,
        });
        continue;
      }

      out.push({
        criterio_id: c.id,
        estado: nivel >= 3 ? "cumple" : "no_cumple",
        nivel,
        evidencia: `${lectura.etiqueta}: ${Math.round(valor as number)} sobre 100${reserva}`,
        fuente: "Batería psicométrica · resultado del instrumento",
        pregunta: null,
      });
    }
  }
  return out;
}
