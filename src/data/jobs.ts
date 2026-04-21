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

export const departments = ["Comercial", "Operaciones"] as const;
export const modes = ["Presencial", "Híbrido", "Remoto"] as const;

/**
 * VACANTES REALES — Trading Solutions Barranquilla
 * Fuente: LinkedIn oficial · Última actualización: abril 2026
 */
export const jobs: Job[] = [
  {
    id: 1,
    slug: "senior-pricing-analyst",
    linkedinUrl: "https://www.linkedin.com/jobs/view/4403973230/",
    title: {
      es: "Pricing Senior",
      en: "Senior Pricing Analyst",
    },
    dept: "Comercial",
    location: "Barranquilla, Atlántico, Colombia",
    mode: "Presencial",
    level: "Senior",
    salary: "Competitivo según experiencia",
    tags: ["Pricing", "Freight Forwarding", "Incoterms", "Carrier Negotiation", "RFQ/RFP"],
    description: {
      es: "Liderarás la estrategia de tarifas y la rentabilidad de la red global de Trading Solutions. Tomarás ownership de la estrategia de pricing — analizarás mercados, negociarás con carriers y construirás la ventaja competitiva que impulsa nuestra expansión internacional en servicios marítimos, aéreos y terrestres.",
      en: "Lead rate strategy and drive profitability across Trading Solutions' global freight network. Take ownership of pricing strategy — analyze markets, negotiate with carriers, and build the competitive edge that fuels international expansion across ocean, air, and ground services.",
    },
    responsibilities: {
      es: [
        "Liderar el desarrollo y ejecución de estrategias de pricing en servicios marítimos, aéreos y terrestres para maximizar ingresos y margen",
        "Negociar acuerdos de tarifas complejos con carriers, co-loaders y agentes en el exterior usando compromisos de volumen e inteligencia de mercado",
        "Gestionar respuestas a RFQ/RFP de cuentas clave y estratégicas con modelos de costo detallados y propuestas comerciales",
        "Mentorear analistas junior de pricing y hacer partnership con liderazgos de Ventas, Operaciones y Finanzas",
        "Diseñar y mantener dashboards de pricing y reportes de rentabilidad para toma de decisiones ejecutiva",
        "Monitorear costos reales vs. tarifas cotizadas y liderar análisis de causa raíz sobre variaciones de margen",
      ],
      en: [
        "Lead development and execution of pricing strategies across ocean, air, and ground services to maximize revenue and margin",
        "Negotiate complex rate agreements with carriers, co-loaders, and overseas agents using volume commitments and market intelligence",
        "Manage RFQ/RFP responses for key and strategic accounts with detailed cost models and commercial proposals",
        "Mentor junior pricing analysts and partner with Sales, Operations, and Finance leadership",
        "Design and maintain pricing dashboards and profitability reports for executive decision-making",
        "Monitor actual costs vs. quoted rates, lead root-cause analysis on margin variances",
      ],
    },
    requirements: {
      es: [
        "4+ años en pricing de freight forwarding, gestión de tarifas o logística comercial",
        "Conocimiento profundo de Incoterms, modos de envío internacionales (FCL, LCL, aéreo, terrestre, multimodal) y estructuras de costos",
        "Experiencia probada en negociación con carriers y gestión estratégica de tarifas",
        "Habilidades analíticas avanzadas; dominio de Excel, herramientas de pricing y visualización de datos",
        "Fuertes habilidades de liderazgo y comunicación interfuncional",
        "Licenciatura en Negocios Internacionales, Logística, Ingeniería Industrial, Finanzas o afín",
      ],
      en: [
        "4+ years in freight forwarding pricing, rate management, or commercial logistics",
        "Deep understanding of Incoterms, international shipping modes (FCL, LCL, air, ground, multimodal) and freight cost structures",
        "Proven carrier negotiation and strategic rate management experience",
        "Advanced analytical skills; expert Excel, pricing tools, data visualization",
        "Strong leadership and cross-functional communication skills",
        "Bachelor's in International Business, Logistics, Industrial Engineering, Finance, or related",
      ],
    },
    applyEmail: "jointheteam@tradingsolutions.com",
    postedAt: "2026-04-14",
  },
  {
    id: 2,
    slug: "inside-sales-support",
    linkedinUrl: "https://www.linkedin.com/jobs/view/4403965745/",
    title: {
      es: "Inside Sales Support",
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
      en: "You're the frontline of client success at Trading Solutions. Bridge commercial strategy and operational execution in a client-facing role — ensuring every customer interaction drives loyalty, revenue, and long-term growth across the global logistics portfolio.",
    },
    responsibilities: {
      es: [
        "Ser el punto de contacto principal para cuentas asignadas (consultas, seguimientos, solicitudes de servicio)",
        "Generar y gestionar cotizaciones de carga con el equipo de Pricing, asegurando precisión y posicionamiento competitivo",
        "Identificar oportunidades de upselling y cross-selling dentro del portafolio existente",
        "Hacer seguimiento end-to-end a los embarques y resolver incidencias proactivamente",
        "Colaborar con Operaciones, Documentación y Finanzas para una entrega de servicio impecable",
        "Mantener registros en CRM (interacciones, pipeline, forecasts) y apoyar el desarrollo de negocio",
      ],
      en: [
        "Serve as primary point of contact for assigned client accounts (inquiries, follow-ups, service requests)",
        "Generate and manage freight quotations with the Pricing team ensuring accuracy and competitive positioning",
        "Identify upselling and cross-selling opportunities within existing portfolio",
        "Track shipments end-to-end and resolve issues proactively",
        "Collaborate with Operations, Documentation, and Finance for seamless service delivery",
        "Maintain CRM records (interactions, pipeline, forecasts) and support business development",
      ],
    },
    requirements: {
      es: [
        "1-3 años en inside sales, account management o servicio al cliente en logística/freight forwarding",
        "Fuertes habilidades de comunicación y relacionamiento en inglés y español",
        "Capacidad para gestionar múltiples cuentas en un entorno de ritmo alto",
        "Dominio de herramientas CRM (Salesforce, HubSpot) y Microsoft Office",
        "Licenciatura en Administración de Empresas, Comercio Internacional, Marketing o afín",
        "Preferible: experiencia en freight forwarding, agenciamiento aduanero o 3PL",
      ],
      en: [
        "1-3 years in inside sales, account management, or customer service within logistics/freight forwarding",
        "Strong communication and relationship-building skills in English and Spanish",
        "Ability to manage multiple accounts in a fast-paced environment",
        "Proficiency in CRM tools (Salesforce, HubSpot) and Microsoft Office",
        "Bachelor's in Business Administration, International Trade, Marketing, or related",
        "Preferred: experience in freight forwarding, customs brokerage, or 3PL",
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
    salary: "Competitivo según experiencia",
    tags: ["Compliance", "Documentación Aduanera", "Bill of Lading", "Incoterms", "Freight Forwarding"],
    description: {
      es: "Eres la columna vertebral del compliance comercial y la precisión de cada embarque en Trading Solutions. Aseguras excelencia operativa en cada envío — donde la precisión se encuentra con el impacto global — gestionando flujos de documentación, compliance aduanero y coordinación interfuncional.",
      en: "You're the backbone of trade compliance and shipment accuracy at Trading Solutions. Ensure operational excellence across every shipment — where precision meets global impact — by managing documentation workflows, customs compliance, and cross-team coordination.",
    },
    responsibilities: {
      es: [
        "Preparar, revisar y procesar documentación de embarque: B/L, facturas comerciales, packing lists, certificados de origen, declaraciones aduaneras",
        "Asegurar cumplimiento de regulaciones de comercio internacional, requerimientos aduaneros y estándares de carrier",
        "Coordinar con carriers, forwarders, agentes aduaneros y agentes en el exterior para entregas a tiempo",
        "Gestionar flujos documentales de múltiples embarques cumpliendo cut-offs de buque y deadlines de aduana",
        "Identificar y resolver discrepancias antes de que impacten tiempos o generen penalidades",
        "Mantener archivos digitales organizados según políticas de retención y requerimientos de auditoría",
      ],
      en: [
        "Prepare, review, and process shipping documentation: B/L, commercial invoices, packing lists, certificates of origin, customs declarations",
        "Ensure compliance with international trade regulations, customs requirements, and carrier standards",
        "Coordinate with carriers, forwarders, customs brokers, and overseas agents for timely submission",
        "Manage document workflows across multiple shipments, meeting vessel cut-offs and customs clearance deadlines",
        "Identify and resolve discrepancies before they impact timelines or incur penalties",
        "Maintain organized digital records per retention policies and audit requirements",
      ],
    },
    requirements: {
      es: [
        "1-3 años en documentación de embarques, compliance comercial o administración logística",
        "Conocimiento de documentos de embarque internacional (B/L, AWB, ISF, AES, certificados de origen) y procedimientos aduaneros",
        "Atención excepcional al detalle bajo alto volumen y plazos ajustados",
        "Dominio de Microsoft Office y sistemas de gestión documental",
        "Licenciatura en Negocios Internacionales, Comercio Exterior, Logística o afín",
        "Preferible: Incoterms 2020, Cartas de Crédito, conocimiento US CBP/FDA/USDA; fluidez EN/ES",
      ],
      en: [
        "1-3 years in shipping documentation, trade compliance, or logistics administration",
        "Knowledge of international shipping documents (B/L, AWB, ISF, AES, certificates of origin) and customs procedures",
        "Exceptional attention to detail under high-volume, tight deadlines",
        "Proficiency in Microsoft Office and document management systems",
        "Bachelor's in International Business, Foreign Trade, Logistics, or related",
        "Preferred: Incoterms 2020, Letters of Credit, U.S. CBP/FDA/USDA knowledge; EN/ES fluency",
      ],
    },
    applyEmail: "jointheteam@tradingsolutions.com",
    postedAt: "2026-04-14",
  },
];
