/** Lo que la persona editó antes de generar: la frase y los próximos pasos. */
import type { Informe } from "./datos";

export function textosEditados(body: any, inf: Informe): { frase: string; pasos: string[] } {
  const frase = typeof body?.frase === "string" && body.frase.trim() ? body.frase.trim().slice(0, 1200) : inf.fraseSugerida;
  const pasos: string[] = Array.isArray(body?.pasos)
    ? body.pasos.map((p: unknown) => String(p ?? "").trim()).filter(Boolean).slice(0, 6).map((p: string) => p.slice(0, 400))
    : inf.pasosSugeridos;
  return { frase, pasos: pasos.length ? pasos : inf.pasosSugeridos };
}

export function nombreArchivo(inf: Informe): string {
  const fecha = new Date(inf.generado).toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
  const titulo = inf.vacante.titulo.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `Informe_${titulo}_${fecha}.pdf`;
}

/** Fuentes y logo se leen del propio dominio: están en /public. */
export function baseDe(url: string): string {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(url).origin;
}
