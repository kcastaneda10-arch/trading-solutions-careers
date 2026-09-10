/**
 * Bateria de Seleccion TS · perfiles de cargo
 *
 * Contra esto se calcula el % de match. Vive en git, no en la base, porque la
 * ficha tecnica exige control de versiones: si el perfil cambia, cambia la
 * version y los candidatos evaluados contra versiones distintas no se comparan.
 *
 * REGLA QUE NO SE ROMPE: cada numero lleva su `fundamento`. Un perfil sin
 * fundamento es una opinion con decimales, y es lo primero que se cae cuando
 * alguien impugna un descarte. Si no se puede explicar de donde sale el numero,
 * el numero no va.
 */

import type { FactorKey } from './interpretacion';

export type Axis = 'D' | 'I' | 'S' | 'C';

export type PerfilCargo = {
  key: string;
  nombre: string;
  version: string;
  /** Que hace la persona. En lenguaje de la operacion, no de RRHH. */
  descripcion: string;
  /** De donde salen los numeros. Es lo que se muestra si impugnan un descarte. */
  fundamento: string;
  /** Perfil DISC de referencia, en segmentos 1-7. */
  disc: Record<Axis, number>;
  /** Perfil de rasgos de referencia, 0-100. */
  bigfive: Record<FactorKey, number>;
  /** Cuanto puede alejarse un rasgo del ideal sin penalizar. */
  tolerancia: number;
  /** Pesos del match. Suman 1. */
  pesos: { personalidad: number; estilo: number; razonamiento: number; integridad: number };
  /** Por que esos pesos y no otros. Va impreso en el informe. */
  fundamentoPesos: string;
  /** Pisos: por debajo de esto se marca alerta, no solo baja el puntaje. */
  pisos: { razonamiento: number; integridad: number; porDimension?: Record<string, number> };
  /** Rasgos y dimensiones no negociables para este cargo. */
  criticos: { key: string; label: string; porque: string }[];
  /** Motivadores que sostienen o rompen la permanencia. No entran al match. */
  motivadores: { alto: string[]; bajo: string[]; nota: string };
};

/**
 * Mezcla dos perfiles puros con un peso. Se usa para cargos hibridos:
 * el resultado es trazable —se puede mostrar la cuenta— en vez de inventado.
 */
function mezclar<T extends Record<string, number>>(a: T, b: T, pesoA: number): T {
  const out: Record<string, number> = {};
  for (const k of Object.keys(a)) out[k] = Math.round(a[k] * pesoA + b[k] * (1 - pesoA));
  return out as T;
}

// ── Perfiles puros de referencia · insumo para las mezclas ──────────
const SIG_PURO = {
  disc: { D: 4, I: 3, S: 5, C: 7 } as Record<Axis, number>,
  bigfive: { EXT: 40, APE: 55, AMA: 45, RES: 85, EST: 65 } as Record<FactorKey, number>,
};
const SST_PURO = {
  disc: { D: 5, I: 6, S: 5, C: 5 } as Record<Axis, number>,
  bigfive: { EXT: 65, APE: 55, AMA: 60, RES: 62, EST: 75 } as Record<FactorKey, number>,
};

/** Inclinacion definida por Kelly para esta vacante: 70% SIG · 30% SST. */
const PESO_SIG = 0.7;

export const PERFILES: Record<string, PerfilCargo> = {
  'sig-sst': {
    key: 'sig-sst',
    nombre: 'Especialista SIG-SST',
    version: '1.0 · 70% SIG / 30% SST',
    descripcion:
      'Sostiene el sistema integrado de gestión y responde por que las certificaciones se mantengan. Documenta, audita, mide y cierra hallazgos; y sostiene la parte de seguridad y salud en campo, aunque no es donde pasa la mayor parte del tiempo.',
    fundamento:
      'El perfil es la mezcla ponderada de dos perfiles puros, 70% SIG y 30% SST, según la inclinación definida para esta vacante. ' +
      'SIG puro exige rigor documental, análisis y cierre (DISC D4 I3 S5 C7; Responsabilidad 85). ' +
      'SST puro exige presencia en piso, capacitación y trato con operarios (DISC D5 I6 S5 C5; Extraversión 65). ' +
      'Cada eje del perfil final es 0,7 × SIG + 0,3 × SST, redondeado. La cuenta se puede mostrar eje por eje.',
    disc: mezclar(SIG_PURO.disc, SST_PURO.disc, PESO_SIG),
    bigfive: mezclar(SIG_PURO.bigfive, SST_PURO.bigfive, PESO_SIG),
    tolerancia: 12,
    pesos: { personalidad: 0.3, estilo: 0.2, razonamiento: 0.3, integridad: 0.2 },
    fundamentoPesos:
      'Razonamiento 30%: auditar es distinguir lo que la evidencia permite concluir de lo que uno supone. ' +
      'Personalidad 30%, sostenida sobre todo en Responsabilidad: el cargo se mide por cierres, no por intenciones. ' +
      'Integridad 20%: es un cargo que firma y certifica. ' +
      'Estilo 20% y de último: la escala DISC es ipsativa y no ordena candidatos, solo mide distancia al perfil.',
    pisos: {
      razonamiento: 45,
      integridad: 70,
      porDimension: { 'INT-nor': 70, 'INT-ver': 70 },
    },
    criticos: [
      { key: 'RES', label: 'Responsabilidad', porque: 'Un sistema de gestión se cae por lo que no se cerró, no por lo que no se supo.' },
      { key: 'INT-nor', label: 'Cumplimiento de normas', porque: 'El cargo existe para sostener la norma cuando incomoda. Permisividad aquí anula el rol.' },
      { key: 'INT-ver', label: 'Veracidad', porque: 'Firma registros y hallazgos. Un umbral bajo en veracidad es riesgo de certificación.' },
    ],
    motivadores: {
      alto: ['MOT-log', 'MOT-aut'],
      bajo: ['MOT-rec'],
      nota:
        'Un perfil que se mueve por cerrar bien y por decidir el cómo encaja con un rol que trabaja solo buena parte del tiempo. ' +
        'Necesidad alta de reconocimiento es un riesgo de permanencia: es un cargo cuyo mejor resultado es que no pase nada, y eso rara vez se aplaude.',
    },
  },
};

/** Para el selector del panel: no hay que adivinar el cargo cuando la sesion
 *  se creo suelta y el titulo no coincide con ningun perfil. */
export const LISTA_PERFILES: { key: string; nombre: string }[] =
  Object.values(PERFILES).map((p) => ({ key: p.key, nombre: p.nombre }));

export function perfilDe(key: string | null | undefined): PerfilCargo | null {
  if (!key) return null;
  return PERFILES[key] ?? null;
}

/** Adivina el perfil a partir del titulo de la vacante. Conservador a proposito:
 *  si no hay match claro devuelve null y el informe lo dice, en vez de comparar
 *  contra un perfil que no corresponde. */
export function perfilPorTitulo(titulo: string | null | undefined): string | null {
  if (!titulo) return null;
  const t = titulo.toLowerCase();
  if (t.includes('sig') || t.includes('sst') || t.includes('hse')) return 'sig-sst';
  return null;
}
