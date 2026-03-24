export interface Job {
  id: number;
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
}

export const departments = ["Operaciones", "Corporate", "Comercial", "People", "Finanzas"] as const;
export const modes = ["Presencial", "Híbrido", "Remoto"] as const;

export const jobs: Job[] = [
  {
    id: 1,
    title: { es: "Coordinador de Operaciones Marítimas", en: "Maritime Operations Coordinator" },
    dept: "Operaciones",
    location: "Ciudad de Panamá, Panamá",
    mode: "Presencial",
    level: "Mid-Level",
    salary: "$45,000 — $60,000 USD",
    tags: ["Logística", "Comercio exterior", "Gestión de embarques"],
    description: {
      es: "Coordinarás operaciones marítimas de importación y exportación para clientes estratégicos, asegurando tiempos de entrega y cumplimiento regulatorio en una de las rutas más dinámicas del mundo.",
      en: "You'll coordinate maritime import and export operations for strategic clients, ensuring delivery times and regulatory compliance on one of the world's most dynamic trade routes."
    },
    responsibilities: {
      es: [
        "Gestionar embarques marítimos de punto a punto con visibilidad en tiempo real",
        "Coordinar con agentes internacionales, navieras y autoridades portuarias",
        "Optimizar costos y tiempos de tránsito a través de negociación estratégica",
        "Garantizar cumplimiento aduanero y documentación correcta",
        "Proponer mejoras operativas usando datos y tecnología"
      ],
      en: [
        "Manage maritime shipments point-to-point with real-time visibility",
        "Coordinate with international agents, shipping lines, and port authorities",
        "Optimize costs and transit times through strategic negotiation",
        "Ensure customs compliance and correct documentation",
        "Propose operational improvements using data and technology"
      ]
    },
    requirements: {
      es: [
        "3+ años de experiencia en freight forwarding o logística internacional",
        "Conocimiento de Incoterms, regulaciones aduaneras y documentación marítima",
        "Inglés avanzado (comunicación diaria con partners globales)",
        "Perfil analítico con orientación a resultados",
        "Capacidad para gestionar múltiples operaciones simultáneamente"
      ],
      en: [
        "3+ years of experience in freight forwarding or international logistics",
        "Knowledge of Incoterms, customs regulations, and maritime documentation",
        "Advanced English (daily communication with global partners)",
        "Analytical profile with results-oriented approach",
        "Ability to manage multiple operations simultaneously"
      ]
    }
  },
  {
    id: 2,
    title: { es: "Analista de Aduanas", en: "Customs Analyst" },
    dept: "Operaciones",
    location: "Miami, FL",
    mode: "Híbrido",
    level: "Junior",
    salary: "$38,000 — $50,000 USD",
    tags: ["Aduanas", "Compliance", "Regulaciones"],
    description: {
      es: "Serás parte del equipo que asegura que cada carga cruce fronteras de forma legal, eficiente y sin fricciones. Tu ojo para el detalle mantendrá nuestras operaciones impecables.",
      en: "You'll be part of the team ensuring every shipment crosses borders legally, efficiently, and seamlessly. Your attention to detail will keep our operations impeccable."
    },
    responsibilities: {
      es: [
        "Clasificar mercancías y determinar aranceles aplicables",
        "Preparar y revisar documentación aduanera para importaciones y exportaciones",
        "Coordinar con brokers y autoridades aduaneras",
        "Monitorear cambios regulatorios y actualizar procedimientos",
        "Apoyar auditorías de compliance"
      ],
      en: [
        "Classify merchandise and determine applicable tariffs",
        "Prepare and review customs documentation for imports and exports",
        "Coordinate with brokers and customs authorities",
        "Monitor regulatory changes and update procedures",
        "Support compliance audits"
      ]
    },
    requirements: {
      es: [
        "1-2 años de experiencia en comercio exterior o aduanas",
        "Conocimiento de regulaciones US Customs & Border Protection",
        "Atención excepcional al detalle",
        "Inglés y español fluido",
        "Licenciatura en Comercio Internacional, Logística o afín"
      ],
      en: [
        "1-2 years of experience in foreign trade or customs",
        "Knowledge of US Customs & Border Protection regulations",
        "Exceptional attention to detail",
        "Fluent English and Spanish",
        "Bachelor's degree in International Commerce, Logistics, or related field"
      ]
    }
  },
  {
    id: 3,
    title: { es: "Ejecutivo de Transporte Terrestre", en: "Ground Transportation Executive" },
    dept: "Operaciones",
    location: "Houston, TX",
    mode: "Presencial",
    level: "Mid-Level",
    salary: "$50,000 — $65,000 USD",
    tags: ["Transporte", "FTL/LTL", "Negociación"],
    description: {
      es: "Gestionarás la red de transporte terrestre, optimizando rutas y relaciones con carriers para entregar confiabilidad y eficiencia a nuestros clientes.",
      en: "You'll manage the ground transportation network, optimizing routes and carrier relationships to deliver reliability and efficiency to our customers."
    },
    responsibilities: {
      es: [
        "Gestionar operaciones de transporte FTL y LTL en EE.UU. y cross-border",
        "Negociar tarifas con carriers y optimizar costos de flete",
        "Monitorear entregas en tiempo real y resolver incidencias",
        "Desarrollar relaciones estratégicas con transportistas",
        "Generar reportes de KPIs operativos"
      ],
      en: [
        "Manage FTL and LTL transportation operations in the US and cross-border",
        "Negotiate rates with carriers and optimize freight costs",
        "Monitor deliveries in real-time and resolve incidents",
        "Develop strategic relationships with carriers",
        "Generate operational KPI reports"
      ]
    },
    requirements: {
      es: [
        "3+ años en gestión de transporte terrestre",
        "Experiencia con TMS y herramientas de tracking",
        "Habilidades de negociación comprobadas",
        "Conocimiento del mercado de carriers en EE.UU.",
        "Inglés fluido"
      ],
      en: [
        "3+ years in ground transportation management",
        "Experience with TMS and tracking tools",
        "Proven negotiation skills",
        "Knowledge of the US carrier market",
        "Fluent English"
      ]
    }
  },
  {
    id: 4,
    title: { es: "Coordinador de Carga Aérea", en: "Air Freight Coordinator" },
    dept: "Operaciones",
    location: "Miami, FL",
    mode: "Presencial",
    level: "Mid-Level",
    salary: "$48,000 — $62,000 USD",
    tags: ["Carga aérea", "IATA", "Urgentes"],
    description: {
      es: "Gestionarás embarques aéreos para clientes que necesitan velocidad y precisión. Desde perecederos hasta carga de alto valor, cada envío es una misión crítica.",
      en: "You'll manage air shipments for clients who need speed and precision. From perishables to high-value cargo, every shipment is a critical mission."
    },
    responsibilities: {
      es: [
        "Coordinar embarques aéreos internacionales de exportación e importación",
        "Negociar espacios y tarifas con aerolíneas",
        "Gestionar documentación HAWB/MAWB y cumplimiento IATA",
        "Resolver incidencias y garantizar entregas on-time",
        "Optimizar consolidaciones y rutas aéreas"
      ],
      en: [
        "Coordinate international air shipments for import and export",
        "Negotiate space and rates with airlines",
        "Manage HAWB/MAWB documentation and IATA compliance",
        "Resolve incidents and ensure on-time deliveries",
        "Optimize consolidations and air routes"
      ]
    },
    requirements: {
      es: [
        "2+ años de experiencia en carga aérea o freight forwarding",
        "Conocimiento de regulaciones IATA y documentación aérea",
        "Capacidad para trabajar bajo presión con envíos urgentes",
        "Inglés avanzado",
        "Orientación al cliente y resolución de problemas"
      ],
      en: [
        "2+ years of experience in air cargo or freight forwarding",
        "Knowledge of IATA regulations and air documentation",
        "Ability to work under pressure with urgent shipments",
        "Advanced English",
        "Customer orientation and problem-solving"
      ]
    }
  },
  {
    id: 5,
    title: { es: "Full Stack Developer", en: "Full Stack Developer" },
    dept: "Corporate",
    location: "Remoto (LATAM)",
    mode: "Remoto",
    level: "Senior",
    salary: "$70,000 — $95,000 USD",
    tags: ["React", "Node.js", "TypeScript", "Cloud"],
    description: {
      es: "Construirás las plataformas tecnológicas que están transformando cómo se mueve la carga globalmente. Stack moderno, equipo colaborativo, impacto directo en el negocio.",
      en: "You'll build the technology platforms transforming how cargo moves globally. Modern stack, collaborative team, direct business impact."
    },
    responsibilities: {
      es: [
        "Diseñar y desarrollar features end-to-end en nuestra plataforma de tracking",
        "Colaborar con Product y UX para entregar experiencias excepcionales",
        "Implementar APIs escalables e integraciones con partners logísticos",
        "Liderar code reviews y mentorear desarrolladores junior",
        "Contribuir a decisiones de arquitectura y stack tecnológico"
      ],
      en: [
        "Design and develop end-to-end features in our tracking platform",
        "Collaborate with Product and UX to deliver exceptional experiences",
        "Implement scalable APIs and integrations with logistics partners",
        "Lead code reviews and mentor junior developers",
        "Contribute to architecture and technology stack decisions"
      ]
    },
    requirements: {
      es: [
        "5+ años de experiencia en desarrollo web full stack",
        "Dominio de React, Node.js, TypeScript",
        "Experiencia con servicios cloud (AWS o GCP)",
        "Familiaridad con CI/CD, testing automatizado y DevOps",
        "Capacidad para trabajar de forma autónoma en un equipo distribuido"
      ],
      en: [
        "5+ years of experience in full stack web development",
        "Mastery of React, Node.js, TypeScript",
        "Experience with cloud services (AWS or GCP)",
        "Familiarity with CI/CD, automated testing, and DevOps",
        "Ability to work autonomously in a distributed team"
      ]
    }
  },
  {
    id: 6,
    title: { es: "Data Analyst", en: "Data Analyst" },
    dept: "Corporate",
    location: "Ciudad de Panamá, Panamá",
    mode: "Híbrido",
    level: "Mid-Level",
    salary: "$45,000 — $60,000 USD",
    tags: ["SQL", "Python", "BI", "Logistics Data"],
    description: {
      es: "Transformarás datos operativos en insights accionables que optimicen rutas, reduzcan costos y mejoren la toma de decisiones en toda la compañía.",
      en: "You'll transform operational data into actionable insights that optimize routes, reduce costs, and improve decision-making across the company."
    },
    responsibilities: {
      es: [
        "Construir dashboards y reportes para equipos de operaciones y liderazgo",
        "Analizar tendencias de volumen, costos y tiempos de tránsito",
        "Desarrollar modelos predictivos para demanda y pricing",
        "Colaborar con equipos de negocio para definir métricas clave",
        "Mantener y optimizar pipelines de datos"
      ],
      en: [
        "Build dashboards and reports for operations and leadership teams",
        "Analyze volume trends, costs, and transit times",
        "Develop predictive models for demand and pricing",
        "Collaborate with business teams to define key metrics",
        "Maintain and optimize data pipelines"
      ]
    },
    requirements: {
      es: [
        "3+ años en análisis de datos o Business Intelligence",
        "SQL avanzado, Python (pandas, numpy)",
        "Experiencia con herramientas de BI (Power BI, Tableau, Looker)",
        "Pensamiento analítico y storytelling con datos",
        "Experiencia en logística o supply chain es un plus"
      ],
      en: [
        "3+ years in data analysis or Business Intelligence",
        "Advanced SQL, Python (pandas, numpy)",
        "Experience with BI tools (Power BI, Tableau, Looker)",
        "Analytical thinking and data storytelling",
        "Experience in logistics or supply chain is a plus"
      ]
    }
  },
  {
    id: 7,
    title: { es: "UX/UI Designer", en: "UX/UI Designer" },
    dept: "Corporate",
    location: "Remoto (Global)",
    mode: "Remoto",
    level: "Mid-Level",
    salary: "$55,000 — $75,000 USD",
    tags: ["Figma", "Design Systems", "User Research"],
    description: {
      es: "Diseñarás experiencias digitales que simplifiquen la complejidad de la logística global. Cada pixel cuenta cuando mueves el mundo.",
      en: "You'll design digital experiences that simplify global logistics complexity. Every pixel counts when you move the world."
    },
    responsibilities: {
      es: [
        "Diseñar interfaces intuitivas para nuestra plataforma de tracking y operaciones",
        "Conducir investigación de usuarios y tests de usabilidad",
        "Mantener y evolucionar el design system",
        "Crear prototipos de alta fidelidad en Figma",
        "Colaborar estrechamente con desarrollo y producto"
      ],
      en: [
        "Design intuitive interfaces for our tracking and operations platform",
        "Conduct user research and usability tests",
        "Maintain and evolve the design system",
        "Create high-fidelity prototypes in Figma",
        "Collaborate closely with development and product"
      ]
    },
    requirements: {
      es: [
        "3+ años de experiencia en UX/UI design para productos digitales",
        "Portfolio demostrando diseño de productos complejos simplificados",
        "Dominio de Figma y herramientas de prototipado",
        "Experiencia con design systems y design tokens",
        "Mentalidad data-driven para decisiones de diseño"
      ],
      en: [
        "3+ years of experience in UX/UI design for digital products",
        "Portfolio demonstrating design of complex products simplified",
        "Mastery of Figma and prototyping tools",
        "Experience with design systems and design tokens",
        "Data-driven mindset for design decisions"
      ]
    }
  },
  {
    id: 8,
    title: { es: "Business Development Manager", en: "Business Development Manager" },
    dept: "Comercial",
    location: "Miami, FL",
    mode: "Híbrido",
    level: "Senior",
    salary: "$80,000 — $110,000 USD",
    tags: ["Ventas B2B", "Logistics Sales", "New Business"],
    description: {
      es: "Expandirás nuestra cartera de clientes conectando empresas con soluciones logísticas que transforman sus operaciones. Hunter mindset, resultados reales.",
      en: "You'll expand our client portfolio by connecting companies with logistics solutions that transform their operations. Hunter mindset, real results."
    },
    responsibilities: {
      es: [
        "Identificar y cerrar oportunidades de negocio con empresas importadoras/exportadoras",
        "Desarrollar propuestas comerciales personalizadas",
        "Gestionar pipeline de ventas y forecasting",
        "Construir relaciones a largo plazo con decision-makers",
        "Representar a Trading Solutions en eventos de industria"
      ],
      en: [
        "Identify and close business opportunities with import/export companies",
        "Develop customized commercial proposals",
        "Manage sales pipeline and forecasting",
        "Build long-term relationships with decision-makers",
        "Represent Trading Solutions at industry events"
      ]
    },
    requirements: {
      es: [
        "5+ años en desarrollo de negocio B2B en logística o freight forwarding",
        "Track record comprobado de cierre de cuentas corporativas",
        "Network en la industria logística de EE.UU. y LATAM",
        "Habilidades excepcionales de presentación y negociación",
        "Inglés y español nativos"
      ],
      en: [
        "5+ years in B2B business development in logistics or freight forwarding",
        "Proven track record of closing corporate accounts",
        "Network in the US and LATAM logistics industry",
        "Exceptional presentation and negotiation skills",
        "Native English and Spanish"
      ]
    }
  },
  {
    id: 9,
    title: { es: "Pricing Analyst", en: "Pricing Analyst" },
    dept: "Comercial",
    location: "Ciudad de Panamá, Panamá",
    mode: "Presencial",
    level: "Junior",
    salary: "$35,000 — $48,000 USD",
    tags: ["Cotizaciones", "Análisis", "Excel avanzado"],
    description: {
      es: "Construirás cotizaciones competitivas que ganan negocios y mantienen márgenes saludables. El puente entre operaciones y el cliente.",
      en: "You'll build competitive quotes that win business and maintain healthy margins. The bridge between operations and the customer."
    },
    responsibilities: {
      es: [
        "Elaborar cotizaciones para servicios marítimos, aéreos y terrestres",
        "Analizar tarifas de mercado y competencia",
        "Mantener base de datos de tarifas actualizada",
        "Coordinar con agentes y partners para obtener mejores rates",
        "Apoyar al equipo comercial con análisis de rentabilidad"
      ],
      en: [
        "Develop quotes for maritime, air, and ground services",
        "Analyze market rates and competition",
        "Maintain updated rate database",
        "Coordinate with agents and partners for better rates",
        "Support the commercial team with profitability analysis"
      ]
    },
    requirements: {
      es: [
        "1-2 años de experiencia en pricing logístico o freight forwarding",
        "Excel avanzado (tablas dinámicas, fórmulas complejas)",
        "Perfil numérico y orientado al detalle",
        "Inglés intermedio-avanzado",
        "Capacidad para trabajar bajo presión con múltiples solicitudes"
      ],
      en: [
        "1-2 years of experience in logistics pricing or freight forwarding",
        "Advanced Excel (pivot tables, complex formulas)",
        "Numerical profile and detail-oriented",
        "Intermediate-advanced English",
        "Ability to work under pressure with multiple requests"
      ]
    }
  },
  {
    id: 10,
    title: { es: "People & Culture Specialist", en: "People & Culture Specialist" },
    dept: "People",
    location: "Ciudad de Panamá, Panamá",
    mode: "Híbrido",
    level: "Mid-Level",
    salary: "$40,000 — $55,000 USD",
    tags: ["HR", "Cultura", "Talent", "Engagement"],
    description: {
      es: "Serás arquitecto/a de la experiencia del empleado, diseñando programas que hagan de Trading Solutions un lugar donde el talento excepcional quiere estar.",
      en: "You'll be the architect of the employee experience, designing programs that make Trading Solutions a place where exceptional talent wants to be."
    },
    responsibilities: {
      es: [
        "Diseñar e implementar iniciativas de cultura y engagement",
        "Gestionar programas de onboarding y desarrollo",
        "Coordinar evaluaciones de desempeño y career paths",
        "Analizar métricas de People y proponer mejoras",
        "Liderar proyectos de bienestar y wellness"
      ],
      en: [
        "Design and implement culture and engagement initiatives",
        "Manage onboarding and development programs",
        "Coordinate performance evaluations and career paths",
        "Analyze People metrics and propose improvements",
        "Lead wellness and well-being projects"
      ]
    },
    requirements: {
      es: [
        "3+ años de experiencia en HR o People Operations",
        "Experiencia diseñando programas de cultura organizacional",
        "Conocimiento de herramientas de HR Tech",
        "Inglés y español fluido",
        "Pasión por crear experiencias excepcionales para empleados"
      ],
      en: [
        "3+ years of experience in HR or People Operations",
        "Experience designing organizational culture programs",
        "Knowledge of HR Tech tools",
        "Fluent English and Spanish",
        "Passion for creating exceptional employee experiences"
      ]
    }
  },
  {
    id: 11,
    title: { es: "Accounting Associate", en: "Accounting Associate" },
    dept: "Finanzas",
    location: "Miami, FL",
    mode: "Presencial",
    level: "Junior",
    salary: "$40,000 — $52,000 USD",
    tags: ["Contabilidad", "AP/AR", "ERP"],
    description: {
      es: "Mantendrás los números que sostienen nuestra operación global. Precisión, velocidad y una mentalidad de mejora continua.",
      en: "You'll maintain the numbers that support our global operations. Precision, speed, and a continuous improvement mindset."
    },
    responsibilities: {
      es: [
        "Gestionar cuentas por pagar y por cobrar",
        "Realizar conciliaciones bancarias y contables",
        "Procesar facturas y pagos a proveedores internacionales",
        "Apoyar cierres mensuales y reportes financieros",
        "Colaborar con el equipo de operaciones en facturación"
      ],
      en: [
        "Manage accounts payable and accounts receivable",
        "Perform bank and accounting reconciliations",
        "Process invoices and payments to international vendors",
        "Support monthly closings and financial reports",
        "Collaborate with the operations team on billing"
      ]
    },
    requirements: {
      es: [
        "1-3 años de experiencia en contabilidad",
        "Conocimiento de US GAAP",
        "Experiencia con ERP (SAP, Oracle, NetSuite o similar)",
        "Excel avanzado",
        "Inglés fluido"
      ],
      en: [
        "1-3 years of experience in accounting",
        "Knowledge of US GAAP",
        "Experience with ERP (SAP, Oracle, NetSuite, or similar)",
        "Advanced Excel",
        "Fluent English"
      ]
    }
  }
];
