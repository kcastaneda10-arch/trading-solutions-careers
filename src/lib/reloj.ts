/**
 * EL RELOJ DE UNA VACANTE · días calendario, días en pausa, días activos
 *
 * POR QUÉ EXISTE
 * El tiempo de cubrimiento mide la capacidad del equipo de Talento de cubrir
 * una vacante. Cuando el área que pidió la vacante la pone en stand-by, esos
 * días no son demora del equipo — pero hasta ahora contaban igual, así que el
 * indicador castigaba a quien no tomó la decisión.
 *
 * Y cuando el área cambia el perfil a mitad de camino, la búsqueda anterior
 * terminó: las hojas de vida que ya se vieron no sirven. El reloj arranca de
 * nuevo, pero sin borrar que la vacante existe desde antes.
 *
 * REGLA DE ORO
 * Nunca se reporta solo la cifra neta. La neta explica el trabajo del equipo;
 * la bruta es la que vivió el candidato esperando, y esa no se puede borrar.
 */

const DIA = 1000 * 60 * 60 * 24;

export type Pausa = {
  started_at: string;
  /** null = la pausa sigue abierta hoy */
  ended_at: string | null;
  reason?: string | null;
  requested_by?: string | null;
};

function aFecha(v: string | Date | null | undefined): number | null {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
}

function redondear(dias: number): number {
  return Math.max(0, Math.round(dias * 10) / 10);
}

/** ¿Hay una pausa abierta ahora mismo? */
export function enPausa(pausas: Pausa[] | undefined): Pausa | null {
  return (pausas || []).find((p) => !p.ended_at) ?? null;
}

/**
 * Días que la vacante estuvo en pausa dentro de la ventana [desde, hasta].
 *
 * Se recorta cada tramo contra la ventana en vez de sumarlo entero: una pausa
 * que empezó antes del reinicio de la búsqueda no puede descontar días que
 * todavía no habían empezado a correr.
 */
export function diasEnPausa(
  pausas: Pausa[] | undefined,
  desde: string | Date | null | undefined,
  hasta: string | Date | null | undefined = new Date(),
): number {
  const ini = aFecha(desde);
  const fin = aFecha(hasta) ?? Date.now();
  if (ini == null) return 0;

  let ms = 0;
  for (const p of pausas || []) {
    const pIni = aFecha(p.started_at);
    if (pIni == null) continue;
    const pFin = aFecha(p.ended_at) ?? fin;
    const a = Math.max(pIni, ini);
    const b = Math.min(pFin, fin);
    if (b > a) ms += b - a;
  }
  return redondear(ms / DIA);
}

/** Días calendario desde una fecha. Es lo que vivió el candidato. */
export function diasCalendario(desde: string | Date | null | undefined): number {
  const ini = aFecha(desde);
  if (ini == null) return 0;
  return redondear((Date.now() - ini) / DIA);
}

/**
 * Días activos = calendario − pausa. Es contra este número que se mide el SLA.
 */
export function diasActivos(
  desde: string | Date | null | undefined,
  pausas?: Pausa[],
): number {
  return redondear(diasCalendario(desde) - diasEnPausa(pausas, desde));
}

/**
 * Desde cuándo cuenta el reloj de un candidato.
 *
 * Si la búsqueda se reinició por un cambio de perfil, un candidato que entró
 * antes de ese día pertenece a la búsqueda anterior: su reloj se cuenta desde
 * el reinicio, no desde que aplicó.
 */
export function inicioDelReloj(
  eventoDelCandidato: string | Date | null | undefined,
  reinicioDeLaBusqueda: string | Date | null | undefined,
): string | null {
  const ev = aFecha(eventoDelCandidato);
  const re = aFecha(reinicioDeLaBusqueda);
  if (ev == null) return re == null ? null : new Date(re).toISOString();
  if (re == null) return new Date(ev).toISOString();
  return new Date(Math.max(ev, re)).toISOString();
}

/** Las tres cifras juntas, que es como hay que reportarlas. */
export function reloj(
  desde: string | Date | null | undefined,
  pausas?: Pausa[],
): { calendario: number; pausa: number; activos: number; en_pausa: boolean } {
  const calendario = diasCalendario(desde);
  const pausa = diasEnPausa(pausas, desde);
  return {
    calendario,
    pausa,
    activos: redondear(calendario - pausa),
    en_pausa: !!enPausa(pausas),
  };
}
