/**
 * EVALUACIÓN DEL EXPEDIENTE · el agente que lee y la aritmética que ordena
 *
 * LA DIVISIÓN DE TRABAJO, QUE ES LO QUE HACE ESTO DEFENDIBLE
 * El modelo NO calcula el puntaje ni recomienda a nadie. Responde criterio por
 * criterio: cumple, no cumple, o no se puede saber — y cita de dónde lo sacó.
 * El total lo calcula `calcularEje` con los pesos de la rúbrica. Por eso un
 * 4,33 se puede defender renglón por renglón, y por eso el número no cambia si
 * mañana cambia el modelo.
 *
 * POR QUÉ EL «SIN EVIDENCIA» ES UN RESULTADO Y NO UN HUECO
 * Un instrumento que rellena lo que no sabe produce rankings con apariencia de
 * dato. Acá lo que falta se declara, baja la cobertura y mantiene el semáforo
 * en amarillo. La salida más útil de todo esto no es el puntaje: es la lista de
 * preguntas que hay que hacerle a la persona antes de moverla.
 *
 * LO QUE EL AGENTE PUEDE Y NO PUEDE LEER
 * Puede leer PRODUCTOS: la hoja de vida, el caso escrito del assessment, la
 * matriz o el plan que la persona entregó, el resultado de la batería. No puede
 * leer CONDUCTA: cómo se paró frente al equipo en el juego de roles, si sostuvo
 * el criterio cuando lo contradijeron. Eso murió en la sala si nadie lo anotó.
 *
 * En los criterios de assessment el agente PROPONE leyendo el entregable y
 * quien estuvo en la sala corrige. Cuando hay nivel manual, el manual manda:
 * la persona que estaba ahí vio más que el papel.
 */

import type { Bloque, Criterio, Rubrica } from "@/lib/rubricas";
import { FUENTE_LA_CARGA } from "@/lib/rubricas";

export type Estado = "cumple" | "no_cumple" | "sin_evidencia";

export type Veredicto = {
  criterio_id: string;
  estado: Estado;
  /** 1 a 5. Null cuando no hay evidencia: no se estima. */
  nivel: number | null;
  /** Cita textual. Sin cita no hay veredicto. */
  evidencia: string | null;
  /** Nombre del archivo o fuente de donde salió. */
  fuente: string | null;
  /** Qué preguntarle si no se pudo verificar. */
  pregunta: string | null;
};

export type Semaforo = "listo" | "falta_evidencia" | "bloqueado";

/** Criterios que el agente puede resolver leyendo documentos, aunque después
    alguien los corrija. */
export function criteriosDelAgente(r: Rubrica): { bloque: Bloque; criterio: Criterio }[] {
  const out: { bloque: Bloque; criterio: Criterio }[] = [];
  for (const b of [...r.capacidad, ...r.ajuste]) {
    for (const c of b.criterios) {
      const q = FUENTE_LA_CARGA[c.fuente];
      if (q === "agente" || q === "ambos") out.push({ bloque: b, criterio: c });
    }
  }
  return out;
}

/** Criterios que puede cargar quien estuvo en la sala. Incluye los de
    assessment: ahí el agente propone y esta carga corrige. */
export function criteriosDeWellness(r: Rubrica): { bloque: Bloque; criterio: Criterio }[] {
  const out: { bloque: Bloque; criterio: Criterio }[] = [];
  for (const b of [...r.capacidad, ...r.ajuste]) {
    for (const c of b.criterios) {
      const q = FUENTE_LA_CARGA[c.fuente];
      if (q === "wellness" || q === "ambos") out.push({ bloque: b, criterio: c });
    }
  }
  return out;
}

/**
 * Lo que se calificó EN LA SALA: assessment y juego de roles.
 *
 * Es un subconjunto de los criterios de Wellness — quedan fuera los de
 * entrevista, que todavía no ocurrió. Existe para poder cargar una jornada de
 * assessment de corrido, con la planilla del evaluador al lado, en vez de
 * entrar a ocho fichas y bajar hasta el final en cada una.
 */
export function criteriosDeLaSala(r: Rubrica): { bloque: Bloque; criterio: Criterio }[] {
  return criteriosDeWellness(r).filter(
    ({ criterio }) => criterio.fuente === "assessment" || criterio.fuente === "roles",
  );
}

/**
 * El semáforo mira LOS DOS ejes, no solo el que ordena la terna.
 *
 * Mirando solo capacidad, un candidato con el assessment y el juego de roles ya
 * cargados salía «listo para decidir» con el TS Standard en 36 %: la pantalla
 * afirmando que hay con qué decidir cuando falta la entrevista entera. Es
 * exactamente el error que este instrumento existe para no cometer.
 */
export function semaforo(
  coberturaCapacidad: number,
  coberturaAjuste: number,
  bloqueado: string[],
): Semaforo {
  if (bloqueado.length > 0) return "bloqueado";
  return coberturaCapacidad >= 100 && coberturaAjuste >= 100 ? "listo" : "falta_evidencia";
}

export const SEMAFORO_LABEL: Record<Semaforo, string> = {
  listo: "Listo para decidir",
  falta_evidencia: "Falta evidencia",
  bloqueado: "Bloqueado por excluyente",
};

/* ══════════════════════════════════════════════════════════════
   El prompt. Las reglas duras van acá y no en el código de la
   ruta, para que se puedan leer de corrido y discutir sin abrir
   un endpoint.
   ══════════════════════════════════════════════════════════════ */

export const REGLAS = `
REGLAS QUE NO SE NEGOCIAN

1. Si la evidencia no alcanza, el estado es "sin_evidencia" y el nivel es null.
   NUNCA infieras desde la ausencia: que alguien no mencione algo no significa
   que no lo tenga. Un CV que no nombra una certificación no prueba que no la
   tenga — prueba que no la nombró.

2. Todo veredicto distinto de "sin_evidencia" lleva una CITA TEXTUAL del
   documento, copiada tal cual, y el nombre del archivo del que salió. Sin cita
   no hay veredicto.

3. No uses, no menciones y no tengas en cuenta: edad, fecha de nacimiento,
   sexo, foto, estado civil, hijos, nacionalidad, lugar de origen, barrio,
   estrato, religión, convicciones políticas, condición de salud, ni prestigio
   de la universidad. Si aparecen en el documento, ignóralos por completo.
   Tampoco los uses como explicación de nada.

4. No calcules totales, promedios ni rankings. No recomiendes contratar ni
   descartar. Solo respondes criterio por criterio.

5. Para cada criterio que quede en "sin_evidencia", escribe la pregunta
   concreta que habría que hacerle a la persona para resolverlo. Es la salida
   más útil de todo el ejercicio.

6. El nivel va de 1 a 5 y debe corresponder a las anclas de conducta cuando el
   criterio las traiga. Si no las trae, 3 es "cumple lo esperado".

7. Si un archivo viene ilegible, en blanco o es un escaneo sin texto
   reconocible, dilo en "evidencia" con esas palabras y deja estado
   "sin_evidencia". No adivines el contenido.

8. Los criterios de ASSESSMENT se resuelven leyendo el ENTREGABLE que la
   persona produjo: el caso escrito, la matriz, el plan. Juzgá el trabajo que
   está en el papel, no la persona. Si en el expediente no hay ningún producto
   del assessment, es "sin_evidencia" — no lo deduzcas de la hoja de vida.
   Nunca juzgues conducta de sala: cómo se paró, cómo negoció, si sostuvo el
   criterio cuando lo contradijeron. Eso no está en ningún documento, y lo
   califica quien estuvo ahí.

9. El prefiltro es lo que la persona DECLARÓ de sí misma en un formulario. Sirve
   para ubicar y para preguntar, no como prueba de una conducta. No lo uses como
   evidencia de un criterio que pide haber visto algo.
`.trim();

export function construirPrompt(
  r: Rubrica,
  criterios: { bloque: Bloque; criterio: Criterio }[],
  contexto: string,
): string {
  const lista = criterios
    .map(({ bloque, criterio }) => {
      const anclas = criterio.anclas
        ? `\n     anclas — 1: ${criterio.anclas.n1} · 3: ${criterio.anclas.n3} · 5: ${criterio.anclas.n5}`
        : "";
      return `   • ${criterio.id} · ${criterio.nombre} (bloque ${bloque.nombre})
     qué observar: ${criterio.observar}
     fuente esperada: ${criterio.fuente}${criterio.excluyente ? "\n     EXCLUYENTE" : ""}${anclas}`;
    })
    .join("\n");

  return `Evaluás el expediente de un candidato para el cargo "${r.cargo}" contra
la rúbrica ${r.key} v${r.version}.

${REGLAS}

CRITERIOS A RESOLVER
${lista}

CONTEXTO DEL CANDIDATO
${contexto}

Los documentos adjuntos vienen en este mismo mensaje. Léelos.

Devuelve EXACTAMENTE este JSON, sin texto antes ni después y sin bloque de código:
{"veredictos":[{"criterio_id":"...","estado":"cumple|no_cumple|sin_evidencia","nivel":1-5 o null,"evidencia":"cita textual o null","fuente":"nombre del archivo o null","pregunta":"pregunta para la entrevista o null"}]}

Un objeto por cada criterio de la lista, en el mismo orden.`;
}
