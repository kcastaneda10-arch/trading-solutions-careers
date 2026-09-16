/**
 * Pedirle al Funnel que abra la ficha de alguien, desde otra pantalla.
 *
 * POR QUÉ NO ALCANZA UN EVENTO SUELTO
 * Quien pide viene de otra pestaña, así que el Funnel todavía no está montado
 * cuando se dispara el evento: nadie lo escucha y el clic se pierde en
 * silencio. El pedido queda guardado acá hasta que alguien lo recoge, y el
 * evento solo sirve para el caso en que el Funnel YA estaba en pantalla.
 */

const EVENTO = "abrir-candidato";
let pendiente: string | null = null;

export function pedirAbrirCandidato(id: string) {
  pendiente = id;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO));
}

/** Lo recoge el Funnel. Devuelve el id una sola vez. */
export function tomarPedidoDeCandidato(): string | null {
  const p = pendiente;
  pendiente = null;
  return p;
}

export function escucharPedidos(fn: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENTO, fn);
  return () => window.removeEventListener(EVENTO, fn);
}
