import { SIG_SST, calcularEje, pesoEfectivo, FUENTE_LABEL, FUENTE_LA_CARGA } from "../src/lib/rubricas";
import { criteriosDelAgente, criteriosDeWellness, semaforo, SEMAFORO_LABEL } from "../src/lib/evaluacion";

const agente: Record<string, number | null> = {
  razonamiento: 4, cumplimiento: 4, veracidad: 5,
  ts1: null, ts2: 4, ts7: 3, ts11: 5, ts13: 4, ts16: null,
};
const wellness: Record<string, number | null> = {
  ejecucion: 3, conocimiento: 5,
  autoridad_tecnica: 4, sostiene_criterio: 3, negocia: 2,
  ts10: 4,
};

function escena(niveles: Record<string, number | null>) {
  const cap = calcularEje(SIG_SST.capacidad, niveles);
  const aju = calcularEje(SIG_SST.ajuste, niveles);
  return {
    capacidad_puntaje: cap.puntaje, capacidad_cobertura: cap.cobertura,
    ajuste_puntaje: aju.puntaje, ajuste_cobertura: aju.cobertura,
    bloqueado_por: cap.bloqueado, semaforo: semaforo(cap.cobertura, aju.cobertura, cap.bloqueado),
  };
}

const A = escena(agente);
const B = escena({ ...agente, ...wellness });
const C = escena({ ...agente, ...wellness, veracidad: 2 });

// Estructura de la rúbrica, aplanada para el HTML
const estructura = {
  cargo: SIG_SST.cargo, version: SIG_SST.version,
  ejes: [
    { id: "capacidad", titulo: "Eje de capacidad", bloques: SIG_SST.capacidad },
    { id: "ajuste", titulo: "Eje de ajuste · TS Standard", bloques: SIG_SST.ajuste },
  ].map((e) => ({
    ...e,
    bloques: e.bloques.map((b) => ({
      id: b.id, nombre: b.nombre, peso: b.peso, nota: b.nota ?? null,
      criterios: b.criterios.map((c) => ({
        id: c.id, nombre: c.nombre, observar: c.observar, peso: c.peso,
        excluyente: !!c.excluyente, fuente: c.fuente,
        fuente_label: FUENTE_LABEL[c.fuente], carga: FUENTE_LA_CARGA[c.fuente],
        efectivo: Number(pesoEfectivo(b, c).toFixed(3)),
        anclas: c.anclas ?? null,
      })),
    })),
  })),
};

console.log(JSON.stringify({
  A, B, C, estructura,
  labels: SEMAFORO_LABEL,
  conteo: { agente: criteriosDelAgente(SIG_SST).length, wellness: criteriosDeWellness(SIG_SST).length },
}, null, 0));
