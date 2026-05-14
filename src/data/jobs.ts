export interface Job {
  id: number;
  slug: string;
  linkedinUrl: string;
  title: { es: string; en: string };
  dept: string;
  location: string;
  mode: "Presencial" | "Híbrido" | "Remoto";
  level: "Junior" | "Mid-Level" | "Senior";
  salary: string;
  tags: string[];
  description: { es: string; en: string };
  responsibilities: { es: string[]; en: string[] };
  requirements: { es: string[]; en: string[] };
  applyEmail: string;
  postedAt: string;
}

export const departments = ["Comercial", "Operaciones", "Talento", "Finanzas"] as const;
export const modes = ["Presencial", "Híbrido", "Remoto"] as const;

/**
 * VACANTES ABIERTAS — Trading Solutions Barranquilla
 * Última actualización: 14 mayo 2026
 * Postulación: vía formulario en la página de cada vacante.
 */
export const jobs: Job[] = [
  {
    id: 2,
    slug: "inside-sales-support",
    linkedinUrl: "https://www.linkedin.com/jobs/view/4403965745/",
    title: {
      es: "Inside Sales Support Specialist",
      en: "Inside Sales Support Specialist",
    },
    dept: "Comercial",
    location: "Barranquilla, Atlántico, Colombia",
    mode: "Presencial",
    level: "Junior",
    salary: "Competitivo según experiencia",
    tags: ["Inside Sales", "CRM", "Account Management", "Cotizaciones", "Bilingüe EN/ES"],
    description: {
      es: "Eres la primera línea del éxito del cliente en Trading Solutions. Conectas la estrategia comercial con la ejecución operativa en un rol que da la cara al cliente — asegurando que cada interacción genere lealtad, revenue y crecimiento a largo plazo en nuestro portafolio global de logística.",
      en: "Step into a client-facing role where you'll bridge commercial strategy and operational execution — ensuring every customer interaction drives loyalty, revenue, and long-term growth across our global logistics portfolio.",
    },
    responsibilities: {
      es: [
        "Servir como punto de contacto principal para cuentas asignadas, gestionando consultas, follow-ups y solicitudes de servicio con rapidez y profesionalismo",
        "Generar y gestionar cotizaciones de carga en coordinación con el equipo de Pricing, asegurando precisión y posicionamiento competitivo",
        "Identificar proactivamente oportunidades de upselling y cross-selling dentro del portafolio existente",
        "Hacer seguimiento end-to-end de los embarques manteniendo a los clientes informados y resolviendo incidencias antes de que escalen",
        "Colaborar con Operaciones, Documentación y Finanzas para garantizar entrega de servicio impecable, desde la reserva hasta la entrega final",
        "Mantener registros CRM actualizados con interacciones, estado del pipeline y forecasts de revenue",
        "Apoyar desarrollo de negocio investigando prospectos, preparando propuestas y agendando reuniones para el liderazgo comercial",
        "Contribuir a estrategias de retención de clientes monitoreando métricas de satisfacción y actuando sobre el feedback",
      ],
      en: [
        "Serve as the primary point of contact for assigned client accounts, managing inquiries, follow-ups, and service requests with speed and professionalism",
        "Generate and manage freight quotations in coordination with the Pricing team, ensuring accuracy and competitive positioning",
        "Proactively identify upselling and cross-selling opportunities within the existing client portfolio",
        "Track shipments end-to-end to keep clients informed and resolve issues before they escalate",
        "Collaborate with Operations, Documentation, and Finance teams to guarantee seamless service delivery from booking to final delivery",
        "Maintain CRM records up to date with client interactions, pipeline status, and revenue forecasts",
        "Support business development efforts by researching prospects, preparing proposals, and scheduling meetings for senior sales leadership",
        "Contribute to client retention strategies by monitoring satisfaction metrics and acting on feedback",
      ],
    },
    requirements: {
      es: [
        "1-3 años en inside sales, account management o servicio al cliente en logística/freight forwarding",
        "Fuertes habilidades de comunicación y construcción de relaciones en inglés y español",
        "Capacidad de gestionar múltiples cuentas y prioridades simultáneamente en un entorno de ritmo alto",
        "Dominio de herramientas CRM (Salesforce, HubSpot o similar) y Microsoft Office",
        "Licenciatura en Administración de Empresas, Comercio Internacional, Marketing o afín",
        "Preferible: experiencia en freight forwarding internacional, agenciamiento aduanero o 3PL",
        "Preferible: familiaridad con Incoterms, documentación de embarque y compliance básico",
        "Preferible: historial de cumplir o exceder metas de ventas y KPIs · profesional energético orientado a soluciones",
      ],
      en: [
        "1-3 years of experience in inside sales, account management, or customer service within logistics or freight forwarding",
        "Strong communication and relationship-building skills in both English and Spanish",
        "Ability to manage multiple accounts and priorities simultaneously in a fast-paced environment",
        "Proficiency in CRM tools (Salesforce, HubSpot, or similar) and Microsoft Office Suite",
        "Bachelor's degree in Business Administration, International Trade, Marketing, or related field",
        "Preferred: experience in international freight forwarding, customs brokerage, or 3PL environments",
        "Preferred: familiarity with Incoterms, shipping documentation, and trade compliance basics",
        "Preferred: track record of meeting or exceeding sales targets and KPIs · energetic, solution-oriented professional",
      ],
    },
    applyEmail: "jointheteam@tradingsolutions.com",
    postedAt: "2026-04-14",
  },
  {
    id: 3,
    slug: "customer-documentation-specialist",
    linkedinUrl: "https://www.linkedin.com/jobs/view/4403956946/",
    title: {
      es: "Customer Documentation Specialist",
      en: "Customer Documentation Specialist",
    },
    dept: "Operaciones",
    location: "Barranquilla, Atlántico, Colombia",
    mode: "Presencial",
    level: "Junior",
    salary: "Competitivo según experiencia + beneficios",
    tags: ["Compliance", "Documentación Aduanera", "Bill of Lading", "Incoterms", "Freight Forwarding"],
    description: {
      es: "Únete a nuestro equipo de Documentación y conviértete en la columna vertebral del compliance comercial y la precisión de cada embarque · donde la precisión se encuentra con el impacto global.",
      en: "Join our Documentation team and become the backbone of our trade compliance and shipment accuracy — where precision meets global impact.",
    },
    responsibilities: {
      es: [
        "Preparar, revisar y procesar toda la documentación de embarque: Bills of Lading, facturas comerciales, packing lists, certificados de origen y declaraciones aduaneras",
        "Asegurar pleno cumplimiento de regulaciones de comercio internacional, requerimientos aduaneros y estándares de documentación específicos de carrier",
        "Coordinar con carriers, freight forwarders, agentes aduaneros y agentes en el exterior para garantizar entrega documental a tiempo y sin errores",
        "Gestionar flujos documentales de múltiples embarques simultáneamente, manteniendo deadlines estrictos para cut-offs de buque y despacho aduanero",
        "Identificar y resolver discrepancias documentales antes de que impacten tiempos o generen penalidades",
        "Mantener registros digitales organizados de todos los documentos comerciales según políticas de retención y requerimientos de auditoría",
        "Apoyar a los equipos de Operaciones y Ventas proporcionando actualizaciones precisas de estado documental y resolución proactiva de problemas",
        "Mejorar continuamente los procesos de documentación para reducir tiempos de respuesta y minimizar errores",
      ],
      en: [
        "Prepare, review, and process all shipping documentation including Bills of Lading, commercial invoices, packing lists, certificates of origin, and customs declarations",
        "Ensure full compliance with international trade regulations, customs requirements, and carrier-specific documentation standards",
        "Coordinate with carriers, freight forwarders, customs brokers, and overseas agents to guarantee timely and error-free document submission",
        "Manage document workflows across multiple shipments simultaneously, maintaining strict deadlines for vessel cut-offs and customs clearance",
        "Identify and resolve documentation discrepancies before they impact shipment timelines or incur penalties",
        "Maintain organized digital records of all trade documents in compliance with company retention policies and audit requirements",
        "Support the Operations and Sales teams by providing accurate documentation status updates and proactive issue resolution",
        "Continuously improve documentation processes to reduce turnaround times and minimize errors",
      ],
    },
    requirements: {
      es: [
        "1-3 años de experiencia en documentación de embarques, trade compliance o administración logística",
        "Sólido conocimiento de documentos de embarque internacional (B/L, AWB, ISF, AES, certificados de origen) y procedimientos aduaneros",
        "Atención excepcional al detalle con capacidad de gestionar altos volúmenes bajo plazos ajustados",
        "Dominio de Microsoft Office y sistemas de gestión documental",
        "Licenciatura en Negocios Internacionales, Comercio Exterior, Logística o afín",
        "Preferible: experiencia con software de freight forwarding o plataformas TMS",
        "Preferible: familiaridad con regulaciones de aduanas de EE.UU. (CBP), FDA, USDA u otras agencias",
        "Preferible: conocimiento de Incoterms 2020 y documentación de Letters of Credit · fluidez EN/ES",
      ],
      en: [
        "1-3 years of experience in shipping documentation, trade compliance, or logistics administration",
        "Strong knowledge of international shipping documents (B/L, AWB, ISF, AES, certificates of origin) and customs procedures",
        "Exceptional attention to detail with the ability to manage high volumes under tight deadlines",
        "Proficiency in Microsoft Office and document management systems",
        "Bachelor's degree in International Business, Foreign Trade, Logistics, or related field",
        "Preferred: experience with freight forwarding software or TMS platforms",
        "Preferred: familiarity with U.S. customs regulations (CBP), FDA, USDA, or other agency requirements",
        "Preferred: knowledge of Incoterms 2020 and Letters of Credit documentation · fluency in English and Spanish",
      ],
    },
    applyEmail: "jointheteam@tradingsolutions.com",
    postedAt: "2026-04-14",
  },
  {
    id: 4,
    slug: "pricing-junior",
    linkedinUrl: "https://www.linkedin.com/jobs/view/4403965746/",
    title: {
      es: "Pricing Junior",
      en: "Pricing Junior",
    },
    dept: "Comercial",
    location: "Barranquilla, Atlántico, Colombia",
    mode: "Presencial",
    level: "Junior",
    salary: "Competitivo según experiencia",
    tags: ["Pricing", "Freight", "Excel", "Análisis de Datos", "Tarifas"],
    description: {
      es: "Entra en un rol data-driven donde aprenderás los fundamentos del freight pricing — desde gestión de tarifas hasta negociación — construyendo la ventaja analítica que impulsa cotizaciones competitivas y mejores márgenes para nuestro equipo de Pricing.",
      en: "Step into a data-driven role where you'll learn the foundations of freight pricing — from rate management to negotiation — building the analytical edge that powers competitive quotes and stronger margins for our Pricing team.",
    },
    responsibilities: {
      es: [
        "Apoyar la carga, actualización y mantenimiento de bases de datos de tarifas de carga, asegurando archivos organizados, correctamente nombrados y actualizados en carpetas compartidas",
        "Verificar información de tarifas, marcar inconsistencias y reportar discrepancias para mantener data de pricing limpia y confiable",
        "Enviar solicitudes de tarifas a vendors designados y registrar tarifas recibidas en plantillas oficiales con trazabilidad completa",
        "Hacer seguimiento del historial de cotizaciones, contribuir a verificaciones de precios de cierre y apoyar análisis comparativos básicos entre proveedores",
        "Colaborar en la preparación de reportes de ahorros, análisis de márgenes e insights comerciales que alimentan decisiones estratégicas",
        "Sugerir mejoras a formatos de pricing, plantillas y herramientas de registro para impulsar eficiencia de procesos",
        "Apoyar la actualización mensual del tarifario de scrap y commodities bajo supervisión directa del Lead Pricing",
        "Mantener el orden documental en Drive y la confidencialidad estricta de información comercial",
      ],
      en: [
        "Support the loading, updating, and maintenance of freight rate databases, ensuring files are organized, accurately named, and up to date in shared folders",
        "Verify rate information, flag inconsistencies, and report discrepancies to keep our pricing data clean and reliable",
        "Send rate request inquiries to designated vendors and register received rates in official templates with full traceability",
        "Track quote history, contribute to closing-price verifications, and support basic comparative analyses across providers",
        "Collaborate in the preparation of savings reports, margin analyses, and commercial insights that feed strategic decisions",
        "Suggest improvements to pricing formats, templates, and registration tools to drive process efficiency",
        "Support the monthly update of the scrap and commodities tariff schedule under direct supervision from the Lead Pricing",
        "Maintain document order in Drive and uphold strict confidentiality of commercial information",
      ],
    },
    requirements: {
      es: [
        "0-1 año de experiencia en pricing, logística, servicio al cliente o áreas relacionadas (recién graduados bienvenidos)",
        "Licenciatura en Comercio Internacional, Negocios Internacionales, Ingeniería Industrial o afín",
        "Dominio avanzado de Microsoft Office (especialmente Excel) y Google Workspace (Sheets, Drive, Docs)",
        "Fuerte atención al detalle, mentalidad analítica y disposición a aprender",
        "Inglés B1 o superior (trabajamos con vendors y clientes internacionales diariamente)",
        "Preferible: práctica o exposición académica a freight forwarding, agenciamiento aduanero o logística internacional",
        "Preferible: familiaridad con Incoterms, documentación de embarque y compliance básico",
        "Preferible: experiencia manejando rate sheets, cotizaciones o coordinación con vendors · organización, precisión y confidencialidad",
      ],
      en: [
        "0-1 year of experience in pricing, logistics, customer service, or related areas (recent graduates welcome)",
        "Bachelor's degree in International Trade, International Business, Industrial Engineering, or related field",
        "Advanced proficiency in Microsoft Office Suite (especially Excel) and Google Workspace (Sheets, Drive, Docs)",
        "Strong attention to detail, analytical mindset, and willingness to learn",
        "English B1 or higher (we work with international vendors and clients daily)",
        "Preferred: internship or academic exposure to freight forwarding, customs brokerage, or international logistics",
        "Preferred: familiarity with Incoterms, shipping documentation, and basic trade compliance",
        "Preferred: experience handling rate sheets, quotations, or vendor coordination · organized, precise, and confidentiality-driven",
      ],
    },
    applyEmail: "jointheteam@tradingsolutions.com",
    postedAt: "2026-05-14",
  },
  {
    id: 5,
    slug: "talent-acquisition-development-lead",
    linkedinUrl: "https://www.linkedin.com/jobs/view/4403965747/",
    title: {
      es: "Talent Acquisition and Development Lead",
      en: "Talent Acquisition and Development Lead",
    },
    dept: "Talento",
    location: "Barranquilla, Atlántico, Colombia",
    mode: "Presencial",
    level: "Senior",
    salary: "Competitivo según experiencia",
    tags: ["Talent Acquisition", "Recruiting", "Employer Branding", "ATS", "Bilingüe EN/ES", "Leadership"],
    description: {
      es: "Entra en un rol estratégico donde liderarás el ciclo de talento end-to-end — diseñando cómo atraemos, evaluamos y desarrollamos a las personas que impulsan nuestras operaciones en cinco continentes. Harás partnership directo con nuestro C-suite y hiring managers para construir una fuerza laboral que escale con nuestra ambición.",
      en: "Step into a strategic role where you'll own the end-to-end talent lifecycle — designing how we attract, evaluate, and grow the people who power our operations across five continents. You'll partner directly with our C-suite and hiring managers to build a workforce that scales with our ambition.",
    },
    responsibilities: {
      es: [
        "Liderar el ciclo completo de recruiting para roles técnicos, comerciales y operativos en LATAM y EE.UU., desde sourcing hasta oferta",
        "Construir y ejecutar estrategias de employer branding que posicionen a Trading Solutions como destino top para talento bilingüe en logística",
        "Diseñar y refinar marcos de assessment (psicométrico, técnico, conductual) para garantizar decisiones de contratación consistentes y data-driven",
        "Gestionar el ATS y stack tecnológico de recruiting (LinkedIn Recruiter, plataforma de carreras propia, herramientas de assessment) para escalar el pipeline eficientemente",
        "Hacer partnership con hiring managers para definir perfiles de rol, calibrar expectativas y acelerar time-to-hire sin comprometer calidad",
        "Impulsar iniciativas de desarrollo de talento — career paths, movilidad interna, programas de liderazgo — que retengan y crezcan a nuestra mejor gente",
        "Construir y mantener un pipeline proactivo de talento mediante outreach en LinkedIn, alianzas universitarias y programas de referidos",
        "Reportar métricas clave de talento (time-to-hire, efectividad de fuentes, retención) al C-suite y convertir insights en estrategia",
      ],
      en: [
        "Lead the full recruiting lifecycle for technical, commercial, and operations roles across LATAM and the U.S., from sourcing to offer",
        "Build and execute employer branding strategies that position Trading Solutions as a top destination for bilingual logistics talent",
        "Design and refine assessment frameworks (psychometric, technical, behavioral) to ensure consistent, data-driven hiring decisions",
        "Manage our ATS and recruiting tech stack (LinkedIn Recruiter, custom careers platform, assessment tools) to scale our pipeline efficiently",
        "Partner with hiring managers to define role profiles, calibrate expectations, and accelerate time-to-hire without compromising quality",
        "Drive talent development initiatives — career paths, internal mobility, leadership programs — that retain and grow our best people",
        "Build and maintain a proactive talent pipeline through LinkedIn outreach, university partnerships, and referral programs",
        "Report key talent metrics (time-to-hire, source effectiveness, retention) to the C-suite and turn insights into strategy",
      ],
    },
    requirements: {
      es: [
        "4-7 años de experiencia en talent acquisition, con al menos 2 años en rol de liderazgo o estratégico",
        "Track record probado gestionando recruiting bilingüe de alto volumen en entornos de ritmo alto",
        "Experiencia hands-on con plataformas ATS, LinkedIn Recruiter y herramientas de assessment (psicométrico, conductual o técnico)",
        "Fuertes habilidades de stakeholder management — capacidad de influenciar líderes senior y hiring managers con data y claridad",
        "Fluidez en inglés y español (escrito y hablado)",
        "Licenciatura en Recursos Humanos, Administración de Empresas, Ingeniería Industrial, Psicología o afín",
        "Preferible: experiencia recruiting en logística, freight forwarding, BPO o comercio internacional · employer branding y social media para atracción de talento",
        "Preferible: familiaridad con frameworks de desarrollo de talento (9-box, succession planning, pipelines de liderazgo) · mentalidad solution-oriented",
      ],
      en: [
        "4-7 years of experience in talent acquisition, with at least 2 years in a leadership or strategic role",
        "Proven track record managing high-volume bilingual recruiting in fast-paced environments",
        "Hands-on experience with ATS platforms, LinkedIn Recruiter, and assessment tools (psychometric, behavioral, or technical)",
        "Strong stakeholder management skills — able to influence senior leaders and hiring managers with data and clarity",
        "Fluency in English and Spanish (written and verbal)",
        "Bachelor's degree in Human Resources, Business Administration, Industrial Engineering, Psychology, or related field",
        "Preferred: experience recruiting in logistics, freight forwarding, BPO, or international trade industries · employer branding and social media for talent attraction",
        "Preferred: familiarity with talent development frameworks (9-box, succession planning, leadership pipelines) · solution-oriented mindset",
      ],
    },
    applyEmail: "jointheteam@tradingsolutions.com",
    postedAt: "2026-05-14",
  },
];
