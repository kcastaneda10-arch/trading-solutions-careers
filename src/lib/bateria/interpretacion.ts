/**
 * Bateria de Seleccion TS · capa de interpretacion
 *
 * Aqui vive lo que convierte numeros en informe: nombres de factor y faceta,
 * arquetipos, patrones DISC y perfiles de cargo tipo. Texto propio.
 *
 * Regla de redaccion que no se rompe: ninguna descripcion afirma algo que la
 * escala no mide. Nada de diagnosticos, nada de rasgos clinicos, nada de
 * predicciones sobre la persona fuera del trabajo.
 */

// ─────────────────────────────────────────────────────────────
// CINCO GRANDES · factores y facetas
// ─────────────────────────────────────────────────────────────
export type FactorKey = 'EXT' | 'APE' | 'AMA' | 'RES' | 'EST';

export const FACTORS: Record<FactorKey, {
  label: string;
  polos: [string, string];
  facets: { key: string; label: string; alto: string; bajo: string }[];
  queSignifica: string;
  alto: string;
  medio: string;
  bajo: string;
}> = {
  EXT: {
    label: 'Extraversión',
    polos: ['Reservado', 'Expresivo'],
    queSignifica: 'Cuánta energía dirige hacia afuera: hacia la gente, la conversación y la iniciativa visible.',
    alto: 'Toma la palabra sin que se la pidan y se le nota cuando algo le importa. En un equipo nuevo se ubica rápido. El costo: puede ocupar el espacio de los más callados y decidir en voz alta antes de haber escuchado.',
    medio: 'Se mueve con soltura entre hablar y escuchar. No es el que arranca la reunión ni el que se queda mudo. En la práctica es el rango más versátil y el más difícil de leer en una entrevista corta.',
    bajo: 'Trabaja mejor con menos ruido y menos gente. Cuando habla, suele ser porque tiene algo que decir. El costo: su aporte puede pasar desapercibido en reuniones grandes, y hay que preguntarle directamente para que aparezca.',
    facets: [
      { key: 'EXT-soc', label: 'Sociabilidad', alto: 'Busca el contacto, se acomoda rápido en grupos nuevos', bajo: 'Prefiere pocos interlocutores y espacios conocidos' },
      { key: 'EXT-ase', label: 'Asertividad', alto: 'Toma la iniciativa y sostiene su posición de frente', bajo: 'Cede el turno y evita la confrontación directa' },
      { key: 'EXT-ene', label: 'Energía', alto: 'Ritmo alto y entusiasmo visible', bajo: 'Ritmo parejo, poca expresión externa' },
    ],
  },
  APE: {
    label: 'Apertura',
    polos: ['Práctico', 'Explorador'],
    queSignifica: 'Qué tanto lo mueve lo nuevo: ideas, métodos distintos, cambios de rumbo.',
    alto: 'Cuestiona el "siempre se ha hecho así" y propone alternativas. Se adapta a un cambio de reglas sin desarmarse. El costo: puede rediseñar cosas que estaban funcionando y aburrirse con la operación estable.',
    medio: 'Escucha lo nuevo sin comprarlo de entrada. Cambia cuando ve la razón. Es el rango que mejor sostiene una mejora sin volverla un proyecto interminable.',
    bajo: 'Se apoya en lo que ya probó y ejecuta con menos vueltas. En un proceso maduro, eso es una ventaja. El costo: ante un cambio de reglas necesita más acompañamiento y más tiempo del que la organización suele dar.',
    facets: [
      { key: 'APE-cur', label: 'Curiosidad', alto: 'Investiga más allá de lo que el trabajo exige', bajo: 'Se concentra en lo que necesita saber' },
      { key: 'APE-ima', label: 'Generación de ideas', alto: 'Propone caminos que nadie mencionó', bajo: 'Aterriza y ejecuta lo que otros proponen' },
      { key: 'APE-cam', label: 'Adaptación al cambio', alto: 'Un cambio de planes no lo desarma', bajo: 'Rinde más cuando las reglas se mantienen' },
    ],
  },
  AMA: {
    label: 'Amabilidad',
    polos: ['Directo', 'Conciliador'],
    queSignifica: 'Cómo trata la relación cuando hay algo en juego: prioriza el vínculo o prioriza la posición.',
    alto: 'Cuida cómo queda el otro y busca el acuerdo. Le sale natural el trabajo con gente difícil. El costo: puede ceder en cosas que no debía y demorar una conversación necesaria por no incomodar.',
    medio: 'Coopera sin diluirse. Puede sostener una posición y salvar la relación en la misma conversación. Es el rango que mejor funciona en roles que tienen que decir "no" seguido.',
    bajo: 'Dice lo que piensa sin envolverlo y no cambia de posición por presión social. En una auditoría o una negociación dura eso vale. El costo: deja gente incómoda y a veces no se entera.',
    facets: [
      { key: 'AMA-emp', label: 'Empatía', alto: 'Lee el estado del otro sin que se lo digan', bajo: 'Se concentra en el asunto, no en el clima' },
      { key: 'AMA-coo', label: 'Cooperación', alto: 'Cede en lo secundario para avanzar', bajo: 'Sostiene su posición hasta el final' },
      { key: 'AMA-con', label: 'Confianza en otros', alto: 'Asume buena fe por defecto', bajo: 'Verifica antes de confiar' },
    ],
  },
  RES: {
    label: 'Responsabilidad',
    polos: ['Flexible', 'Estructurado'],
    queSignifica: 'Qué tanto ordena, sostiene y termina. Es el factor que más consistentemente predice desempeño en casi cualquier cargo.',
    alto: 'Organiza antes de arrancar, cumple lo que promete y no deja cabos sueltos. El costo: puede sobre-planificar, exigirse de más y frustrarse con quien trabaja distinto.',
    medio: 'Cumple sin volverlo un sistema. Funciona bien donde hay estructura, y no se paraliza donde no la hay.',
    bajo: 'Se mueve por prioridad del momento más que por plan. Puede ser una ventaja en un entorno cambiante. El costo: los plazos y el detalle necesitan un soporte externo que alguien tiene que poner.',
    facets: [
      { key: 'RES-ord', label: 'Orden', alto: 'Organiza el trabajo antes de empezar', bajo: 'Se acomoda al desorden y avanza igual' },
      { key: 'RES-dis', label: 'Disciplina', alto: 'Termina lo que empieza aunque deje de gustarle', bajo: 'Le cuesta sostener lo que ya no le interesa' },
      { key: 'RES-log', label: 'Orientación al logro', alto: 'Se pone metas por encima de lo pedido', bajo: 'Se conforma con cumplir lo acordado' },
    ],
  },
  EST: {
    label: 'Estabilidad emocional',
    polos: ['Reactivo', 'Estable'],
    queSignifica: 'Cómo responde a la presión y a la crítica. Se reporta en positivo: más alto es más estable.',
    alto: 'Bajo presión piensa igual que sin ella y una crítica no lo saca de curso. En roles de contacto duro y decisiones impopulares, esto es lo que sostiene. El costo: puede subestimar el impacto de una situación tensa en los demás.',
    medio: 'Acusa la presión pero se recupera. Necesita que las temporadas duras tengan final a la vista.',
    bajo: 'Registra antes y más fuerte lo que pasa alrededor, y eso a veces le da información que otros no ven. El costo: en periodos sostenidos de tensión el desgaste llega antes, y la crítica pesa más de lo que debería.',
    facets: [
      { key: 'EST-cal', label: 'Calma bajo presión', alto: 'Mantiene el juicio cuando se complica', bajo: 'Se le nota la tensión y le cuesta más decidir' },
      { key: 'EST-seg', label: 'Seguridad en sí mismo', alto: 'Confía en su criterio sin buscar confirmación', bajo: 'Necesita validación y le da vueltas a lo decidido' },
      { key: 'EST-reg', label: 'Recuperación', alto: 'Suelta rápido lo que lo molesta', bajo: 'Un mal rato le dura' },
    ],
  },
};

export const FACET_LABEL: Record<string, string> = Object.values(FACTORS)
  .flatMap((f) => f.facets)
  .reduce((acc, f) => ({ ...acc, [f.key]: f.label }), {} as Record<string, string>);

// ─────────────────────────────────────────────────────────────
// ARQUETIPOS · se derivan de los dos factores mas altos
// No son tipos: son una forma de nombrar un patron dimensional.
// La misma persona puede quedar cerca de dos arquetipos, y el informe
// lo dice cuando la diferencia entre el segundo y el tercer factor es < 8.
// ─────────────────────────────────────────────────────────────
export type Arquetipo = {
  nombre: string;
  lema: string;
  comoTrabaja: string;
  dondeBrilla: string;
  dondeSeComplica: string;
  queNecesitaDelJefe: string;
};

const A = (nombre: string, lema: string, comoTrabaja: string, dondeBrilla: string, dondeSeComplica: string, queNecesitaDelJefe: string): Arquetipo =>
  ({ nombre, lema, comoTrabaja, dondeBrilla, dondeSeComplica, queNecesitaDelJefe });

export const ARQUETIPOS: Record<string, Arquetipo> = {
  'EXT+RES': A('El Impulsor', 'Empuja y cierra',
    'Combina iniciativa visible con la disciplina para terminar. No solo propone: se queda hasta que la cosa quede hecha, y hace ruido si se está atrasando.',
    'Arranques, proyectos con fecha dura, equipos que venían quietos.',
    'Cuando el ritmo del resto no acompaña, empuja más fuerte en lugar de ajustar. Puede leerse como atropellador.',
    'Objetivos claros y espacio para decidir. La microgestión con este perfil es la vía rápida a la salida.'),
  'EXT+APE': A('El Promotor de Ideas', 'Abre caminos y contagia',
    'Ve la alternativa antes que los demás y sabe venderla. Su valor está tanto en la idea como en lograr que otros se suban.',
    'Cambios de rumbo, proyectos nuevos, romper una inercia.',
    'La operación estable lo apaga. Puede abrir más frentes de los que cierra.',
    'Un contrapeso que aterrice, y que le reconozcan la idea aunque otro la ejecute.'),
  'EXT+AMA': A('El Articulador', 'Conecta lo que estaba suelto',
    'Trabaja a través de la gente. Consigue que áreas que no se hablaban se pongan de acuerdo, y lo hace sin quemar a nadie.',
    'Roles transversales, coordinación entre áreas, servicio al cliente difícil.',
    'Le cuesta la conversación donde toca decir que no. Puede prometer para no incomodar.',
    'Respaldo explícito cuando tenga que sostener una posición impopular.'),
  'EXT+EST': A('El Frentero', 'Da la cara y no se quiebra',
    'Se pone adelante en las situaciones tensas y mantiene la cabeza fría. No lo mueve la presión ni la crítica.',
    'Crisis, clientes difíciles, negociaciones duras, roles de vocería.',
    'Puede no registrar el desgaste del equipo, porque a él no le pesa igual.',
    'Que le adviertan cuando el equipo va más cansado de lo que él percibe.'),
  'APE+RES': A('El Arquitecto', 'Diseña y lo deja funcionando',
    'Piensa el sistema completo y además lo implementa. No se queda en el diagrama: monta el proceso y lo sostiene.',
    'Rediseño de procesos, montar algo que no existe, ordenar un área desordenada.',
    'Puede sobre-diseñar. Tiende a rehacer lo que ya funcionaba porque ve una forma mejor.',
    'Un límite de alcance y una fecha. Con eso rinde el doble.'),
  'APE+AMA': A('El Facilitador', 'Ideas nuevas sin romper a la gente',
    'Introduce cambios cuidando a quienes los tienen que vivir. Consigue adopción, no solo aprobación.',
    'Gestión del cambio, capacitación, proyectos que dependen de que la gente los adopte.',
    'Puede diluir la propuesta para que a nadie le duela, y quedarse a mitad de camino.',
    'Que alguien más sostenga la parte impopular del cambio.'),
  'APE+EST': A('El Estratega', 'Piensa lejos sin alterarse',
    'Mira más allá del problema inmediato y no se contagia de la urgencia ajena. Sus decisiones envejecen bien.',
    'Planeación, análisis de escenarios, decisiones de largo plazo.',
    'Puede parecer distante o lento en un entorno que quiere respuesta ya.',
    'Que le pidan explícitamente el corto plazo, o lo desatiende.'),
  'AMA+RES': A('El Sostén', 'Cumple y cuida',
    'Es la persona en la que el equipo se apoya: entrega lo que promete y además está pendiente de cómo va el resto.',
    'Roles de soporte crítico, coordinación operativa, cualquier puesto donde fallar cueste caro.',
    'Absorbe más de lo que delega. Se sobrecarga en silencio.',
    'Que le revisen la carga real, no la declarada. No va a pedir ayuda.'),
  'AMA+EST': A('El Ancla', 'Estabiliza el entorno',
    'Baja la temperatura de los ambientes tensos. La gente acude a esta persona cuando algo se complica.',
    'Equipos en conflicto, atención a personas, roles que exigen paciencia sostenida.',
    'Puede tolerar demasiado tiempo una situación que había que escalar.',
    'Permiso explícito para escalar sin sentir que está acusando a alguien.'),
  'RES+EST': A('El Ejecutor', 'Sostiene el estándar pase lo que pase',
    'Hace lo que hay que hacer, en el orden que hay que hacerlo, sin que la presión le mueva el criterio.',
    'Operación crítica, auditoría, cumplimiento, todo lo que no puede fallar.',
    'Poco margen para lo ambiguo. Con reglas poco claras se frena.',
    'Reglas claras y autoridad para aplicarlas. Sin eso se desgasta.'),
  EQUILIBRADO: A('El Perfil Equilibrado', 'Sin picos, sin huecos',
    'Ningún factor domina el perfil. Se acomoda a lo que el rol pida en vez de imponer un estilo propio.',
    'Roles variados, equipos donde ya hay perfiles marcados, posiciones que cambian de foco seguido.',
    'Es el perfil más difícil de leer en una entrevista corta, y el que menos destaca en un proceso.',
    'Que le definan qué estilo necesita el cargo: se acomoda, pero hay que decírselo.'),
};

// ─────────────────────────────────────────────────────────────
// DISC · patrones comportamentales y cargos tipo
// ─────────────────────────────────────────────────────────────
export const DISC_LABEL: Record<string, string> = {
  D: 'Dominancia', I: 'Influencia', S: 'Estabilidad', C: 'Cumplimiento',
};

export const DISC_PATRONES: Record<string, { nombre: string; descripcion: string }> = {
  D: { nombre: 'Director', descripcion: 'Decide rápido y asume el mando sin que se lo pidan. Va al resultado y tolera mal la demora.' },
  I: { nombre: 'Comunicador', descripcion: 'Mueve por convencimiento y entusiasmo. Su herramienta es la relación, no la autoridad.' },
  S: { nombre: 'Constante', descripcion: 'Sostiene el ritmo y la calidad sin sobresaltos. Es en quien el equipo se apoya cuando algo se complica.' },
  C: { nombre: 'Analista', descripcion: 'Trabaja con el dato delante. No avanza sobre supuestos y detecta lo que a los demás se les pasa.' },
  DI: { nombre: 'Persuasivo', descripcion: 'Empuja y convence a la vez. Consigue que la gente lo siga hacia donde ya decidió ir.' },
  DC: { nombre: 'Evaluador', descripcion: 'Exigente con el estándar y con las personas. Decide rápido pero sobre evidencia.' },
  DS: { nombre: 'Realizador', descripcion: 'Empuja sin ruido. Se hace cargo y termina, sin necesidad de figurar.' },
  IS: { nombre: 'Consejero', descripcion: 'La gente le cuenta las cosas. Sostiene el clima del equipo y media sin imponerse.' },
  IC: { nombre: 'Asesor', descripcion: 'Convence con argumentos, no con carisma solo. Prepara antes de hablar.' },
  SC: { nombre: 'Especialista', descripcion: 'Profundidad y constancia. Se vuelve la referencia técnica del área sin proponérselo.' },
  DIS: { nombre: 'Promotor', descripcion: 'Arranca, entusiasma y acompaña. Es el que saca adelante lo que depende de mucha gente.' },
  DIC: { nombre: 'Negociador', descripcion: 'Sostiene la posición, convence y respalda con datos. Cómodo en la mesa difícil.' },
  DSC: { nombre: 'Perseverante', descripcion: 'No suelta. Combina exigencia, constancia y rigor; avanza aunque nadie lo esté mirando.' },
  ISC: { nombre: 'Agente', descripcion: 'Hace que las cosas pasen a través de otros, con cuidado del detalle y de la relación.' },
  EQ: { nombre: 'Versátil', descripcion: 'Ningún eje domina. Ajusta el estilo a lo que la situación pida, y por eso cuesta más anticiparlo.' },
};

/** Perfiles de cargo tipo · segmentos 1 a 7 por eje. Referencia para la afinidad. */
export const CARGOS_TIPO: { key: string; nombre: string; ref: Record<'D' | 'I' | 'S' | 'C', number>; nota: string }[] = [
  { key: 'gerente', nombre: 'Gerente', ref: { D: 6, I: 6, S: 3, C: 3 }, nota: 'Dirige a través de la gente: empuja y convence en la misma conversación.' },
  { key: 'director', nombre: 'Director', ref: { D: 7, I: 4, S: 2, C: 4 }, nota: 'Decide con poca información y sostiene decisiones impopulares.' },
  { key: 'ventas', nombre: 'Promotor de ventas', ref: { D: 5, I: 7, S: 3, C: 2 }, nota: 'Abre relaciones y cierra: velocidad y contacto por encima del detalle.' },
  { key: 'asesor', nombre: 'Consejero / Asesor', ref: { D: 3, I: 6, S: 6, C: 3 }, nota: 'Acompaña procesos largos con personas; paciencia y vínculo.' },
  { key: 'creativo', nombre: 'Creativo', ref: { D: 5, I: 5, S: 2, C: 6 }, nota: 'Propone y ejecuta con criterio propio; poca tolerancia a la rutina.' },
  { key: 'investigador', nombre: 'Investigador', ref: { D: 4, I: 2, S: 4, C: 7 }, nota: 'Profundiza hasta el fondo antes de concluir; trabaja bien solo.' },
  { key: 'administrativo', nombre: 'Administrativo', ref: { D: 2, I: 3, S: 6, C: 6 }, nota: 'Sostiene el proceso y el registro; constancia y precisión.' },
  { key: 'tecnico', nombre: 'Técnico', ref: { D: 3, I: 2, S: 5, C: 7 }, nota: 'Especialización y estándar; la autoridad viene del conocimiento.' },
];

// ─────────────────────────────────────────────────────────────
// MOTIVADORES E INTEGRIDAD · etiquetas y lectura
// ─────────────────────────────────────────────────────────────
export const MOTIVADORES: Record<string, { label: string; loSostiene: string; loHaceIrse: string }> = {
  'MOT-log': { label: 'Logro', loSostiene: 'Ver avance concreto y tareas que lo pongan a prueba', loHaceIrse: 'Un cargo sin reto y sin resultado visible' },
  'MOT-afi': { label: 'Afiliación', loSostiene: 'Un equipo con el que se lleve bien y donde se sienta parte', loHaceIrse: 'Un ambiente frío o un equipo en conflicto' },
  'MOT-inf': { label: 'Influencia', loSostiene: 'Que su opinión pese en las decisiones y tener gente a cargo', loHaceIrse: 'Ejecutar decisiones ajenas sin voz' },
  'MOT-aut': { label: 'Autonomía', loSostiene: 'Que le den el objetivo y lo dejen decidir el cómo', loHaceIrse: 'Aprobación línea por línea' },
  'MOT-seg': { label: 'Seguridad y estabilidad', loSostiene: 'Reglas del juego claras y una empresa sólida', loHaceIrse: 'Reorganizaciones seguidas e incertidumbre sostenida' },
  'MOT-rec': { label: 'Reconocimiento', loSostiene: 'Que se note y se nombre lo que aportó', loHaceIrse: 'Que otro se lleve el crédito de su trabajo' },
};

export const INTEGRIDAD_LABEL: Record<string, string> = {
  'INT-ver': 'Veracidad',
  'INT-act': 'Cuidado de activos',
  'INT-nor': 'Cumplimiento de normas',
  'INT-cnf': 'Conflicto de interés',
  'INT-sus': 'Criterio ante situaciones de riesgo',
  'INT-tol': 'Tolerancia en el servicio',
};

export const RAZONAMIENTO_LABEL: Record<string, string> = {
  'RAZ-num': 'Inducción numérica',
  'RAZ-abs': 'Razonamiento abstracto',
  'RAZ-ver': 'Razonamiento verbal',
  'RAZ-cua': 'Razonamiento cuantitativo',
  'RAZ-ded': 'Deducción lógica',
};

/** Franja de interpretacion. Nunca se reporta un puntaje sin su franja. */
export function franja(pct: number): 'bajo' | 'medio' | 'alto' {
  if (pct <= 35) return 'bajo';
  if (pct >= 65) return 'alto';
  return 'medio';
}
