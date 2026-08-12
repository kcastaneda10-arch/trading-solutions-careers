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

export const departments = ["Comercial", "Operaciones", "Talento", "Finanzas", "Tecnología"] as const;
export const modes = ["Presencial", "Híbrido", "Remoto"] as const;

/**
 * VACANTES ABIERTAS — Trading Solutions Barranquilla
 * Última actualización: 14 mayo 2026
 * Postulación: vía formulario en la página de cada vacante.
 */
export const jobs: Job[] = [
  {
    id: 6,
    slug: "full-stack-developer",
    linkedinUrl: "https://www.linkedin.com/company/trading-solutions/jobs/",
    title: { es: "Full Stack Developer (Mid-Level)", en: "Full Stack Developer (Mid-Level)" },
    dept: "Tecnología",
    location: "Barranquilla, Atlántico, Colombia",
    mode: "Presencial",
    level: "Mid-Level",
    salary: "Competitivo según experiencia",
    tags: ["React", "Next.js", "Node.js", "TypeScript", "APIs REST", "Full Stack", "Inglés"],
    description: {
      es: "Únete al equipo de Producto & Tecnología de Trading Solutions y ayúdanos a construir All Heritage Freight, la plataforma que redefine la experiencia logística. Buscamos un Full Stack Developer (Mid-Level) con mínimo 4 años de experiencia, mentalidad de producto y foco en calidad de código, para diseñar, desarrollar e implementar nuevas funcionalidades de punta a punta (frontend y backend).",
      en: "Join Trading Solutions' Product & Technology team and help us build All Heritage Freight, the platform redefining the logistics experience. We're looking for a Mid-Level Full Stack Developer with 4+ years of experience, a product mindset and a focus on code quality, to design, develop and ship new end-to-end features (frontend and backend).",
    },
    responsibilities: {
      es: ["Desarrollar nuevas funcionalidades tanto en Frontend como Backend","Diseñar e implementar APIs seguras, escalables y mantenibles","Integrar servicios internos y plataformas de terceros","Participar en el diseño técnico y la evolución de la arquitectura de nuestros productos","Colaborar con Product Owners y UX Designers para transformar requerimientos en soluciones funcionales","Optimizar el rendimiento, la seguridad y la escalabilidad de las aplicaciones","Garantizar buenas prácticas de desarrollo, testing y documentación","Participar en code reviews, planeaciones técnicas y ceremonias Agile"],
      en: ["Develop new features across both Frontend and Backend","Design and implement secure, scalable and maintainable APIs","Integrate internal services and third-party platforms","Contribute to the technical design and evolution of our product architecture","Collaborate with Product Owners and UX Designers to turn requirements into working solutions","Optimize application performance, security and scalability","Ensure good development, testing and documentation practices","Take part in code reviews, technical planning and Agile ceremonies"],
    },
    requirements: {
      es: ["4 o más años de experiencia como Full Stack Developer","Experiencia sólida con JavaScript y TypeScript","Dominio de React y/o Next.js","Experiencia desarrollando APIs con Node.js","Conocimiento de bases de datos relacionales y NoSQL","Experiencia consumiendo e integrando APIs REST; manejo de Git y flujos colaborativos","Experiencia trabajando bajo metodologías Agile (Scrum o Kanban)","Inglés (requerido)","Preferible: experiencia en logística/freight forwarding o Fintech; cloud (AWS, Azure o GCP), Docker y CI/CD"],
      en: ["4+ years of experience as a Full Stack Developer","Solid experience with JavaScript and TypeScript","Proficiency in React and/or Next.js","Experience building APIs with Node.js","Knowledge of relational and NoSQL databases","Experience consuming and integrating REST APIs; Git and collaborative workflows","Experience working under Agile methodologies (Scrum or Kanban)","English (required)","Preferred: experience in logistics/freight forwarding or Fintech; cloud (AWS, Azure or GCP), Docker and CI/CD"],
    },
    applyEmail: "jointheteam@tradingsolutions.com",
    postedAt: "2026-08-11",
  },
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
    id: 6,
    slug: "china-customer-documentation",
    linkedinUrl: "",
    title: {
      es: "Customer Documentation and Support",
      en: "Customer Documentation and Support",
    },
    dept: "Finanzas",
    location: "Shanghai / Shenzhen / Guangzhou, China",
    mode: "Presencial",
    level: "Junior",
    salary: "A convenir",
    tags: ["China", "Finance", "Documentation", "Freight Forwarding", "Builder Team"],
    description: {
      es: `📢 We're building our Builder Team in China! Looking for a Customer Documentation & Support professional to be the administrative and financial backbone of our expansion across Asia.

At Trading Solutions, we're redefining the future of global logistics by merging cutting-edge technology, real-time visibility, and seamless coordination across continents. We want someone who wants to build, not just operate.

The Role: You will be the bridge between our Commercial, Operations, Pricing, and Finance teams — making sure every shipment has its complete financial and logistical "resume," and that billing flows without friction.`,
      en: `📢 We're building our Builder Team in China! Looking for a Customer Documentation & Support professional to be the administrative and financial backbone of our expansion across Asia.

At Trading Solutions, we're redefining the future of global logistics by merging cutting-edge technology, real-time visibility, and seamless coordination across continents. We want someone who wants to build, not just operate.

The Role: You will be the bridge between our Commercial, Operations, Pricing, and Finance teams — making sure every shipment has its complete financial and logistical "resume," and that billing flows without friction.`,
    },
    responsibilities: {
      es: [
        "Verify and register received and issued invoices, making sure they match contracts and purchase orders",
        "Consolidate costs, sales, and profitability by client or service, flagging risks along the way",
        "Register and update rates on the Federal Maritime Commission platform",
        "Handle the physical onboarding of new team members and keep the workspace (WeWork) organized",
        "Provide cross-functional support across Sales, Operations, and Procurement during this fast-paced launch phase",
        "Keep records organized with proper digital backups and report any inconsistencies to your supervisor",
      ],
      en: [
        "Verify and register received and issued invoices, making sure they match contracts and purchase orders",
        "Consolidate costs, sales, and profitability by client or service, flagging risks along the way",
        "Register and update rates on the Federal Maritime Commission platform",
        "Handle the physical onboarding of new team members and keep the workspace (WeWork) organized",
        "Provide cross-functional support across Sales, Operations, and Procurement during this fast-paced launch phase",
        "Keep records organized with proper digital backups and report any inconsistencies to your supervisor",
      ],
    },
    requirements: {
      es: [
        "Professional or technologist degree in Foreign Trade, International Business, Administration, or related fields",
        "Advanced English (B2-C1)",
        "1 to 2 years of experience in document management",
      ],
      en: [
        "Professional or technologist degree in Foreign Trade, International Business, Administration, or related fields",
        "Advanced English (B2-C1)",
        "1 to 2 years of experience in document management",
      ],
    },
    applyEmail: "jointheteam@tradingsolutions.com",
    postedAt: "2026-07-29",
  },
  {
    id: 7,
    slug: "china-operations-executive",
    linkedinUrl: "",
    title: {
      es: "Operations Executive and Support",
      en: "Operations Executive and Support",
    },
    dept: "Operaciones",
    location: "Shanghai / Shenzhen / Guangzhou, China",
    mode: "Presencial",
    level: "Junior",
    salary: "A convenir",
    tags: ["China", "Operations", "Freight Forwarding", "Track and Trace", "Builder Team"],
    description: {
      es: `📢 We're building our Builder Team in China! Looking for an Operations Executive & Support professional to keep our shipments moving flawlessly across Asia.

At Trading Solutions, we're redefining the future of global logistics by merging cutting-edge technology, real-time visibility, and seamless coordination across continents. We want someone who wants to build, not just operate.

The Role: You will own end-to-end shipment execution — coordinating bookings, suppliers, and logistics partners, and solving operational challenges so every client gets an on-time, on-spec experience.`,
      en: `📢 We're building our Builder Team in China! Looking for an Operations Executive & Support professional to keep our shipments moving flawlessly across Asia.

At Trading Solutions, we're redefining the future of global logistics by merging cutting-edge technology, real-time visibility, and seamless coordination across continents. We want someone who wants to build, not just operate.

The Role: You will own end-to-end shipment execution — coordinating bookings, suppliers, and logistics partners, and solving operational challenges so every client gets an on-time, on-spec experience.`,
    },
    responsibilities: {
      es: [
        "Execute bookings per client and assignment instructions, ensuring confirmations land within SLA",
        "Coordinate cargo with shipping lines, airlines, customs agents, and warehouses, keeping full traceability",
        "Keep Track & Trace data accurate and proactively flag delays or schedule changes",
        "Prepare and review HBL/MBL, handle Switch BL, and submit AMS/ISF to U.S. Customs",
        "Transmit House/Master BLs to customs portals and coordinate smooth clearance",
        "Provide cross-functional support across Pricing and Sales during this fast-paced launch phase",
      ],
      en: [
        "Execute bookings per client and assignment instructions, ensuring confirmations land within SLA",
        "Coordinate cargo with shipping lines, airlines, customs agents, and warehouses, keeping full traceability",
        "Keep Track & Trace data accurate and proactively flag delays or schedule changes",
        "Prepare and review HBL/MBL, handle Switch BL, and submit AMS/ISF to U.S. Customs",
        "Transmit House/Master BLs to customs portals and coordinate smooth clearance",
        "Provide cross-functional support across Pricing and Sales during this fast-paced launch phase",
      ],
    },
    requirements: {
      es: [
        "Bachelor's degree in International Trade, Logistics, Foreign Trade, Business Administration, or related fields",
        "Advanced, conversational English",
        "1 to 2 years of experience in logistics operations or freight forwarding",
        "Knowledge of logistics platforms and shipping-company portals",
      ],
      en: [
        "Bachelor's degree in International Trade, Logistics, Foreign Trade, Business Administration, or related fields",
        "Advanced, conversational English",
        "1 to 2 years of experience in logistics operations or freight forwarding",
        "Knowledge of logistics platforms and shipping-company portals",
      ],
    },
    applyEmail: "jointheteam@tradingsolutions.com",
    postedAt: "2026-07-29",
  },
  {
    id: 8,
    slug: "china-overseas-sales-executive",
    linkedinUrl: "",
    title: {
      es: "Overseas Sales Executive and Support",
      en: "Overseas Sales Executive and Support",
    },
    dept: "Comercial",
    location: "Shanghai / Shenzhen / Guangzhou, China",
    mode: "Presencial",
    level: "Senior",
    salary: "A convenir",
    tags: ["China", "Commercial", "Sales", "Agent Network", "Freight Forwarding", "Builder Team"],
    description: {
      es: `📢 We're building our Builder Team in China! Looking for an Overseas Sales Executive to open new markets and drive our commercial expansion across Asia.

At Trading Solutions, we're redefining the future of global logistics by merging cutting-edge technology, real-time visibility, and seamless coordination across continents. We want someone who wants to build, not just operate.

The Role: You will drive the end-to-end sales pipeline — from prospecting to closing — developing overseas agents and direct clients and connecting our local team with the global network.`,
      en: `📢 We're building our Builder Team in China! Looking for an Overseas Sales Executive to open new markets and drive our commercial expansion across Asia.

At Trading Solutions, we're redefining the future of global logistics by merging cutting-edge technology, real-time visibility, and seamless coordination across continents. We want someone who wants to build, not just operate.

The Role: You will drive the end-to-end sales pipeline — from prospecting to closing — developing overseas agents and direct clients and connecting our local team with the global network.`,
    },
    responsibilities: {
      es: [
        "Develop and follow up on overseas agents and direct clients, promoting our routes and services",
        "Prepare competitive quotes (FCL/LCL/Air), coordinating with pricing and operations",
        "Meet weekly KPIs and keep the CRM impeccable, with clear pipeline reports and forecasts",
        "Hit monthly and quarterly targets for agent acquisition, revenue, and account expansion",
        "Provide cross-functional support across Pricing, Procurement, and Operations",
        "Travel to visit agents, clients, and industry events as the business needs",
      ],
      en: [
        "Develop and follow up on overseas agents and direct clients, promoting our routes and services",
        "Prepare competitive quotes (FCL/LCL/Air), coordinating with pricing and operations",
        "Meet weekly KPIs and keep the CRM impeccable, with clear pipeline reports and forecasts",
        "Hit monthly and quarterly targets for agent acquisition, revenue, and account expansion",
        "Provide cross-functional support across Pricing, Procurement, and Operations",
        "Travel to visit agents, clients, and industry events as the business needs",
      ],
    },
    requirements: {
      es: [
        "Associate's or Bachelor's degree in International Trade, International Business, Logistics, or related fields",
        "Fluent, conversational English",
        "3+ years of experience in Freight Forwarding",
        "Proven experience developing overseas agents and selling ocean freight (FCL/LCL) to Latin America",
      ],
      en: [
        "Associate's or Bachelor's degree in International Trade, International Business, Logistics, or related fields",
        "Fluent, conversational English",
        "3+ years of experience in Freight Forwarding",
        "Proven experience developing overseas agents and selling ocean freight (FCL/LCL) to Latin America",
      ],
    },
    applyEmail: "jointheteam@tradingsolutions.com",
    postedAt: "2026-07-29",
  },
  {
    id: 9,
    slug: "china-pricing-executive",
    linkedinUrl: "",
    title: {
      es: "Pricing Executive - Support",
      en: "Pricing Executive - Support",
    },
    dept: "Pricing",
    location: "Shanghai / Shenzhen / Guangzhou, China",
    mode: "Presencial",
    level: "Junior",
    salary: "A convenir",
    tags: ["China", "Pricing", "Rates", "Freight Forwarding", "Builder Team"],
    description: {
      es: `📢 We're building our Builder Team in China! Looking for a Pricing Executive to shape our pricing strategy and rate management across Asia–LATAM trade.

At Trading Solutions, we're redefining the future of global logistics by merging cutting-edge technology, real-time visibility, and seamless coordination across continents. We want someone who wants to build, not just operate.

The Role: You will develop pricing strategies, manage rates with carriers and agents, and turn market insight into profitable business between Asia and Latin America.`,
      en: `📢 We're building our Builder Team in China! Looking for a Pricing Executive to shape our pricing strategy and rate management across Asia–LATAM trade.

At Trading Solutions, we're redefining the future of global logistics by merging cutting-edge technology, real-time visibility, and seamless coordination across continents. We want someone who wants to build, not just operate.

The Role: You will develop pricing strategies, manage rates with carriers and agents, and turn market insight into profitable business between Asia and Latin America.`,
    },
    responsibilities: {
      es: [
        "Update and register FCL/LCL/air rates, keeping them valid per quarter with full traceability",
        "Request and confirm rates with carriers, airlines, and agents, and coordinate with Sales",
        "Resolve rate/charge discrepancies and run consistency checks between quotes and final costs",
        "Identify cost-saving opportunities and support profitability analysis of suppliers and routes",
        "Improve quotation templates and processes for efficiency",
        "Provide operational and sales support during this fast-paced launch phase (potential sales commission)",
      ],
      en: [
        "Update and register FCL/LCL/air rates, keeping them valid per quarter with full traceability",
        "Request and confirm rates with carriers, airlines, and agents, and coordinate with Sales",
        "Resolve rate/charge discrepancies and run consistency checks between quotes and final costs",
        "Identify cost-saving opportunities and support profitability analysis of suppliers and routes",
        "Improve quotation templates and processes for efficiency",
        "Provide operational and sales support during this fast-paced launch phase (potential sales commission)",
      ],
    },
    requirements: {
      es: [
        "Bachelor's degree in International Trade, Logistics, Foreign Trade, Business Administration, or related fields",
        "Advanced English",
        "1 to 2 years of experience in logistics, freight forwarding, or international trade",
        "Knowledge of logistics platforms and shipping-company portals",
      ],
      en: [
        "Bachelor's degree in International Trade, Logistics, Foreign Trade, Business Administration, or related fields",
        "Advanced English",
        "1 to 2 years of experience in logistics, freight forwarding, or international trade",
        "Knowledge of logistics platforms and shipping-company portals",
      ],
    },
    applyEmail: "jointheteam@tradingsolutions.com",
    postedAt: "2026-07-29",
  },
]
