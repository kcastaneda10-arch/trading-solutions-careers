// ─── Universal Business Assessment Scenarios ───────────────────────
// 23 scenarios converted to ROLE-PLAY MULTIPLE CHOICE format
// Generic business contexts: sales, marketing, operations, finance, customer service, project management

import type { HtScenario } from './types';

// Placeholder model_id — replaced at insert time
const MODEL = '__MODEL_ID__';

export const TS_SCENARIOS: Omit<HtScenario, 'id'>[] = [
  // ═══════════════════════════════════════════════════════════════
  // BLOQUE 1: RESOLUCIÓN (5 min) — Problem-solving & Comprehension
  // ═══════════════════════════════════════════════════════════════

  {
    model_id: MODEL,
    block: 'cognitivo',
    competency_key: 'razonamiento_numerico',
    competency_label: 'Resolución de Problemas — Datos',
    scenario_type: 'role_play_mc',
    scenario_text: `Tu cliente necesita un presupuesto urgente hoy antes de las 5pm. Revisas los números que te enviaron y encuentras un problema: dicen que necesitan 500 unidades pero el monto presupuestado sugiere 300 unidades.

Si calculas por cantidad baja: USD $15,000. Si calculas por cantidad alta: USD $25,000. Tu jefe está en reunión y no puede responder en 30 minutos.

¿Qué haces?`,
    options: [
      'Presento ambas opciones al cliente con análisis claro de la discrepancia. Le solicito que confirme la cantidad correcta.',
      'Reviso el historial del cliente para estimar cuál cantidad es más probable según sus pedidos anteriores.',
      'Preparo cotización con cantidad menor con nota indicando que se puede ajustar si requiere volumen mayor.',
      'Contacto al equipo de ventas de esta cuenta para entender mejor las necesidades reales del cliente.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide resolución analítica, velocidad de decisión, y comunicación con el cliente. Valora verificación de datos sobre suposición.',
      option_weights: [
        { maps: { IQ: 8, 'Perceptual Speed': 7 }, profile: 'transparent_analytical' },
        { maps: { IQ: 7, 'Perceptual Speed': 8 }, profile: 'historical_pragmatic' },
        { maps: { IQ: 6, 'Perceptual Speed': 7 }, profile: 'conservative_flexible' },
        { maps: { IQ: 7, 'Perceptual Speed': 6 }, profile: 'collaborative_informed' }
      ],
      indicators: [
        { name: 'Análisis de datos', description: 'Identifica la inconsistencia y busca claridad', maps_to: 'IQ', weight: 0.35, high_signal: 'Presenta ambas opciones con análisis', low_signal: 'Asume sin confirmar' },
        { name: 'Velocidad de procesamiento', description: 'Actúa dentro del tiempo límite del cliente', maps_to: 'Perceptual Speed', weight: 0.35, high_signal: 'Responde rápido con información útil', low_signal: 'Se paraliza esperando información' },
        { name: 'Atención a detalles', description: 'Reconoce la discrepancia en datos', maps_to: 'Attention and Memory', weight: 0.3, high_signal: 'Señala el problema específico', low_signal: 'No menciona la inconsistencia' }
      ]
    },
    target_columns: ['IQ', 'Perceptual Speed', 'Attention and Memory'],
    time_limit_seconds: 120,
    order_index: 1,
  },

  {
    model_id: MODEL,
    block: 'cognitivo',
    competency_key: 'razonamiento_numerico',
    competency_label: 'Resolución de Problemas — Errores',
    scenario_type: 'role_play_mc',
    scenario_text: `Hace dos días enviaste una cotización a un cliente importante. Hoy descubres un error: escribiste USD $5,000 pero el precio correcto es USD $7,500. El cliente ya respondió "OK, adelante" a la cotización baja.

Si acepta, la empresa pierde USD $2,500 en esa operación. ¿Cuál es tu respuesta?`,
    options: [
      'Llamo al cliente, explico el error y presento la cotización corregida con opciones de solución.',
      'Envío cotización actualizada con documentación clara del cambio de precio.',
      'Reviso si la empresa puede absorber parte del error como gesto comercial para mantener relación.',
      'Informo al jefe sobre el error y dejo que maneje la comunicación con el cliente.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide integridad, responsabilidad financiera, y comunicación honesta. Valora diferentes estilos de manejo.',
      option_weights: [
        { maps: { Conscientiousness: 8, 'Nonverbal Reasoning': 7 }, profile: 'proactive_communicator' },
        { maps: { Conscientiousness: 7, 'Nonverbal Reasoning': 8 }, profile: 'formal_documented' },
        { maps: { Conscientiousness: 6, 'Nonverbal Reasoning': 6 }, profile: 'collaborative_pragmatic' },
        { maps: { Conscientiousness: 5, 'Nonverbal Reasoning': 5 }, profile: 'escalative_deferred' }
      ],
      indicators: [
        { name: 'Responsabilidad', description: 'Maneja el error de forma clara', maps_to: 'Conscientiousness', weight: 0.4, high_signal: 'Comunica y propone soluciones', low_signal: 'Evade responsabilidad' },
        { name: 'Lógica del negocio', description: 'Considera impacto financiero y relación', maps_to: 'Nonverbal Reasoning', weight: 0.3, high_signal: 'Balancea pérdida con relación cliente', low_signal: 'Ignora implicaciones' },
        { name: 'Comunicación profesional', description: 'Maneja el error diplomaticamente', maps_to: 'Verbal Comprehension', weight: 0.3, high_signal: 'Claro, honesto y constructivo', low_signal: 'Defensivo o vago' }
      ]
    },
    target_columns: ['Conscientiousness', 'Nonverbal Reasoning', 'Verbal Comprehension'],
    time_limit_seconds: 120,
    order_index: 2,
  },

  {
    model_id: MODEL,
    block: 'cognitivo',
    competency_key: 'razonamiento_numerico',
    competency_label: 'Resolución de Problemas — Múltiples Variables',
    scenario_type: 'role_play_mc',
    scenario_text: `Un cliente importante necesita una solución urgente. Tienes 3 opciones:

OPCIÓN A (Premium): Costo USD $5,000, implementación rápida, máxima garantía
OPCIÓN B (Estándar): Costo USD $3,000, implementación normal, garantía regular
OPCIÓN C (Económica): Costo USD $1,500, implementación lenta, garantía limitada

El cliente no fue claro sobre su prioridad: tiempo vs presupuesto. Necesitas una recomendación + opciones en 1 hora.

¿Cuál es tu enfoque?`,
    options: [
      'Pregunto sobre su restricción principal (tiempo vs presupuesto) y recomiendo una opción con matriz comparativa.',
      'Presento las tres opciones con análisis claro de pro/contras sin recomendación específica.',
      'Recomiendo la opción estándar como mejor balance. Menciono alternativas si tienen necesidades específicas.',
      'Llamo para entender su verdadera urgencia versus presupuesto antes de recomendar.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide análisis multi-variable, comunicación estratégica, y orientación al cliente. Valora diferentes enfoques.',
      option_weights: [
        { maps: { IQ: 8, 'Nonverbal Reasoning': 8 }, profile: 'informed_recommendatory' },
        { maps: { IQ: 7, 'Nonverbal Reasoning': 6 }, profile: 'neutral_analytical' },
        { maps: { IQ: 6, 'Nonverbal Reasoning': 7 }, profile: 'pragmatic_middleground' },
        { maps: { IQ: 7, 'Nonverbal Reasoning': 7 }, profile: 'proactive_consultative' }
      ],
      indicators: [
        { name: 'Pensamiento analítico', description: 'Compara variables múltiples', maps_to: 'IQ', weight: 0.35, high_signal: 'Analiza costo + tiempo + riesgo', low_signal: 'Se enfoca en solo un aspecto' },
        { name: 'Razonamiento lógico', description: 'Estructura el problema correctamente', maps_to: 'Nonverbal Reasoning', weight: 0.35, high_signal: 'Metodología clara en análisis', low_signal: 'Análisis sin estructura' },
        { name: 'Orientación al cliente', description: 'Busca claridad de necesidades', maps_to: 'Verbal Comprehension', weight: 0.3, high_signal: 'Pregunta o presenta opciones claras', low_signal: 'Decide sin información del cliente' }
      ]
    },
    target_columns: ['IQ', 'Nonverbal Reasoning', 'Verbal Comprehension'],
    time_limit_seconds: 120,
    order_index: 3,
  },

  {
    model_id: MODEL,
    block: 'cognitivo',
    competency_key: 'english',
    competency_label: 'Comprensión en Inglés — Email Complejo',
    scenario_type: 'role_play_mc',
    scenario_text: `You receive this email from an international client:

"Hi,

We're interested in your cloud storage solution for our office in Mexico City. Before we proceed, we need clarification on four key points:

1) Payment Terms: Do you offer monthly subscriptions or annual contracts only? Do you provide volume discounts for 500+ users?

2) Storage Capacity: Our current data is 2.5TB and grows approximately 300GB monthly. Will your system scale? Are there bandwidth limitations?

3) System Integration: We currently use Salesforce, SAP, and our own legacy accounting software. Can your platform integrate with all three via API?

4) References: Can you provide case studies or contact information from other logistics companies in Latin America using your service?

We need to make a decision by Friday. Please respond by end of business Wednesday.

Best regards,
Carlos Mendoza
Operations Director
TelexLogistics S.A."

You have accurate information on payment terms and general scalability, but system integration details and Latin America references require confirming with your technical and sales teams. You receive this email Tuesday at 10 AM. It's now 2 PM and you have 4 hours before end of business.

What's your approach?`,
    options: [
      'Send comprehensive response now with payment and scalability answers. Note integration details and references confirmed by tomorrow EOB.',
      'Send preliminary response covering payment and storage. Indicate technical team confirming integration and references by tomorrow morning.',
      'Contact technical and sales teams immediately. Send complete response Wednesday morning with all four points answered thoroughly.',
      'Respond with your current knowledge on all four points. Note technical validation will be completed by Friday morning.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide comprensión del inglés, atención a múltiples puntos, y comunicación profesional. Valora diferentes estrategias de timing.',
      option_weights: [
        { maps: { 'Verbal Comprehension': 8, 'Attention and Memory': 8, C: 8 }, profile: 'structured_responsive' },
        { maps: { 'Verbal Comprehension': 7, 'Attention and Memory': 7, C: 7 }, profile: 'phased_progressive' },
        { maps: { 'Verbal Comprehension': 6, 'Attention and Memory': 6, C: 6 }, profile: 'comprehensive_delayed' },
        { maps: { 'Verbal Comprehension': 7, 'Attention and Memory': 6, C: 7 }, profile: 'proactive_tentative' }
      ],
      indicators: [
        { name: 'Comprensión del inglés', description: 'Entiende todos los puntos del email', maps_to: 'Verbal Comprehension', weight: 0.4, high_signal: 'Responde a cada punto en inglés', low_signal: 'Omite o evita puntos' },
        { name: 'Atención a detalles', description: 'Rastrea todos los requerimientos', maps_to: 'Attention and Memory', weight: 0.35, high_signal: 'Agrupa y estructura respuestas', low_signal: 'Se olvida de información solicitada' },
        { name: 'Gestión de tiempo', description: 'Balancea respuesta rápida con calidad', maps_to: 'Perceptual Speed', weight: 0.25, high_signal: 'Timing estratégico de respuesta', low_signal: 'Muy lento o apresurado' }
      ]
    },
    target_columns: ['Verbal Comprehension', 'Attention and Memory', 'Perceptual Speed', 'C'],
    time_limit_seconds: 120,
    order_index: 4,
  },

  {
    model_id: MODEL,
    block: 'cognitivo',
    competency_key: 'english',
    competency_label: 'Expresión en Inglés — Reunión con Cliente',
    scenario_type: 'role_play_mc',
    scenario_text: `You're scheduled for a 10-minute video call with Jennifer, VP of Operations at Innovatech Brazil—a major client considering contract renewal.

Context: They've been with you for 2 years. Service has been solid but Jennifer is demanding: she speaks quickly, mixes technical jargon with casual language, and asks pointed questions. She's also been fielding competing offers. The goal is to convince her to renew for another year and potentially expand the engagement.

The call starts in 2 minutes. Jennifer is known for:
- Not tolerating vague answers
- Switching between Portuguese-accented English and technical terms
- Asking difficult "what if" questions
- Respecting confidence but also humility
- Making snap judgments about people's competence

You have accurate data on service uptime (99.7%), cost savings (15% vs competitors), and team performance. You're less prepared on customizations they requested 6 months ago - you'll need to verify some details.

The call begins. Jennifer opens with: "Hi, thanks for making time. Look, I need to know: are you the best option for us going forward, or should I be exploring other vendors?"

How do you respond?`,
    options: [
      'I acknowledge your question and share metrics confidently. I then ask your top priorities to understand if we\'re truly the best fit for your needs.',
      'I lead with performance data: 99.7% uptime, saved $180K, 99% on-time support. I note that technical details I can\'t answer now will be verified by end of day.',
      'I listen first by asking what\'s changed at Innovatech, what pain points you face, and what ideal partnership looks like for you.',
      'I acknowledge you\'re evaluating options wisely. I\'ll be transparent about our strengths and limitations so you can decide if we fit your growth.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide expresión en inglés, adaptabilidad comunicativa, y presencia. Valora diferentes estilos válidos.',
      option_weights: [
        { maps: { Extraversion: 8, 'Verbal Comprehension': 7 }, profile: 'adaptive_authentic' },
        { maps: { Extraversion: 7, 'Verbal Comprehension': 8 }, profile: 'data_driven_professional' },
        { maps: { Extraversion: 7, 'Verbal Comprehension': 7 }, profile: 'listening_collaborative' },
        { maps: { Extraversion: 6, 'Verbal Comprehension': 8 }, profile: 'prepared_transparent' }
      ],
      indicators: [
        { name: 'Fluidez comunicativa', description: 'Se expresa con naturalidad en inglés', maps_to: 'Verbal Comprehension', weight: 0.4, high_signal: 'Claro, maneja puntos técnicos', low_signal: 'Dubitativo o evita hablar' },
        { name: 'Presencia e impacto', description: 'Transmite confianza sin arrogancia', maps_to: 'Extraversion', weight: 0.35, high_signal: 'Seguro, admite lo que no sabe', low_signal: 'Tímido o falsamente confiado' },
        { name: 'Adaptabilidad', description: 'Se ajusta al contexto y al cliente', maps_to: 'Agreeableness', weight: 0.25, high_signal: 'Escucha y responde necesidades', low_signal: 'Monólogo sin ajustarse' }
      ]
    },
    target_columns: ['Verbal Comprehension', 'Extraversion', 'Agreeableness'],
    time_limit_seconds: 120,
    order_index: 5,
  },

  // ═══════════════════════════════════════════════════════════════
  // BLOQUE 2: LIDERAZGO (8 scenarios) — Team & Leadership
  // ═══════════════════════════════════════════════════════════════

  // ─── OBJECTIVE COGNITIVE ITEMS (4 items) ─── IQ, Reasoning, Attention
  {
    model_id: MODEL,
    block: 'cognitivo',
    competency_key: 'razonamiento_numerico',
    competency_label: 'Secuencia Numérica — Razonamiento Lógico',
    scenario_type: 'role_play_mc',
    scenario_text: `¿Cuál número completa la secuencia?

2, 6, 18, 54, ___`,
    options: ['162', '108', '72', '216'],
    scoring_rubric: {
      instructions: 'Escenario objetivo: secuencia geométrica (×3). Respuesta correcta: 162 (54 × 3). Mide razonamiento numérico e IQ.',
      option_weights: [
        { maps: { IQ: 9, 'Nonverbal Reasoning': 8 }, profile: 'correct_answer' },
        { maps: { IQ: 4, 'Nonverbal Reasoning': 4 }, profile: 'incorrect_answer' },
        { maps: { IQ: 4, 'Nonverbal Reasoning': 4 }, profile: 'incorrect_answer' },
        { maps: { IQ: 4, 'Nonverbal Reasoning': 4 }, profile: 'incorrect_answer' }
      ],
      indicators: [
        { name: 'Razonamiento numérico', description: 'Identifica patrón geométrico', maps_to: 'IQ', weight: 0.5, high_signal: 'Respuesta correcta 162', low_signal: 'Otra respuesta' },
        { name: 'Pensamiento lógico', description: 'Aplicación sistemática', maps_to: 'Nonverbal Reasoning', weight: 0.5, high_signal: 'Secuencia consistente', low_signal: 'Sin lógica clara' }
      ]
    },
    target_columns: ['IQ', 'Nonverbal Reasoning'],
    time_limit_seconds: 60,
    order_index: 6,
  },

  {
    model_id: MODEL,
    block: 'cognitivo',
    competency_key: 'english',
    competency_label: 'Analogía Verbal — Comprensión Conceptual',
    scenario_type: 'role_play_mc',
    scenario_text: `Complete the analogy:

PILOT is to AIRPLANE as CAPTAIN is to ___`,
    options: ['Ship', 'Ocean', 'Navy', 'Harbor'],
    scoring_rubric: {
      instructions: 'Escenario objetivo: analogía conceptual. Respuesta correcta: Ship. Mide comprensión verbal e IQ.',
      option_weights: [
        { maps: { 'Verbal Comprehension': 9, IQ: 8 }, profile: 'correct_answer' },
        { maps: { 'Verbal Comprehension': 4, IQ: 4 }, profile: 'incorrect_answer' },
        { maps: { 'Verbal Comprehension': 4, IQ: 4 }, profile: 'incorrect_answer' },
        { maps: { 'Verbal Comprehension': 4, IQ: 4 }, profile: 'incorrect_answer' }
      ],
      indicators: [
        { name: 'Comprensión verbal', description: 'Relaciones conceptuales', maps_to: 'Verbal Comprehension', weight: 0.5, high_signal: 'Respuesta correcta Ship', low_signal: 'Otra respuesta' },
        { name: 'Razonamiento lógico', description: 'Aplicación de patrón', maps_to: 'IQ', weight: 0.5, high_signal: 'Analogía correcta', low_signal: 'Sin relación lógica' }
      ]
    },
    target_columns: ['Verbal Comprehension', 'IQ'],
    time_limit_seconds: 60,
    order_index: 7,
  },

  {
    model_id: MODEL,
    block: 'cognitivo',
    competency_key: 'razonamiento_logico',
    competency_label: 'Lógica Deductiva — Silogismos',
    scenario_type: 'role_play_mc',
    scenario_text: `Si todos los Zorps son Blinks, y algunos Blinks son Crufts, ¿cuál afirmación es NECESARIAMENTE verdadera?`,
    options: [
      'Algunos Zorps podrían ser Crufts',
      'Todos los Zorps son Crufts',
      'Ningún Zorp es Cruft',
      'Todos los Crufts son Zorps'
    ],
    scoring_rubric: {
      instructions: 'Escenario objetivo: razonamiento deductivo. Respuesta correcta: "Algunos Zorps podrían ser Crufts" (la única afirmación lógicamente válida). Mide razonamiento no-verbal e IQ.',
      option_weights: [
        { maps: { 'Nonverbal Reasoning': 9, IQ: 8 }, profile: 'correct_answer' },
        { maps: { 'Nonverbal Reasoning': 4, IQ: 4 }, profile: 'incorrect_answer' },
        { maps: { 'Nonverbal Reasoning': 4, IQ: 4 }, profile: 'incorrect_answer' },
        { maps: { 'Nonverbal Reasoning': 4, IQ: 4 }, profile: 'incorrect_answer' }
      ],
      indicators: [
        { name: 'Razonamiento deductivo', description: 'Lógica de proposiciones', maps_to: 'Nonverbal Reasoning', weight: 0.5, high_signal: 'Respuesta correcta', low_signal: 'Otra respuesta' },
        { name: 'Pensamiento sistemático', description: 'Aplicación de reglas lógicas', maps_to: 'IQ', weight: 0.5, high_signal: 'Deduce correctamente', low_signal: 'Saltos lógicos' }
      ]
    },
    target_columns: ['Nonverbal Reasoning', 'IQ'],
    time_limit_seconds: 60,
    order_index: 8,
  },

  {
    model_id: MODEL,
    block: 'cognitivo',
    competency_key: 'atencion_memoria',
    competency_label: 'Atención y Memoria — Comprensión de Detalles',
    scenario_type: 'role_play_mc',
    scenario_text: `Lee con atención el siguiente texto:

"El envío #4521 salió de Shanghai el martes, llegó a Panamá el jueves, y debe llegar a Barranquilla el lunes. El contenedor pesa 12,500 kg y tiene 340 cajas. El cliente pidió entrega antes del miércoles."

¿Cuántos días tiene el equipo entre la llegada a Barranquilla y la fecha límite del cliente?`,
    options: ['2 días', '3 días', '1 día', '4 días'],
    scoring_rubric: {
      instructions: 'Escenario objetivo: lectura atencional. Envío llega lunes, límite miércoles = 2 días. Respuesta correcta: "2 días". Mide atención y memoria.',
      option_weights: [
        { maps: { 'Attention and Memory': 9, 'Perceptual Speed': 8 }, profile: 'correct_answer' },
        { maps: { 'Attention and Memory': 4, 'Perceptual Speed': 4 }, profile: 'incorrect_answer' },
        { maps: { 'Attention and Memory': 4, 'Perceptual Speed': 4 }, profile: 'incorrect_answer' },
        { maps: { 'Attention and Memory': 4, 'Perceptual Speed': 4 }, profile: 'incorrect_answer' }
      ],
      indicators: [
        { name: 'Atención a detalles', description: 'Extrae información relevante', maps_to: 'Attention and Memory', weight: 0.5, high_signal: 'Respuesta correcta 2 días', low_signal: 'Otra respuesta' },
        { name: 'Procesamiento rápido', description: 'Calcula sin confusión', maps_to: 'Perceptual Speed', weight: 0.5, high_signal: 'Cálculo claro y rápido', low_signal: 'Confusión en fechas' }
      ]
    },
    target_columns: ['Attention and Memory', 'Perceptual Speed'],
    time_limit_seconds: 60,
    order_index: 9,
  },

  {
    model_id: MODEL,
    block: 'comportamental',
    competency_key: 'liderazgo_presion',
    competency_label: 'Liderazgo bajo Presión',
    scenario_type: 'role_play_mc',
    scenario_text: `Tu jefe te llama viernes a las 3pm: necesitan un proyecto complejo listo para lunes 8am. Tu equipo de 4 personas tiene planes para el fin de semana. Cuando lo anuncias:
- Alguien dice: "Eso no se puede hacer"
- Otro se ve preocupado pero no dice nada
- Dos preguntan "¿Qué ganamos?"

Tu jefe espera que hagas algo. Es tu proyecto.

¿Qué haces en los próximos 15 minutos?`,
    options: [
      'Reúno al equipo, divido trabajo en 4 partes, pregunto quién se compromete, ofrezco compensación/flex time, y trabajo con ellos.',
      'Asumo parte importante del trabajo. Asigno tareas claras al equipo. Reconozco la demanda pero enfatizo que es necesario.',
      'Hablo con cada persona individualmente pidiendo su ayuda específica. Evito reunión grupal que podría desmoralizar.',
      'Propongo al jefe escalonamiento: parte hoy, parte lunes temprano. Presento opciones en lugar de rechazar la solicitud.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide D (toma control), I (influencia), Conscientiousness (compromiso), y estilos de liderazgo diversos.',
      option_weights: [
        { maps: { D: 8, I: 7, Conscientiousness: 8 }, profile: 'collaborative_determined' },
        { maps: { D: 8, I: 6, Conscientiousness: 8 }, profile: 'directive_committed' },
        { maps: { D: 7, I: 8, Conscientiousness: 7 }, profile: 'personal_connector' },
        { maps: { D: 7, I: 6, Conscientiousness: 6 }, profile: 'pragmatic_negotiator' }
      ],
      indicators: [
        { name: 'Toma de control', description: 'Actúa rápido sin vacilar', maps_to: 'D', weight: 0.3, high_signal: 'Plan inmediato y concreto', low_signal: 'Paraliza o delega la decisión' },
        { name: 'Liderazgo colaborativo', description: 'Cómo motiva e influye', maps_to: 'I', weight: 0.3, high_signal: 'Busca compromiso vs imposición', low_signal: 'Solo ordena' },
        { name: 'Compromiso personal', description: 'Se compromete personalmente', maps_to: 'Conscientiousness', weight: 0.25, high_signal: 'Trabaja también, reconoce esfuerzo', low_signal: 'Solo asigna trabajo' },
        { name: 'Manejo de contexto', description: 'Adapta approach a situación', maps_to: 'Extraversion', weight: 0.15, high_signal: 'Considera factibilidad realista', low_signal: 'Impone sin considerar realidad' }
      ]
    },
    target_columns: ['D', 'I', 'Conscientiousness', 'Extraversion'],
    time_limit_seconds: 120,
    order_index: 10,
  },

  {
    model_id: MODEL,
    block: 'comportamental',
    competency_key: 'trabajo_equipo',
    competency_label: 'Trabajo en Equipo — Estilos Diferentes',
    scenario_type: 'role_play_mc',
    scenario_text: `Trabajas con un compañero en un proyecto de 3 semanas. Tú prefieres planificar detalladamente antes de empezar. Tu compañero prefiere empezar a trabajar y resolver detalles sobre la marcha.

Resultado: Tareas duplicadas, desorganización, están retrasados. Tu jefe da ultimátum: "1 semana para terminar o ambos reciben calificación baja."

Tu compañero no es mala persona — simplemente trabaja diferente. ¿Cómo manejas esto?`,
    options: [
      'Propongo enfoque híbrido: 1 hora de planificación rápida, luego ejecución flexible con checkpoints diarios de 15 minutos.',
      'Presento plan, solicito su input, ejecutamos con roles claros pero flexibles. Balancea mi estructura con su flexibilidad.',
      'Divido proyecto en componentes independientes. Cada uno ejecuta su parte con autonomía pero con seguimiento mutuo 2 veces al día.',
      'Pregunto qué aspecto de ejecución lo energiza. Diseño flujo donde tiene autonomía en esa área dentro del cronograma.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide I (influencia), S (flexibilidad), Agreeableness (colaboración), y manejo de diferencias.',
      option_weights: [
        { maps: { I: 8, S: 7, Agreeableness: 8, Afiliación_media: 8 }, profile: 'flexible_structured' },
        { maps: { I: 7, S: 6, Agreeableness: 7, Afiliación_media: 7 }, profile: 'inclusive_directive' },
        { maps: { I: 6, S: 7, Agreeableness: 7, Afiliación_media: 7 }, profile: 'autonomous_accountable' },
        { maps: { I: 8, S: 8, Agreeableness: 8, Afiliación_media: 8 }, profile: 'empathetic_adaptive' }
      ],
      indicators: [
        { name: 'Empatía relacional', description: 'Valora perspectiva diferente', maps_to: 'Bd Score', weight: 0.3, high_signal: 'Busca integrar estilos', low_signal: 'Impone su forma' },
        { name: 'Influencia positiva', description: 'Propone colaboración constructiva', maps_to: 'I', weight: 0.3, high_signal: 'Negocia y propone soluciones', low_signal: 'Impone o se retira' },
        { name: 'Paciencia', description: 'Tolera diferencias', maps_to: 'S', weight: 0.25, high_signal: 'Flexible sin perder dirección', low_signal: 'Frustrado o resentido' },
        { name: 'Resolución', description: 'Busca ganar-ganar', maps_to: 'Agreeableness', weight: 0.15, high_signal: 'Mantiene relación y proyecto', low_signal: 'Escala conflicto' }
      ]
    },
    target_columns: ['I', 'S', 'Bd Score', 'Agreeableness', 'Afiliación_media'],
    time_limit_seconds: 120,
    order_index: 11,
  },

  {
    model_id: MODEL,
    block: 'comportamental',
    competency_key: 'adaptacion_cambio',
    competency_label: 'Adaptación al Cambio',
    scenario_type: 'role_play_mc',
    scenario_text: `Llevas 6 meses usando un sistema que ya dominas perfectamente. De repente, la empresa anuncia un cambio: en 1 semana implementan un sistema completamente nuevo. Sin capacitación formal — solo manual de 40 páginas y dos videos.

El problema: Tus clientes siguen necesitando cotizaciones diarias. No puedes pausar trabajo durante la transición. Esto es estresante.

¿Cómo lo encaras?`,
    options: [
      'Estudio manual y videos en tiempo personal. Creo referencia rápida y empiezo lentamente pidiendo ayuda cuando sea necesario.',
      'Busco colegas que usan el nuevo sistema y pido que me muestren en práctica. Aprendo haciendo con guía de personas.',
      'El lunes trabajo lentamente pero cumplo. Hago errores iniciales pero mejoro cada día. Ritmo normal para el viernes.',
      'Pregunto al gerente sobre opciones de aprendizaje y propongo plan: capacitación del equipo plus período de transición lenta.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide Openness (aceptación), Conscientiousness (iniciativa), Neuroticism (manejo de estrés). Valora diferentes approaches válidos.',
      option_weights: [
        { maps: { Openness: 8, Conscientiousness: 8, Neuroticism: 7 }, profile: 'self_directed_stable' },
        { maps: { Openness: 7, Conscientiousness: 7, Neuroticism: 7 }, profile: 'social_learner' },
        { maps: { Openness: 7, Conscientiousness: 7, Neuroticism: 6 }, profile: 'pragmatic_adaptive' },
        { maps: { Openness: 6, Conscientiousness: 7, Neuroticism: 7 }, profile: 'collaborative_negotiator' }
      ],
      indicators: [
        { name: 'Apertura al cambio', description: 'Actitud ante lo nuevo', maps_to: 'Openness', weight: 0.35, high_signal: 'Ve como desafío, no amenaza', low_signal: 'Resiste o se queja' },
        { name: 'Iniciativa en aprendizaje', description: 'Cómo toma control de su aprendizaje', maps_to: 'Conscientiousness', weight: 0.35, high_signal: 'Proactivo, busca recursos', low_signal: 'Pasivo, espera solo' },
        { name: 'Estabilidad emocional', description: 'Manejo del estrés del cambio', maps_to: 'Neuroticism', weight: 0.3, high_signal: 'Nervioso pero constructivo', low_signal: 'Ansiedad paralizante' }
      ]
    },
    target_columns: ['Openness', 'Conscientiousness', 'Neuroticism'],
    time_limit_seconds: 120,
    order_index: 12,
  },

  {
    model_id: MODEL,
    block: 'comportamental',
    competency_key: 'manejo_errores',
    competency_label: 'Manejo Responsable de Errores',
    scenario_type: 'role_play_mc',
    scenario_text: `Descubres un error importante en un documento que procesaste hace 5 días: escribiste el peso incorrecto (500kg en vez de 5,000kg). El cliente está por recibir el envío y la aduana podría detectar la discrepancia, causando multas y retrasos.

Nadie lo ha notado todavía. Tienes 2 opciones: reportarlo ahora o esperar a ver si aduana lo detecta (es probable pero no seguro).

¿Qué haces?`,
    options: [
      'Informo a mi supervisor inmediatamente con el error, impacto potencial y 2-3 opciones de solución. Asumo responsabilidad.',
      'Analizo el riesgo real y el costo-beneficio de reportar ahora versus después. Tomo decisión basada en análisis.',
      'Contacto al cliente directamente para notificar y ofrecer soluciones. Acelera el arreglo. Luego notifico internamente.',
      'Hablo con supervisor y cliente simultáneamente para coordinar la solución más eficiente. Todos tienen claridad al mismo tiempo.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide D (acción), Conscientiousness (responsabilidad), Fi (análisis de riesgo). Valora diferentes enfoques de gestión.',
      option_weights: [
        { maps: { Conscientiousness: 8, D: 8, 'Fi Score': 7, C: 8 }, profile: 'responsible_directive' },
        { maps: { Conscientiousness: 7, D: 7, 'Fi Score': 8, C: 8 }, profile: 'analytical_calculated' },
        { maps: { Conscientiousness: 7, D: 7, 'Fi Score': 6, C: 7 }, profile: 'client_centric_direct' },
        { maps: { Conscientiousness: 7, D: 6, 'Fi Score': 7, C: 8 }, profile: 'coordinated_collaborative' }
      ],
      indicators: [
        { name: 'Responsabilidad', description: 'Maneja el error de forma abierta', maps_to: 'Conscientiousness', weight: 0.35, high_signal: 'Reporta y propone soluciones', low_signal: 'Oculta o espera' },
        { name: 'Velocidad de decisión', description: 'Actúa sin parálisis', maps_to: 'D', weight: 0.3, high_signal: 'Acción relativamente rápida', low_signal: 'Espera indefinidamente' },
        { name: 'Análisis de riesgos', description: 'Evalúa impacto e implicaciones', maps_to: 'Fi Score', weight: 0.25, high_signal: 'Considera múltiples factores', low_signal: 'Acción reactiva sin análisis' },
        { name: 'Integridad', description: 'Transparencia en el proceso', maps_to: 'Agreeableness', weight: 0.1, high_signal: 'Abierto y honesto', low_signal: 'Intenta esconder' }
      ]
    },
    target_columns: ['Conscientiousness', 'D', 'Fi Score', 'Agreeableness', 'C'],
    time_limit_seconds: 120,
    order_index: 13,
  },

  {
    model_id: MODEL,
    block: 'comportamental',
    competency_key: 'manejo_conflicto',
    competency_label: 'Manejo de Conflictos Interpersonales',
    scenario_type: 'role_play_mc',
    scenario_text: `En reunión semanal con tu gerente y compañeros, un colega de otro departamento acusa públicamente a tu equipo de "entregar siempre tarde y con errores" y dice "por eso perdimos al cliente importante."

Tú sabes que: el retraso fue 1 día, el cliente se fue por precio, no por servicio, y este colega siempre culpa a otros.

Todos te miran esperando tu respuesta. Tu gerente está en silencio.

¿Qué dices exactamente?`,
    options: [
      'Respondo calmadamente explicando que el cliente se fue por precio, no servicio, pero reconozco el retraso de 1 día para mejorar.',
      'Defiendo directamente con hechos: retraso de 1 día y feedback de cliente fue precio. Propongo colaboración para mejorar.',
      'Reconozco el tema y propongo hablar después de la reunión para entender ambas perspectivas mejor en privado.',
      'Pregunto qué métricas específicas muestran retrasos para validar datos juntos y encontrar soluciones.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide I (asertividad), Neuroticism (control emocional), D (firmeza), y resolución. Valora diferentes estilos comunicativos.',
      option_weights: [
        { maps: { I: 8, Neuroticism: 8, D: 7, 'Bi Score': 8 }, profile: 'balanced_assertive' },
        { maps: { I: 8, Neuroticism: 7, D: 8, 'Bi Score': 8 }, profile: 'direct_factual' },
        { maps: { I: 6, Neuroticism: 8, Agreeableness: 8, 'Bi Score': 8 }, profile: 'diplomatic_deferral' },
        { maps: { I: 7, Neuroticism: 7, D: 7, 'Bi Score': 7 }, profile: 'curious_collaborative' }
      ],
      indicators: [
        { name: 'Comunicación asertiva', description: 'Responde con datos y presencia', maps_to: 'I', weight: 0.3, high_signal: 'Claro, usa hechos', low_signal: 'Vago o evasivo' },
        { name: 'Control emocional', description: 'No se descompone bajo presión', maps_to: 'Neuroticism', weight: 0.3, high_signal: 'Tranquilo y medido', low_signal: 'Defensivo o molesto' },
        { name: 'Firmeza', description: 'Defiende su posición sin agresión', maps_to: 'D', weight: 0.2, high_signal: 'Seguro, no se deja manipular', low_signal: 'Se rinde fácil' },
        { name: 'Resolución', description: 'Mantiene profesionalismo', maps_to: 'Agreeableness', weight: 0.2, high_signal: 'Busca solución constructiva', low_signal: 'Escala o evita' }
      ]
    },
    target_columns: ['I', 'Neuroticism', 'D', 'Agreeableness', 'Bi Score'],
    time_limit_seconds: 120,
    order_index: 14,
  },

  {
    model_id: MODEL,
    block: 'comportamental',
    competency_key: 'innovacion',
    competency_label: 'Pensamiento Innovador',
    scenario_type: 'role_play_mc',
    scenario_text: `Tu gerente te pide: "Propón una idea para reducir tiempo de respuesta a cotizaciones de 24-48 horas a menos de 4 horas, sin comprometer calidad."

Contexto actual:
- Proceso manual: email → búsqueda en Excel → redacción en Word → envío
- Sin presupuesto para software nuevo
- Equipo pequeño (3 personas)

Tienes 2 horas para presentar propuesta. ¿Qué propones?`,
    options: [
      'Automatizar flujo con Excel plantillas, Google Forms y cotizaciones pre-templadas. Costo cero, implementación 2 semanas, reduce tiempo a 2-3 horas.',
      'Crear sistema de priorización para cotizaciones urgentes versus normales. Contratar 1 persona para pricing. Implementación rápida, costo moderado.',
      'Analizar flujo actual para identificar cuellos reales. Proponer 3 opciones con costos/beneficios: automatización, contratación o rediseño de proceso.',
      'Implementar plantillas y workflow en sistema actual. Simple, menos customización pero respuesta rápida sin automatización costosa.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide Openness (creatividad), Fd (pensamiento innovador), Fi (viabilidad práctica). Valora diferentes enfoques válidos.',
      option_weights: [
        { maps: { Openness: 8, 'Fd Score': 8, 'Fi Score': 8 }, profile: 'innovative_practical' },
        { maps: { Openness: 6, 'Fd Score': 6, 'Fi Score': 7 }, profile: 'resource_oriented' },
        { maps: { Openness: 8, 'Fd Score': 7, 'Fi Score': 9 }, profile: 'analytical_thorough' },
        { maps: { Openness: 6, 'Fd Score': 6, 'Fi Score': 7 }, profile: 'pragmatic_simple' }
      ],
      indicators: [
        { name: 'Creatividad de solución', description: 'Propone enfoques constructivos', maps_to: 'Fd Score', weight: 0.35, high_signal: 'Combina herramientas de forma inteligente', low_signal: 'Solo agrega recursos' },
        { name: 'Apertura a nuevos enfoques', description: 'Piensa en mejoras de proceso', maps_to: 'Openness', weight: 0.35, high_signal: 'Menciona cambios metodológicos', low_signal: 'Solo soluciones convencionales' },
        { name: 'Viabilidad', description: 'Realista con recursos actuales', maps_to: 'Fi Score', weight: 0.3, high_signal: 'Costo, timeline, impacto claro', low_signal: 'Vago o requiere presupuesto ilimitado' }
      ]
    },
    target_columns: ['Openness', 'Fd Score', 'Fi Score'],
    time_limit_seconds: 120,
    order_index: 15,
  },

  {
    model_id: MODEL,
    block: 'comportamental',
    competency_key: 'decision_carrera',
    competency_label: 'Decisiones de Carrera — Estabilidad vs Reto',
    scenario_type: 'role_play_mc',
    scenario_text: `Llevas 2 años en tu rol actual. Tu desempeño es sólido, entiendes perfectamente tus funciones, tienes estabilidad y buen salario.

Tu gerente te ofrece dos opciones:

OPCIÓN A: Quedarte con aumento del 12%, estabilidad y crecimiento predecible.

OPCIÓN B: Nuevo rol en área diferente, más responsabilidad, sin aumento inmediato. Es un rol completamente nuevo — tendrás que definir procesos y demostrar valor desde cero.

¿Cuál eliges y por qué?`,
    options: [
      'Elijo B. El reto de crecer en área nueva me atrae más. Con 2 años de track record, el riesgo es calculado y vale la pena.',
      'Elijo A. Valoro estabilidad y claridad financiera. El 12% aumento es sólido y dominar mi rol me hace muy efectivo.',
      'Analizo ambas: alineamiento con visión de carrera a 5 años, qué necesito aprender, implicaciones financieras. Luego decido.',
      'Elijo B pero negocio aumento retroactivo después de 6 meses demostrando valor. Balancea mi riesgo con oportunidad.'
    ],
    scoring_rubric: {
      instructions: 'No hay respuesta "correcta". Mide valores diferentes: estabilidad, crecimiento, pragmatismo, adaptabilidad.',
      option_weights: [
        { maps: { Openness: 8, Logros_media: 8, Poder_media: 7 }, profile: 'growth_seeking_ambitious' },
        { maps: { S: 8, Conscientiousness: 8, Openness: 4 }, profile: 'stability_oriented' },
        { maps: { Conscientiousness: 9, Logros_media: 7, Openness: 7 }, profile: 'analytical_thoughtful' },
        { maps: { D: 8, Openness: 8, Logros_media: 7 }, profile: 'pragmatic_negotiator' }
      ],
      indicators: [
        { name: 'Orientación valores', description: 'Qué prioriza: estabilidad vs crecimiento', maps_to: 'S', weight: 0.25, high_signal: 'Claro sobre sus prioridades', low_signal: 'Indeciso o contradictorio' },
        { name: 'Apertura a lo nuevo', description: 'Disposición a salir de zona cómoda', maps_to: 'Openness', weight: 0.25, high_signal: 'Busca desafío y aprendizaje', low_signal: 'Prefiere estancamiento seguro' },
        { name: 'Análisis profundo', description: 'Cómo razona la decisión', maps_to: 'Conscientiousness', weight: 0.25, high_signal: 'Considera múltiples factores', low_signal: 'Decisión impulsiva' },
        { name: 'Motivación de logro', description: 'Qué lo mueve: seguridad vs ambición', maps_to: 'Logros_media', weight: 0.25, high_signal: 'Busca crecimiento real', low_signal: 'Solo seguridad' }
      ]
    },
    target_columns: ['S', 'Openness', 'Conscientiousness', 'Logros_media'],
    time_limit_seconds: 120,
    order_index: 16,
  },

  {
    model_id: MODEL,
    block: 'comportamental',
    competency_key: 'reaccion_competencia',
    competency_label: 'Reacción ante Competencia Interna',
    scenario_type: 'role_play_mc',
    scenario_text: `En ranking de desempeño semanal, estás en 4to lugar de 6 personas. Un compañero que entró hace apenas 3 meses está en 1er lugar. El gerente lo elogia públicamente varias veces.

Compañeros murmuran: "Tiene contactos internos" o "Le dan clientes fáciles."

Internamente, te sientes frustrado. Trabajaste duro pero este nuevo tipo "ganó" sin esfuerzo visible.

¿Qué pasa por tu mente y qué haces en los próximos 3 días?`,
    options: [
      'Reconozco mi frustración pero la canalizo en aprendizaje. Pregunto al #1 qué hace diferente y adopto 1-2 estrategias suyas.',
      'Busco data: ¿realmente está ganando o es percepción? Valido si sus clientes son fáciles o su técnica es mejor.',
      'Hablo con compañeros para entender el ranking. ¿Es justo? ¿Cómo se calcula? Decido si hay problema o si mejoro mi técnica.',
      'Aumento esfuerzo con más horas y optimización de proceso. Me pregunto si hay factores del sistema que no controlo.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide D (competitividad), Neuroticism (manejo de frustración), Logros (motivación). Valora diferentes respuestas válidas.',
      option_weights: [
        { maps: { D: 8, Logros_media: 8, Neuroticism: 7 }, profile: 'learning_competitive' },
        { maps: { D: 7, Logros_media: 7, Neuroticism: 7 }, profile: 'analytical_investigator' },
        { maps: { D: 7, Logros_media: 7, Neuroticism: 7 }, profile: 'systemic_inquirer' },
        { maps: { D: 8, Logros_media: 8, Neuroticism: 6 }, profile: 'driven_persistent' }
      ],
      indicators: [
        { name: 'Competitividad constructiva', description: 'Cómo maneja la motivación', maps_to: 'D', weight: 0.3, high_signal: 'Canaliza frustración en acción', low_signal: 'Se victimiza' },
        { name: 'Manejo emocional', description: 'Procesa frustración', maps_to: 'Neuroticism', weight: 0.25, high_signal: 'Reconoce sentimiento, actúa racionalmente', low_signal: 'Resentimiento sin acción' },
        { name: 'Drive de logro', description: 'Cómo se motiva para mejorar', maps_to: 'Logros_media', weight: 0.25, high_signal: 'Busca mejorar su desempeño', low_signal: 'Se rinde o se queja' },
        { name: 'Procesamiento social', description: 'Cómo busca información', maps_to: 'Extraversion', weight: 0.2, high_signal: 'Activo en aprender de otros', low_signal: 'Aislado o pasivo' }
      ]
    },
    target_columns: ['D', 'Neuroticism', 'Logros_media', 'Extraversion'],
    time_limit_seconds: 120,
    order_index: 17,
  },

  // ═══════════════════════════════════════════════════════════════
  // BLOQUE 3: VALORES (5 scenarios) — Business Ethics & Priorities
  // ═══════════════════════════════════════════════════════════════

  {
    model_id: MODEL,
    block: 'caracter',
    competency_key: 'integridad_negocio',
    competency_label: 'Integridad en Decisiones de Negocio',
    scenario_type: 'role_play_mc',
    scenario_text: `Un proveedor importante te invita a un almuerzo. Casualmente menciona: "Si nos das preferencia en tus pedidos este trimestre, ofrecemos un descuento especial para ti personalmente. USD $2,000 en tarjeta de regalo."

Claramente es un soborno personal a cambio de favoritismo. La empresa se beneficia del descuento normal pero la parte personal para ti está fuera de línea. Rechazar podría afectar la relación comercial.

¿Qué haces?`,
    options: [
      'Declino directamente: beneficios personales cruzan una línea. Propongo propuesta comercial justa para ambos.',
      'Agradezco pero declino: mi empresa no acepta este tipo de incentivos. Evaluamos servicios por precio y calidad.',
      'Consulto internamente sobre política específica. Una vez claro, comunico profesionalmente al proveedor.',
      'Acepto almuerzo pero pido beneficio oficial para la empresa. Algo personal es común en el sector comercial.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide Conscientiousness (ética), D (firmeza), Agreeableness (diplomacia). Opción 4 es socialmente deseable pero con límites éticos bajos.',
      option_weights: [
        { maps: { Conscientiousness: 8, D: 8, Agreeableness: 7 }, profile: 'direct_principled' },
        { maps: { Conscientiousness: 8, D: 7, Agreeableness: 8 }, profile: 'tactful_firm' },
        { maps: { Conscientiousness: 8, D: 6, Agreeableness: 8 }, profile: 'consultative_ethical' },
        { maps: { Conscientiousness: 4, D: 5, Agreeableness: 7 }, profile: 'pragmatic_rationalizer' }
      ],
      indicators: [
        { name: 'Integridad ética', description: 'Rechaza ventaja personal impropia', maps_to: 'Conscientiousness', weight: 0.4, high_signal: 'Claro límite ético', low_signal: 'Vacila o acepta' },
        { name: 'Firmeza', description: 'Mantiene límite profesionalmente', maps_to: 'D', weight: 0.3, high_signal: 'Seguro en su posición', low_signal: 'Débil o ambiguo' },
        { name: 'Relación comercial', description: 'Mantiene profesionalismo', maps_to: 'Agreeableness', weight: 0.3, high_signal: 'Cortés, ofrece alternativa', low_signal: 'Confrontacional' }
      ]
    },
    target_columns: ['Conscientiousness', 'D', 'Agreeableness'],
    time_limit_seconds: 120,
    order_index: 18,
  },

  {
    model_id: MODEL,
    block: 'caracter',
    competency_key: 'responsabilidad_equipo',
    competency_label: 'Responsabilidad y Accountability',
    scenario_type: 'role_play_mc',
    scenario_text: `Un compañero de otro departamento comete un error que impacta a tu cliente. El error es pequeño pero visible. Tu compañero te pide en privado: "¿Puedes decirle al cliente que el error fue de tu equipo? Así mi gerente no se entera y no quedo mal."

Si lo haces: El cliente sigue confiando, el compañero evita consecuencias, pero tomas responsabilidad falsa.

Si lo rechazas: Él tal vez se molesta, su error se expone, pero la verdad está clara.

¿Qué dices?`,
    options: [
      'Digo no: no puedo mentir al cliente. Vamos juntos, explicamos el error y mostramos cómo lo prevenimos. Mantenemos confianza.',
      'Sugiero hable con su gerente primero para evitar sorpresa. Luego informamos juntos al cliente con plan de prevención.',
      'No asumo error que no fue mío, pero le ayudaré a comunicarlo de forma que muestre su responsabilidad y solución.',
      'Esta vez lo cubro, pero no puede repetirse. Mantener paz y relaciones importa pero sin comprometer transparencia.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide Conscientiousness (honestidad), Agreeableness (compasión pero firmeza), integridad. Opción 4 prioriza relación sobre transparencia.',
      option_weights: [
        { maps: { Conscientiousness: 8, Agreeableness: 8 }, profile: 'firm_direct_honest' },
        { maps: { Conscientiousness: 8, Agreeableness: 8 }, profile: 'constructive_preventive' },
        { maps: { Conscientiousness: 8, Agreeableness: 8 }, profile: 'supportive_firm' },
        { maps: { Conscientiousness: 4, Agreeableness: 6 }, profile: 'relationship_prioritizer' }
      ],
      indicators: [
        { name: 'Honestidad', description: 'Rechaza mentira', maps_to: 'Conscientiousness', weight: 0.5, high_signal: 'No asume responsabilidad falsa', low_signal: 'Accede a mentir' },
        { name: 'Apoyo constructivo', description: 'Ayuda pero con integridad', maps_to: 'Agreeableness', weight: 0.3, high_signal: 'Ofrece alternativas honestas', low_signal: 'Rechaza sin ofender opciones' },
        { name: 'Credibilidad cliente', description: 'Prioriza confianza a largo plazo', maps_to: 'I', weight: 0.2, high_signal: 'Ve beneficio de transparencia', low_signal: 'Solo ve riesgo inmediato' }
      ]
    },
    target_columns: ['Conscientiousness', 'Agreeableness', 'I'],
    time_limit_seconds: 120,
    order_index: 19,
  },

  {
    model_id: MODEL,
    block: 'caracter',
    competency_key: 'confidencialidad',
    competency_label: 'Confidencialidad y Lealtad',
    scenario_type: 'role_play_mc',
    scenario_text: `Estás en entrevista avanzada en otra compañía. El gerente dice: "Antes de ofrecerte el puesto, necesitamos que entiendas que usaremos tus contactos de tu empresa actual para capturar algunos de sus clientes. ¿Eso sería un problema?"

Claramente te piden que uses información confidencial y relaciones profesionales para beneficiar a su empresa a costa de tu empleador actual.

¿Cómo respondes?`,
    options: [
      'Digo con claridad: no puedo compartir información confidencial o contactos privados. Si es expectativa, no puedo aceptar.',
      'Pregunto qué significa exactamente. ¿Falsificar relaciones? ¿Robar datos? Necesito entender antes de decidir.',
      'Aclaro: mis habilidades y reputación se venderán solos. Nuevos clientes llegarán por mi trabajo, no información robada.',
      'Exploro información que pueda compartir sin ser explícitamente confidencial. Experiencia profesional incluye conocimiento de mercado.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide Conscientiousness (confidencialidad), D (firmeza), Agreeableness (diplomacia). Opción 4 racionaliza violación de límites.',
      option_weights: [
        { maps: { Conscientiousness: 8, D: 8, Agreeableness: 7 }, profile: 'firm_principled' },
        { maps: { Conscientiousness: 8, D: 7, Agreeableness: 7 }, profile: 'clarifying_careful' },
        { maps: { Conscientiousness: 8, D: 8, Agreeableness: 7 }, profile: 'confident_clear' },
        { maps: { Conscientiousness: 4, D: 6, Agreeableness: 7 }, profile: 'boundary_rationalizer' }
      ],
      indicators: [
        { name: 'Lealtad profesional', description: 'Protege confidencialidad', maps_to: 'Conscientiousness', weight: 0.5, high_signal: 'Rechaza clara manera', low_signal: 'Busca loopholes' },
        { name: 'Integridad en transición', description: 'No traiciona', maps_to: 'Agreeableness', weight: 0.3, high_signal: 'Principios sobre oportunidad', low_signal: 'Oportunista' },
        { name: 'Firmeza', description: 'Mantiene límite sin vacilar', maps_to: 'D', weight: 0.2, high_signal: 'Seguro en su posición', low_signal: 'Titubea o negocia ética' }
      ]
    },
    target_columns: ['Conscientiousness', 'Agreeableness', 'D'],
    time_limit_seconds: 120,
    order_index: 20,
  },

  {
    model_id: MODEL,
    block: 'caracter',
    competency_key: 'cumplimiento_legal',
    competency_label: 'Cumplimiento Regulatorio',
    scenario_type: 'role_play_mc',
    scenario_text: `Un cliente presiona para que falsifiques algunos datos en un formulario para acelerar un proceso. Dice: "Solo necesito que cambies una pequeña cosa, nada importante. Todos lo hacen. Te prometo 5 proyectos más este trimestre."

Es presión comercial directa: dinero + amenaza. Pero falsificar documentos es ilegal y podrías enfrentar consecuencias legales personales además de dañar a la empresa.

¿Qué haces?`,
    options: [
      'Digo claramente: no puedo falsificar. Es ilegal. Pero ofrezco alternativas legales para acelerar. Mantenemos relación sin cruzar línea.',
      'Consulto a Legal o gerente inmediatamente sobre qué está pidiendo y cómo manejar. Luego respondo al cliente con solución legal.',
      'Explico que no puedo hacerlo personalmente pero lo conecto con Legal para explorar opciones legales de acelerar.',
      'Reviso si es ilegal o simplemente burocrático. A veces procesos tienen flexibilidad. Busco formas creativas de acelerar.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide Conscientiousness (legalidad), D (resistencia a presión), Fi (solución constructiva). Opción 4 racionaliza violación legal.',
      option_weights: [
        { maps: { Conscientiousness: 9, D: 9, 'Fi Score': 8, C: 9 }, profile: 'firm_compliant_helpful' },
        { maps: { Conscientiousness: 9, D: 8, 'Fi Score': 7, C: 9 }, profile: 'consultative_compliant' },
        { maps: { Conscientiousness: 9, D: 8, 'Fi Score': 8, C: 9 }, profile: 'professional_intermediary' },
        { maps: { Conscientiousness: 3, D: 5, 'Fi Score': 4, C: 3 }, profile: 'dangerous_rationalizer' }
      ],
      indicators: [
        { name: 'Cumplimiento legal', description: 'Rechaza fraude', maps_to: 'Conscientiousness', weight: 0.5, high_signal: 'No hay negociación posible', low_signal: 'Duda o busca excepciones' },
        { name: 'Resistencia a presión', description: 'Mantiene límite ante dinero/clientes', maps_to: 'D', weight: 0.35, high_signal: 'Firme sin arrogancia', low_signal: 'Se deja presionar' },
        { name: 'Solución constructiva', description: 'Ofrece alternativas legales', maps_to: 'Fi Score', weight: 0.15, high_signal: 'Busca resolver problema legalmente', low_signal: 'Solo rechaza' }
      ]
    },
    target_columns: ['Conscientiousness', 'D', 'Fi Score', 'C'],
    time_limit_seconds: 120,
    order_index: 21,
  },

  {
    model_id: MODEL,
    block: 'caracter',
    competency_key: 'equidad_equipo',
    competency_label: 'Equidad y Justicia en el Equipo',
    scenario_type: 'role_play_mc',
    scenario_text: `Observas que tu jefe siempre elogia públicamente a cierta persona por sus logros, pero ignora completamente los logros de otros compañeros igualmente valiosos. Una persona en particular hace trabajo excelente pero nunca recibe reconocimiento.

Esto está afectando la moral del equipo. Algunos se sienten desmotivados. La persona ignorada está considerando irse.

¿Qué haces?`,
    options: [
      'Hablo en privado con mi jefe señalando el patrón: trabajo excelente sin reconocimiento afecta la moral. Sugiero reconocer a más gente.',
      'En reunión grupal destaco públicamente el trabajo excelente de esa persona en un proyecto específico.',
      'Busco tiempo privado con la persona para asegurarme de que sepa que noté su contribución excelente.',
      'Observo más antes de actuar. ¿Es patrón real o mi percepción? ¿Cuáles factores considera el jefe? Luego decido.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide Agreeableness (justicia), I (cómo influencia), Conscientiousness (responsabilidad grupal). Valora diferentes formas válidas de actuar.',
      option_weights: [
        { maps: { Agreeableness: 8, I: 8, Conscientiousness: 8 }, profile: 'diplomatic_advocate' },
        { maps: { Agreeableness: 8, I: 8, Conscientiousness: 7 }, profile: 'public_balanced_voice' },
        { maps: { Agreeableness: 8, I: 7, Conscientiousness: 7 }, profile: 'supportive_witness' },
        { maps: { Agreeableness: 8, I: 7, Conscientiousness: 8 }, profile: 'thoughtful_observer' }
      ],
      indicators: [
        { name: 'Sentido de justicia', description: 'Percibe y actúa ante inequidad', maps_to: 'Agreeableness', weight: 0.4, high_signal: 'Defiende lo justo activamente', low_signal: 'Pasa por alto' },
        { name: 'Influencia constructiva', description: 'Cómo plantea el problema', maps_to: 'I', weight: 0.35, high_signal: 'Directo, considerado, diplomático', low_signal: 'Confrontacional o pasivo' },
        { name: 'Responsabilidad grupal', description: 'Siente responsabilidad por equipo', maps_to: 'Conscientiousness', weight: 0.25, high_signal: 'Se involucra para mejorar clima', low_signal: '"No es mi rol"' }
      ]
    },
    target_columns: ['Agreeableness', 'I', 'Conscientiousness'],
    time_limit_seconds: 120,
    order_index: 22,
  },

  // ═══════════════════════════════════════════════════════════════
  // BLOQUE 4: BALANCE (5 scenarios) — Career & Well-being
  // ═══════════════════════════════════════════════════════════════

  {
    model_id: MODEL,
    block: 'bienestar_trayectoria',
    competency_key: 'motivacion_trabajo',
    competency_label: 'Motivación y Energía en el Trabajo',
    scenario_type: 'role_play_mc',
    scenario_text: `Es viernes 5pm. Tu jefe te pide que elijas UNO de estos 4 proyectos para liderar la próxima semana. Todos son igual de importantes para la empresa. ¿Cuál te genera más energía?`,
    options: [
      'Resolver problema técnico complejo para cliente importante. Alto riesgo, alto impacto, requiere pensamiento analítico profundo.',
      'Liderar equipo en actividad de construcción de relaciones. Requiere coordinación, comunicación y dinámicas positivas.',
      'Ejecutar proceso administrativo de alta precisión con procedimientos claros, métricas definidas y riesgo bajo.',
      'Explorar nueva metodología en área desconocida. Requiere aprendizaje rápido, adaptación constante y mentoría externa.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide motivación intrínseca. Cada respuesta es válida y refleja diferentes tipos de energía profesional.',
      option_weights: [
        { maps: { Logros_media: 8, Openness: 7, IQ: 7 }, profile: 'achievement_problem_solver' },
        { maps: { Afiliación_media: 8, I: 8, Extraversion: 8 }, profile: 'collaborative_relational' },
        { maps: { Conscientiousness: 8, S: 8, Neuroticism: 6 }, profile: 'process_organized_stable' },
        { maps: { Openness: 8, Logros_media: 7, 'Fd Score': 7 }, profile: 'growth_learning_curious' }
      ],
      indicators: [
        { name: 'Tipo de motivación', description: 'Qué actividad lo energiza', maps_to: 'Logros_media', weight: 0.4, high_signal: 'Respuesta específica y auténtica', low_signal: 'Genérica o contradictoria' },
        { name: 'Autoconocimiento', description: 'Entiende qué lo motiva realmente', maps_to: 'Conscientiousness', weight: 0.35, high_signal: 'Articula bien con ejemplos', low_signal: 'Vago o impreciso' },
        { name: 'Autenticidad', description: 'Suena genuino, no respuesta "correcta"', maps_to: 'Openness', weight: 0.25, high_signal: 'Vulnerable y honesto', low_signal: 'Cliché o socialmente deseable' }
      ]
    },
    target_columns: ['Logros_media', 'Conscientiousness', 'Openness', 'Afiliación_media'],
    time_limit_seconds: 120,
    order_index: 23,
  },

  {
    model_id: MODEL,
    block: 'bienestar_trayectoria',
    competency_key: 'vision_carrera',
    competency_label: 'Visión de Carrera — Tu Rol Ideal',
    scenario_type: 'role_play_mc',
    scenario_text: `Imagina tu rol ideal en 3 años. ¿Cuál de estas opciones más se alinea con lo que quieres?`,
    options: [
      'Especialista técnico profundo: experto reconocido. Otros me consultan. Autonomía técnica, impacto por expertise, sin liderar personas.',
      'Líder de equipo pequeño-mediano: dirijo 3-8 personas, desarrollo talento, defino estrategia. Balance entre liderazgo y ejecución.',
      'Líder ejecutivo estratégico: múltiples equipos, presupuesto, visión estratégica. Menos ejecución día a día, más toma de decisiones alto nivel.',
      'Emprendedor o consultor independiente: mi negocio o consultoría. Libertad de diseño, menos estructura corporativa, más control.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide orientación de carrera. Cada camino refleja diferentes valores y motivaciones válidas.',
      option_weights: [
        { maps: { Conscientiousness: 8, Openness: 6, Logros_media: 8 }, profile: 'expert_specialist' },
        { maps: { I: 8, Logros_media: 8, Conscientiousness: 8 }, profile: 'people_leader_balanced' },
        { maps: { D: 8, Poder_media: 8, Logros_media: 8 }, profile: 'strategic_executive' },
        { maps: { Openness: 8, Poder_media: 8, Logros_media: 8 }, profile: 'independent_entrepreneur' }
      ],
      indicators: [
        { name: 'Orientación profesional', description: 'Qué tipo de rol busca', maps_to: 'Logros_media', weight: 0.4, high_signal: 'Claro sobre su dirección profesional', low_signal: 'Indeciso o vago' },
        { name: 'Motivación de poder/autonomía', description: 'Qué valora: liderazgo, expertise, independencia', maps_to: 'Poder_media', weight: 0.35, high_signal: 'Entiende qué lo motiva', low_signal: 'Sin claridad sobre preferencias' },
        { name: 'Ambición de crecimiento', description: 'Quiere crecer y en qué dirección', maps_to: 'Openness', weight: 0.25, high_signal: 'Visión clara', low_signal: 'Sin visión de futuro' }
      ]
    },
    target_columns: ['Logros_media', 'Poder_media', 'Openness'],
    time_limit_seconds: 120,
    order_index: 24,
  },

  {
    model_id: MODEL,
    block: 'bienestar_trayectoria',
    competency_key: 'resiliencia',
    competency_label: 'Resiliencia y Recuperación',
    scenario_type: 'role_play_mc',
    scenario_text: `Acabas de pasar por un trimestre muy difícil: perdiste un cliente importante por un error tuyo, recibiste críticas del gerente, y un compañero admirado dejó la empresa. Trabajaste muchas horas bajo mucha presión.

Ahora es viernes al atardecer. El trimestre terminó. ¿Cómo recargas energía para volver más fuerte?`,
    options: [
      'Desconecto: deporte, tiempo con gente querida, hobby. Fin de semana sin pensar en trabajo. El lunes: reviso qué aprendí y sigo.',
      'Necesito procesar: hablo con amigo/mentor sobre lo que pasó. Entiendo qué salió mal y me valido. Con eso suelto y recargo.',
      'Veo fracasos como aprendizaje. Leo historias de otros que pasaron por crisis. Me inspira ver que otros remontaron.',
      'Dedico tiempo a reflexión personal. ¿Qué puedo mejorar? ¿Qué está fuera de mi control? Con eso claro, asumo responsabilidades.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide resiliencia y coping. Cada estrategia es válida y refleja diferentes enfoques de recuperación.',
      option_weights: [
        { maps: { Neuroticism: 8, Conscientiousness: 7, Openness: 6, 'Bi Score': 8 }, profile: 'recovery_focused' },
        { maps: { Neuroticism: 7, Afiliación_media: 8, 'Bd Score': 7, 'Bi Score': 7 }, profile: 'relational_healer' },
        { maps: { Neuroticism: 6, Openness: 8, Logros_media: 7, 'Bi Score': 7 }, profile: 'learning_motivated' },
        { maps: { Neuroticism: 7, Conscientiousness: 8, Openness: 7, 'Bi Score': 8 }, profile: 'thoughtful_reflective' }
      ],
      indicators: [
        { name: 'Recuperación emocional', description: 'Manejo del fracaso y frustración', maps_to: 'Neuroticism', weight: 0.4, high_signal: 'Procesa y recarga', low_signal: 'Rumia o niega' },
        { name: 'Estrategia de coping', description: 'Método constructivo', maps_to: 'Conscientiousness', weight: 0.3, high_signal: 'Reflexiona y actúa', low_signal: 'Escapismo' },
        { name: 'Orientación al crecimiento', description: 'Ve aprendizaje en dificultad', maps_to: 'Openness', weight: 0.3, high_signal: 'Extrae lecciones', low_signal: 'Solo ve pérdida' }
      ]
    },
    target_columns: ['Neuroticism', 'Conscientiousness', 'Openness', 'Bi Score'],
    time_limit_seconds: 120,
    order_index: 25,
  },

  {
    model_id: MODEL,
    block: 'bienestar_trayectoria',
    competency_key: 'aprendizaje_continuo',
    competency_label: 'Aprendizaje y Desarrollo Continuo',
    scenario_type: 'role_play_mc',
    scenario_text: `Tu empresa te da un bono de USD $500 para desarrollo profesional. Puedes usarlo en UNA de estas opciones. ¿Cuál eliges?`,
    options: [
      'Bootcamp intenso de 3 meses en habilidad completamente nueva. Requiere dedicación pero abre carrera nueva.',
      'Certificación profesional en mi área actual. Profundiza expertise, valida habilidades, aumenta valor en mercado.',
      'Conferencia de industria más viaje. Networking, exposición a tendencias nuevas, inspiración. Menos conocimiento específico.',
      'Mentoría privada de experto en mi debilidad. Aprendizaje contextualizado, feedback personalizado, en mi horario.'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide enfoque de aprendizaje. Diferentes estilos reflejan distintas preferencias válidas.',
      option_weights: [
        { maps: { Openness: 8, Conscientiousness: 8, Logros_media: 8 }, profile: 'proactive_ambitious_learner' },
        { maps: { Openness: 6, Conscientiousness: 7, Logros_media: 7 }, profile: 'pragmatic_practical_learner' },
        { maps: { Openness: 7, Conscientiousness: 6, Logros_media: 6 }, profile: 'experiential_hands_on' },
        { maps: { Openness: 6, Conscientiousness: 7, Logros_media: 7 }, profile: 'balanced_adaptive_learner' }
      ],
      indicators: [
        { name: 'Curiosidad intelectual', description: 'Disposición a aprender', maps_to: 'Openness', weight: 0.4, high_signal: 'Busca desarrollo activamente', low_signal: 'Se conforma con actual' },
        { name: 'Disciplina y estructura', description: 'Cómo dedica tiempo al aprendizaje', maps_to: 'Conscientiousness', weight: 0.35, high_signal: 'Planificado y consistente', low_signal: 'Solo cuando obligación' },
        { name: 'Orientación a crecimiento', description: 'Motivación para auto-mejora', maps_to: 'Logros_media', weight: 0.25, high_signal: 'Proactivo en desarrollo', low_signal: 'Pasivo o estancado' }
      ]
    },
    target_columns: ['Openness', 'Conscientiousness', 'Logros_media'],
    time_limit_seconds: 120,
    order_index: 26,
  },

  {
    model_id: MODEL,
    block: 'bienestar_trayectoria',
    competency_key: 'criterios_oportunidad',
    competency_label: 'Criterios de Decisión Laboral',
    scenario_type: 'role_play_mc',
    scenario_text: `Recibes una oferta de otra empresa. Rol parecido al actual con aumento 25%. Pero tendrías que dejar tu empresa donde tienes relaciones establecidas.

¿Cuál es el criterio PRINCIPAL que te haría quedarte o irte?`,
    options: [
      'Crecimiento y nuevas habilidades. ¿Qué rol expone a desafíos nuevos? ¿Cuál es mejor para mi desarrollo a 5 años? Crecimiento es prioridad.',
      'Personas y cultura. ¿Equipo que admiro? ¿Relaciones significativas? ¿Gente colaborativa que me reta? Las relaciones son decisivas.',
      'Seguridad, estabilidad y previsibilidad. ¿Cuál empresa es más estable? ¿Qué rol da claridad? Prefiero certeza a riesgo.',
      'Visibilidad, impacto y reconocimiento. ¿Dónde demuestro potencial? ¿Más influencia? ¿Dónde soy reconocido por contribuciones?'
    ],
    scoring_rubric: {
      instructions: 'Escenario mide valores de carrera. Cada criterio refleja diferentes prioridades válidas.',
      option_weights: [
        { maps: { Openness: 8, Logros_media: 8, Conscientiousness: 7 }, profile: 'growth_development_priority' },
        { maps: { Afiliación_media: 8, I: 8, Agreeableness: 8 }, profile: 'relationship_culture_priority' },
        { maps: { S: 8, Conscientiousness: 8, Neuroticism: 6 }, profile: 'stability_security_priority' },
        { maps: { Poder_media: 8, D: 8, Logros_media: 8 }, profile: 'impact_recognition_priority' }
      ],
      indicators: [
        { name: 'Criterio decisivo', description: 'Qué prioriza en decisión laboral', maps_to: 'Openness', weight: 0.35, high_signal: 'Claro y alineado con sus valores', low_signal: 'Vago o contradictorio' },
        { name: 'Autoconocimiento', description: 'Entiende qué lo motiva realmente', maps_to: 'Conscientiousness', weight: 0.35, high_signal: 'Articulación clara y reflexiva', low_signal: 'Genérico o superficial' },
        { name: 'Autenticidad', description: 'Respuesta genuina no socialmente deseable', maps_to: 'Agreeableness', weight: 0.3, high_signal: 'Honesto y vulnerable', low_signal: 'Lo que "debería" decir' }
      ]
    },
    target_columns: ['Openness', 'Conscientiousness', 'Agreeableness', 'Afiliación_media'],
    time_limit_seconds: 120,
    order_index: 27,
  },

  // ═══════════════════════════════════════════════════════════════
  // SOCIAL DESIRABILITY CONTROL ITEMS (2 scenarios) — Lie Detectors
  // ═══════════════════════════════════════════════════════════════

  {
    model_id: MODEL,
    block: 'caracter',
    competency_key: 'control_deseabilidad_1',
    competency_label: 'Control de Consistencia I',
    scenario_type: 'role_play_mc',
    scenario_text: `Piensa en tu último mes de trabajo. ¿Con qué frecuencia sentiste alguna de estas cosas?`,
    options: [
      'A veces me distraigo con teléfono o redes sociales. Es humano, pero siempre cumplo mis entregas.',
      'Nunca me distraigo durante trabajo. Mi concentración es total y no necesito descansos adicionales.',
      'Tengo momentos productivos y de baja energía. Manejo tiempos para aprovechar los picos.',
      'Algunos días me cuesta concentrarme, especialmente después del almuerzo. Uso técnicas como listas para mantenerme activo.'
    ],
    scoring_rubric: {
      instructions: 'CONTROL ITEM: Option B is the socially desirable lie. Nobody has "total concentration" with zero distractions. Selecting B signals impression management. Options A, C, D are honest and realistic.',
      option_weights: [
        { maps: { Conscientiousness: 7, Neuroticism: 6, 'Bi Score': 7 }, profile: 'honest_self_aware' },
        { maps: { Conscientiousness: 3, Neuroticism: 3, 'Bi Score': 3 }, profile: 'SOCIAL_DESIRABILITY_FLAG' },
        { maps: { Conscientiousness: 7, Neuroticism: 7, 'Bi Score': 7 }, profile: 'balanced_realistic' },
        { maps: { Conscientiousness: 7, Neuroticism: 6, 'Bi Score': 6 }, profile: 'honest_adaptive' }
      ],
      indicators: [
        { name: 'Autenticidad', description: 'Respuesta realista vs socialmente deseable', maps_to: 'Bi Score', weight: 0.5, high_signal: 'Admite imperfecciones normales', low_signal: 'Presenta imagen perfecta' },
        { name: 'Autoconocimiento', description: 'Conoce sus patrones', maps_to: 'Conscientiousness', weight: 0.3, high_signal: 'Describe estrategias reales', low_signal: 'Afirma perfección' },
        { name: 'Honestidad', description: 'Nivel de transparencia', maps_to: 'Neuroticism', weight: 0.2, high_signal: 'Vulnerable y real', low_signal: 'Defensivo' }
      ]
    },
    target_columns: ['Conscientiousness', 'Neuroticism', 'Bi Score'],
    time_limit_seconds: 90,
    order_index: 28,
  },

  {
    model_id: MODEL,
    block: 'bienestar_trayectoria',
    competency_key: 'control_deseabilidad_2',
    competency_label: 'Control de Consistencia II',
    scenario_type: 'role_play_mc',
    scenario_text: `¿Cuál de estas afirmaciones describe mejor tu relación con los errores en el trabajo?`,
    options: [
      'Nunca cometo errores graves. Soy muy cuidadoso y reviso todo antes de entregar.',
      'Cometo errores ocasionalmente como cualquiera. Lo importante es cómo los manejo y qué aprendo.',
      'He cometido errores que me costaron caro. Fueron difíciles pero me hicieron mejor profesional.',
      'Minimizo errores pero acepto que son parte del trabajo. Algunos me han enseñado más que éxitos.'
    ],
    scoring_rubric: {
      instructions: 'CONTROL ITEM: Option A is the socially desirable lie. Everyone makes mistakes. Claiming you never make "serious errors" signals impression management. Options B, C, D are honest.',
      option_weights: [
        { maps: { Conscientiousness: 3, Openness: 3, C: 3 }, profile: 'SOCIAL_DESIRABILITY_FLAG' },
        { maps: { Conscientiousness: 7, Openness: 7, C: 7 }, profile: 'balanced_honest' },
        { maps: { Conscientiousness: 8, Openness: 8, C: 7 }, profile: 'growth_mindset_vulnerable' },
        { maps: { Conscientiousness: 7, Openness: 7, C: 7 }, profile: 'realistic_learner' }
      ],
      indicators: [
        { name: 'Autenticidad', description: 'Admite falibilidad', maps_to: 'Conscientiousness', weight: 0.5, high_signal: 'Acepta errores con madurez', low_signal: 'Niega imperfecciones' },
        { name: 'Growth mindset', description: 'Ve errores como aprendizaje', maps_to: 'Openness', weight: 0.3, high_signal: 'Extrae valor de fracasos', low_signal: 'Evita admitir fracasos' },
        { name: 'Autoconocimiento', description: 'Nivel de introspección', maps_to: 'C', weight: 0.2, high_signal: 'Reflexivo', low_signal: 'Superficial' }
      ]
    },
    target_columns: ['Conscientiousness', 'Openness', 'C'],
    time_limit_seconds: 90,
    order_index: 29,
  },
];
