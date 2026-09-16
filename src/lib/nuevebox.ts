/**
 * 9-BOX DE RECLUTAMIENTO · dónde cae cada candidato y qué se hace con él
 *
 * POR QUÉ UNA MATRIZ Y NO UNA LISTA ORDENADA
 * Una lista ordenada obliga a colapsar los dos ejes en un número, y ese número
 * esconde justo lo que hay que ver: alguien capaz con ajuste bajo y alguien
 * ajustado con capacidad media terminan en la misma posición del ranking siendo
 * dos decisiones opuestas. La matriz mantiene la tensión a la vista.
 *
 * EL 9-BOX DE DESEMPEÑO NO SIRVE ACÁ
 * El de gestión del talento cruza desempeño con potencial, y ambos se miden
 * sobre alguien que ya trabaja en la casa. En selección no hay desempeño: hay
 * evidencia de capacidad y evidencia de ajuste, recogidas en dos horas. Por eso
 * las celdas nombran DECISIONES —qué hacer con esta persona— y no etiquetas
 * sobre la persona. Nadie es una estrella ni un tronco; un expediente sostiene
 * o no sostiene una decisión.
 *
 * LA COBERTURA MANDA SOBRE EL PUNTAJE
 * Un candidato con 20 % de evidencia dibujado como un punto firme en una celda
 * miente con más fuerza que cualquier número mal calculado, porque la posición
 * en una matriz se lee como un hecho. Acá, por debajo del mínimo de cobertura,
 * la persona NO se ubica: queda en una bandeja aparte que dice qué falta.
 */

export type Banda = "bajo" | "medio" | "alto";

/**
 * Los cortes. Están acá, con nombre, para que se puedan discutir y mover sin
 * buscarlos dentro de una pantalla. Sobre la escala de anclas 1–5: 3 es "cumple
 * lo esperado", así que la banda media arranca en 3 y la alta en 4.
 */
export const CORTES = { medio: 3.0, alto: 4.0 } as const;

/**
 * Cobertura mínima para ubicar a alguien en la matriz. Por debajo de esto el
 * puntaje existe pero no es comparable, y una posición en una grilla se lee
 * como un hecho.
 */
export const COBERTURA_MINIMA = 80;

export const BANDA_LABEL: Record<Banda, string> = {
  alto: "Alta", medio: "Media", bajo: "Baja",
};

export function banda(puntaje: number | null | undefined): Banda | null {
  if (puntaje == null) return null;
  if (puntaje >= CORTES.alto) return "alto";
  if (puntaje >= CORTES.medio) return "medio";
  return "bajo";
}

export type Celda = {
  capacidad: Banda;
  ajuste: Banda;
  /** El nombre de la decisión, no del candidato. */
  titulo: string;
  /** Qué se hace. En imperativo, para que la celda sea accionable. */
  decision: string;
  /** El matiz que evita que la celda se lea como una sentencia. */
  nota?: string;
  /** Celdas donde hay algo que hacer, para destacarlas sin colorear «bueno». */
  accionable: boolean;
};

export const CELDAS: Celda[] = [
  {
    capacidad: "alto", ajuste: "alto",
    titulo: "Terna",
    decision: "Pasa a decisión final.",
    nota: "Sabe hacerlo y el canje se sostiene con su propia historia.",
    accionable: true,
  },
  {
    capacidad: "alto", ajuste: "medio",
    titulo: "Terna con reservas",
    decision: "Pasa, y se nombra en la oferta lo que no lo convence.",
    nota: "La reserva se dice antes de firmar, no se descubre en el mes dos.",
    accionable: true,
  },
  {
    capacidad: "alto", ajuste: "bajo",
    titulo: "Riesgo de salida temprana",
    decision: "Se puede contratar, sabiendo que probablemente se va.",
    nota:
      "Capaz para el cargo, pero el canje no cierra. Esta celda es la que hay que " +
      "contar: si se llena de gente fuerte, el problema no es el mercado.",
    accionable: true,
  },
  {
    capacidad: "medio", ajuste: "alto",
    titulo: "Formable",
    decision: "Solo si hay quien lo acompañe los primeros meses.",
    nota: "Le falta oficio, no ganas. Sin acompañamiento, formable es una promesa vacía.",
    accionable: true,
  },
  {
    capacidad: "medio", ajuste: "medio",
    titulo: "Segunda vuelta",
    decision: "No alcanza para decidir. Profundizar o cerrar.",
    accionable: true,
  },
  {
    capacidad: "medio", ajuste: "bajo",
    titulo: "No avanzar",
    decision: "Cerrar el proceso con devolución concreta.",
    accionable: false,
  },
  {
    capacidad: "bajo", ajuste: "alto",
    titulo: "Otro cargo",
    decision: "Para este no. Al banco de talento con el cargo anotado.",
    nota: "Encaja con la compañía; lo que no encaja es esta vacante.",
    accionable: true,
  },
  {
    capacidad: "bajo", ajuste: "medio",
    titulo: "No avanzar",
    decision: "Cerrar el proceso con devolución concreta.",
    accionable: false,
  },
  {
    capacidad: "bajo", ajuste: "bajo",
    titulo: "No avanzar",
    decision: "Cerrar el proceso con devolución concreta.",
    accionable: false,
  },
];

export function celdaDe(capacidad: Banda, ajuste: Banda): Celda {
  return CELDAS.find((c) => c.capacidad === capacidad && c.ajuste === ajuste)!;
}

/** Orden de filas y columnas de la grilla, de arriba-izquierda a abajo-derecha. */
export const FILAS: Banda[] = ["alto", "medio", "bajo"];   // capacidad, eje vertical
export const COLUMNAS: Banda[] = ["bajo", "medio", "alto"]; // ajuste, eje horizontal

export type EstadoUbicacion = "ubicado" | "bloqueado" | "falta_evidencia" | "sin_evaluar";

export type Ubicacion = {
  estado: EstadoUbicacion;
  capacidad: Banda | null;
  ajuste: Banda | null;
  celda: Celda | null;
  /** Qué falta para poder ubicarlo. Vacío cuando ya está ubicado. */
  motivo: string | null;
};

export type EvaluacionMinima = {
  capacidad_puntaje: number | null;
  capacidad_cobertura: number | null;
  ajuste_puntaje: number | null;
  ajuste_cobertura: number | null;
  bloqueado_por?: string[] | null;
} | null | undefined;

/**
 * Decide si un candidato se puede poner en la matriz, y dónde.
 *
 * El orden de las salidas importa y es deliberado: un excluyente manda sobre
 * todo lo demás —no interesa dónde caería—, y la falta de evidencia manda sobre
 * el puntaje. Solo al final, cuando hay con qué, se ubica.
 */
export function ubicar(ev: EvaluacionMinima): Ubicacion {
  const vacia: Ubicacion = {
    estado: "sin_evaluar", capacidad: null, ajuste: null, celda: null,
    motivo: "Todavía no se ha corrido la evaluación.",
  };
  if (!ev) return vacia;

  const bloqueado = ev.bloqueado_por ?? [];
  if (bloqueado.length > 0) {
    return {
      estado: "bloqueado", capacidad: null, ajuste: null, celda: null,
      motivo: `Excluyente por debajo del mínimo: ${bloqueado.join(", ")}.`,
    };
  }

  const cCap = ev.capacidad_cobertura ?? 0;
  const cAju = ev.ajuste_cobertura ?? 0;
  if (cCap < COBERTURA_MINIMA || cAju < COBERTURA_MINIMA) {
    const faltan: string[] = [];
    if (cCap < COBERTURA_MINIMA) faltan.push(`capacidad ${cCap} %`);
    if (cAju < COBERTURA_MINIMA) faltan.push(`ajuste ${cAju} %`);
    return {
      estado: "falta_evidencia", capacidad: null, ajuste: null, celda: null,
      motivo: `Evidencia insuficiente para ubicarlo (${faltan.join(" · ")}, mínimo ${COBERTURA_MINIMA} %).`,
    };
  }

  const bCap = banda(ev.capacidad_puntaje);
  const bAju = banda(ev.ajuste_puntaje);
  if (!bCap || !bAju) return vacia;

  return {
    estado: "ubicado", capacidad: bCap, ajuste: bAju,
    celda: celdaDe(bCap, bAju), motivo: null,
  };
}

/**
 * El dato que Kelly necesita para la conversación con dirección: cuántos
 * candidatos capaces se pierden por el canje y no por el mercado.
 *
 * Es un conteo, no una conclusión. Con cuatro procesos no prueba nada; con
 * veinte, es un patrón que se puede poner sobre la mesa.
 */
export function fugaDeCapaces(ubicaciones: Ubicacion[]): {
  capacesTotal: number; conAjusteBajo: number; porcentaje: number | null;
} {
  const capaces = ubicaciones.filter((u) => u.estado === "ubicado" && u.capacidad === "alto");
  const fuga = capaces.filter((u) => u.ajuste === "bajo");
  return {
    capacesTotal: capaces.length,
    conAjusteBajo: fuga.length,
    porcentaje: capaces.length ? Math.round((fuga.length / capaces.length) * 100) : null,
  };
}
