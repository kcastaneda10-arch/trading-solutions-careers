/**
 * RÚBRICAS DE CARGO · con qué se califica a un candidato
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 * Hasta ahora los pesos de cada proceso vivían en la cabeza de quien lo armó y
 * en una hoja suelta. Cuando alguien pregunta por qué un candidato quedó por
 * encima de otro, la respuesta tiene que poder señalarse: este criterio, este
 * peso, esta evidencia. Una rúbrica escrita es lo que separa una decisión
 * defendible de una opinión con número.
 *
 * DOS EJES, NO UNO
 * La rúbrica del cargo (capacidad) y el TS Standard (ajuste) NO se suman. Un
 * promedio entre las dos esconde justo lo que hay que ver: alguien fuerte
 * técnicamente con ajuste bajo es una decisión distinta —y una conversación
 * distinta— que alguien al revés. Se reportan por separado, como el 9-box.
 *
 * LO QUE LA IA NO HACE
 * El agente responde criterio por criterio con evidencia citada. El total lo
 * calcula el código con estos pesos. Por eso un 4,33 se puede defender renglón
 * por renglón, y por eso el puntaje no cambia si cambia el modelo.
 *
 * COBERTURA
 * Un puntaje sin evidencia completa no es comparable con uno que sí la tiene.
 * `cobertura` es el porcentaje del peso que llegó con evidencia, y va SIEMPRE
 * al lado del número. Sin eso, un 4,3 con media rúbrica vacía se lee igual que
 * un 4,1 completo, que es exactamente el error que se quiere evitar.
 */

export type Fuente =
  | "bateria"
  | "assessment"
  | "roles"
  | "hoja_de_vida"
  | "entrevista"
  | "referencias"
  | "simulacion";

export const FUENTE_LABEL: Record<Fuente, string> = {
  bateria: "Batería",
  assessment: "Assessment presencial",
  roles: "Juego de roles",
  hoja_de_vida: "Hoja de vida",
  entrevista: "Entrevista",
  referencias: "Referencias",
  simulacion: "Simulación",
};

/** Quién produce el dato. La IA solo puede leer documentos. */
export const FUENTE_LA_CARGA: Record<Fuente, "agente" | "wellness"> = {
  bateria: "agente",        // ya está calculada; el agente la lee, no la recalcula
  hoja_de_vida: "agente",
  referencias: "agente",
  simulacion: "agente",
  assessment: "wellness",   // se vio en la sala; nadie lo puede leer de un PDF
  roles: "wellness",
  entrevista: "wellness",
};

export type Criterio = {
  id: string;
  nombre: string;
  /** Qué conducta hay que ver. En segunda persona y observable. */
  observar: string;
  fuente: Fuente;
  /** Peso dentro de su bloque, en porcentaje. Los de un bloque suman 100. */
  peso: number;
  excluyente?: boolean;
  /** Anclas de conducta. Sin esto, dos evaluadores puntúan distinto. */
  anclas?: { n1: string; n3: string; n5: string };
};

export type Bloque = {
  id: string;
  nombre: string;
  /** Peso del bloque dentro del eje. Los bloques de un eje suman 100. */
  peso: number;
  nota?: string;
  criterios: Criterio[];
};

export type Rubrica = {
  key: string;
  cargo: string;
  version: string;
  vigente_desde: string;
  /** Eje de capacidad: sirve para el cargo. */
  capacidad: Bloque[];
  /** Eje de ajuste: encaja con la compañía. No se suma al anterior. */
  ajuste: Bloque[];
  /** Lo que el instrumento no mide. Declararlo es lo que lo hace auditable. */
  no_mide: string[];
};

/* ══════════════════════════════════════════════════════════════
   ESPECIALISTA SIG-SST · v1.0
   Ponderación definida por Kelly Castañeda, septiembre 2026.
   El 45 % del assessment carga hacia ejecución porque el cargo no
   tendrá equipo: la persona lidera Y ejecuta.
   ══════════════════════════════════════════════════════════════ */
export const SIG_SST: Rubrica = {
  key: "sig-sst",
  cargo: "Especialista SIG-SST",
  version: "1.0",
  vigente_desde: "2026-09-16",

  capacidad: [
    {
      id: "assessment",
      nombre: "Assessment presencial",
      peso: 45,
      nota:
        "Pesa la ejecución por encima del conocimiento: no va a tener equipo que ejecute por él. " +
        "Le toca liderar e implementar, además de saber.",
      criterios: [
        {
          id: "ejecucion",
          nombre: "Capacidad de ejecución",
          observar:
            "Levantó el entregable con sus propias manos y lo dejó utilizable, no solo explicado",
          fuente: "assessment",
          peso: 70,
          anclas: {
            n1: "Explica qué habría que hacer, pero no produce nada usable",
            n3: "Produce el entregable con ayuda o deja partes sin cerrar",
            n5: "Entrega completo y priorizado, y señala qué quedó fuera y por qué",
          },
        },
        {
          id: "conocimiento",
          nombre: "Conocimiento normativo",
          observar:
            "Identifica los hallazgos y cita la norma aplicable — BASC, ISO 45001, ISO 9001",
          fuente: "assessment",
          peso: 30,
          anclas: {
            n1: "No identifica los hallazgos principales",
            n3: "Los identifica pero no los ata a un requisito concreto",
            n5: "Los identifica y cita el requisito que aplica en cada uno",
          },
        },
      ],
    },
    {
      id: "roles",
      nombre: "Juego de roles",
      peso: 35,
      nota: "Calificado por Wellness en la sesión. El agente no interpreta esto.",
      criterios: [
        {
          id: "autoridad_tecnica",
          nombre: "Autoridad técnica con equipo junior",
          observar:
            "Explica y hace cumplir sin imponer, y verifica que el otro entendió",
          fuente: "roles",
          peso: 40,
          anclas: {
            n1: "Repite la norma textual sin adaptar el lenguaje",
            n3: "Adapta el mensaje pero no verifica comprensión",
            n5: "Adapta, verifica y deja una tarea concreta y verificable",
          },
        },
        {
          id: "sostiene_criterio",
          nombre: "Sostiene criterio bajo presión",
          observar: "Mantiene la posición técnica cuando alguien con más jerarquía lo contradice",
          fuente: "roles",
          peso: 35,
          anclas: {
            n1: "Cede ante la primera objeción",
            n3: "Sostiene pero sin argumento técnico",
            n5: "Sostiene con evidencia y ofrece una salida viable",
          },
        },
        {
          id: "negocia",
          nombre: "Negocia con el área",
          observar: "Consigue compromisos con fecha y responsable, no buenas intenciones",
          fuente: "roles",
          peso: 25,
          anclas: {
            n1: "Sale sin ningún compromiso",
            n3: "Obtiene acuerdo verbal sin fecha",
            n5: "Sale con responsable, fecha y forma de verificar",
          },
        },
      ],
    },
    {
      id: "bateria",
      nombre: "Batería psicométrica",
      peso: 20,
      nota:
        "Se consume el resultado que ya calculó el instrumento. No se recalcula ni se reinterpreta.",
      criterios: [
        {
          id: "razonamiento",
          nombre: "Razonamiento",
          observar: "Puntaje del bloque de razonamiento, 28 ítems",
          fuente: "bateria",
          peso: 45,
        },
        {
          id: "cumplimiento",
          nombre: "Cumplimiento de normas",
          observar: "Escala de integridad · crítica para este cargo",
          fuente: "bateria",
          peso: 30,
          excluyente: true,
          anclas: {
            n1: "Por debajo de 70 · no apto para un cargo que audita",
            n3: "Entre 70 y 85",
            n5: "Por encima de 85",
          },
        },
        {
          id: "veracidad",
          nombre: "Veracidad",
          observar: "Escala de integridad · crítica para este cargo",
          fuente: "bateria",
          peso: 25,
          excluyente: true,
          anclas: {
            n1: "Por debajo de 70 · no apto",
            n3: "Entre 70 y 85",
            n5: "Por encima de 85",
          },
        },
      ],
    },
  ],

  ajuste: [
    {
      id: "ts_standard",
      nombre: "TS Standard",
      peso: 85,
      nota:
        "Siete de once criterios solo se pueden ver en entrevista: esto es sobre todo una guía " +
        "de entrevista estructurada, no un filtro documental.",
      criterios: [
        { id: "ts1", nombre: "Amor por el trabajo", peso: 11, fuente: "simulacion",
          observar: "Sostiene la calidad de su trabajo cuando nadie lo revisa ni lo reconoce" },
        { id: "ts2", nombre: "Lógica y agilidad mental", peso: 11, fuente: "bateria",
          observar: "Resuelve problemas nuevos sin procedimiento previo" },
        { id: "ts3", nombre: "Inglés funcional", peso: 5.5, fuente: "entrevista",
          observar: "Sostiene diez minutos de conversación técnica en inglés" },
        { id: "ts5", nombre: "Creatividad e iniciativa", peso: 5.5, fuente: "entrevista",
          observar: "Propuso algo que nadie le pidió y lo llevó hasta implementación" },
        { id: "ts7", nombre: "Ambición y logro", peso: 11, fuente: "bateria",
          observar: "Se fijó metas por encima de lo pedido y persiguió superarlas" },
        { id: "ts8", nombre: "Gestión y agencia personal", peso: 11, fuente: "entrevista",
          observar: "Ante un obstáculo describe qué hizo él, no qué le hicieron" },
        { id: "ts9", nombre: "Capacidad verbal", peso: 7.7, fuente: "entrevista",
          observar: "Explica algo técnico a alguien que no sabe del tema" },
        { id: "ts10", nombre: "Regulación bajo presión", peso: 7.7, fuente: "assessment",
          observar: "Mantiene criterio cuando lo contradicen o se le acumula el trabajo" },
        { id: "ts11", nombre: "Aprendizaje continuo", peso: 5.5, fuente: "hoja_de_vida",
          observar: "Formación reciente que nadie le exigió ni le pagó la empresa" },
        { id: "ts13", nombre: "Perfil tecnológico", peso: 7.7, fuente: "hoja_de_vida",
          observar: "Aprendió una herramienta por su cuenta y la puso a trabajar" },
        { id: "ts15", nombre: "Espíritu competitivo", peso: 11, fuente: "entrevista",
          observar: "Se mide contra un indicador propio, no contra lo que le exigen" },
        { id: "ts16", nombre: "Vendía desde joven", peso: 5.4, fuente: "hoja_de_vida",
          observar: "Iniciativa comercial o emprendedora temprana" },
      ],
    },
    {
      id: "canje",
      nombre: "Ajuste al contexto",
      peso: 15,
      nota: "Nunca excluyente. Un excluyente cultural es donde se cuela todo lo que no debería.",
      criterios: [
        {
          id: "canje_real",
          nombre: "El canje declarado",
          observar:
            "Por qué este cargo a este sueldo, y si su historia muestra que ya hizo algo parecido antes",
          fuente: "entrevista",
          peso: 40,
          anclas: {
            n1: "No sabe decir qué gana; solo necesita el trabajo",
            n3: "Nombra un motivo genérico — aprender, crecer",
            n5: "Nombra algo concreto que acá consigue y en otro lado no, y su historia lo respalda",
          },
        },
        {
          id: "sin_andamiaje",
          nombre: "Produce sin andamiaje",
          observar: "Resultados donde nadie le definió qué era estar bien hecho",
          fuente: "entrevista",
          peso: 35,
        },
        {
          id: "horizonte",
          nombre: "Horizonte declarado",
          observar: "Cuánto espera quedarse y para qué",
          fuente: "entrevista",
          peso: 25,
          anclas: {
            n1: "Evita la pregunta o promete lo que cree que se quiere oír",
            n3: "Da un horizonte sin razón detrás",
            n5: "Da un horizonte concreto y lo justifica con lo que quiere lograr",
          },
        },
      ],
    },
  ],

  no_mide: [
    "Desempeño futuro. Ningún puntaje de selección lo predice sin validación propia, y la nuestra todavía no existe.",
    "Edad, sexo, estado civil, origen, religión, convicciones políticas ni condición de salud. No entran al razonamiento ni aunque aparezcan en la hoja de vida.",
    "Prestigio de la universidad, becas ni formación en el exterior: son indicios de estrato, no de capacidad. Lo que buscaban se mide directo en razonamiento e inglés.",
    "Disponibilidad fuera de jornada como prueba de compromiso. Los picos reales del cargo se declaran en la oferta; la silla no se califica.",
  ],
};

export const RUBRICAS: Rubrica[] = [SIG_SST];

export function getRubrica(key: string): Rubrica | undefined {
  return RUBRICAS.find((r) => r.key === key);
}

/**
 * Qué rúbrica le corresponde a una vacante.
 *
 * SE RESUELVE POR EL TÍTULO, Y ESO ES UN PARCHE
 * La primera versión buscaba «sig» o «sst». La vacante real se llama
 * «Integrated Management Systems & HSE Specialist», así que no coincidía con
 * ninguna de las dos y el panel de evaluación simplemente no aparecía: la
 * pantalla callada en vez de decir qué pasaba. Acá van también los términos en
 * inglés con los que el cargo está publicado.
 *
 * Amarrar una calificación a una coincidencia de texto envejece mal y hay que
 * cambiarlo por una columna `rubrica_key` en `ht_vacancies` con un selector en
 * la ficha de la vacante. Mientras tanto, esta lista tiene que incluir cómo se
 * llama el cargo DE VERDAD, no cómo lo llamamos entre nosotros.
 *
 * Devuelve `undefined` cuando el cargo no tiene rúbrica, y la pantalla lo dice
 * en vez de calificar con la regla de otro cargo.
 */
const CLAVES_SIG_SST = [
  "sig", "sst", "hse", "hseq",
  "sistemas integrados", "integrated management",
  "seguridad y salud",
];

export function rubricaDeVacante(titulo?: string | null): Rubrica | undefined {
  const t = (titulo || "").toLowerCase();
  if (!t) return undefined;
  if (CLAVES_SIG_SST.some((k) => t.includes(k))) return SIG_SST;
  return undefined;
}

/** Peso efectivo de un criterio dentro de su eje, en puntos sobre 100. */
export function pesoEfectivo(bloque: Bloque, criterio: Criterio): number {
  return (bloque.peso * criterio.peso) / 100;
}

/**
 * Calcula un eje a partir de los niveles que ya tienen evidencia.
 *
 * Solo promedia lo que llegó con evidencia y devuelve la cobertura aparte.
 * Rellenar lo que falta con un promedio sería inventar el dato que justamente
 * no se tiene.
 */
export function calcularEje(
  bloques: Bloque[],
  niveles: Record<string, number | null>,
): { puntaje: number | null; cobertura: number; bloqueado: string[] } {
  let suma = 0;
  let pesoConEvidencia = 0;
  let pesoTotal = 0;
  const bloqueado: string[] = [];

  for (const b of bloques) {
    for (const c of b.criterios) {
      const p = pesoEfectivo(b, c);
      pesoTotal += p;
      const n = niveles[c.id];
      if (n == null) continue;
      pesoConEvidencia += p;
      suma += n * p;
      if (c.excluyente && n <= 2) bloqueado.push(c.nombre);
    }
  }

  return {
    puntaje: pesoConEvidencia > 0 ? suma / pesoConEvidencia : null,
    cobertura: pesoTotal > 0 ? Math.round((pesoConEvidencia / pesoTotal) * 100) : 0,
    bloqueado,
  };
}
