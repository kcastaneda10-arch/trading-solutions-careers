export type Locale = "es" | "en";

export const translations = {
  es: {
    nav: { culture: "Cultura", areas: "Ãreas", experience: "Experiencia", viewJobs: "Ver vacantes" },
    hero: {
      tag: "Trading Solutions Careers",
      title: "Tu prÃ³ximo capÃ­tulo\nempieza aquÃ­.",
      subtitle: "Somos un boutique freight forwarder con operaciÃ³n en mÃ¡s de 10 paÃ­ses. Buscamos personas curiosas, comprometidas y con ganas de crecer junto a nosotros.",
      cta: "Explorar oportunidades",
      ctaSecondary: "Conoce nuestra cultura"
    },
    stats: {
      countries: { value: "+10", label: "PaÃ­ses en operaciÃ³n" },
      clients: { value: "+300", label: "Clientes activos" },
      teus: { value: "+52k", label: "TEUs marÃ­timos" },
      tons: { value: "+500", label: "Tons Air & Land" }
    },
    culture: {
      tag: "Mentalidad de crecimiento",
      title: "AquÃ­ no vienes a ocupar un puesto.\nVienes a construir tu futuro.",
      subtitle: "En Trading Solutions creemos que el talento excepcional florece cuando se le da espacio para crecer, libertad para proponer y un entorno donde cada persona puede desafiar el status quo.",
      cards: [
        { title: "Crecimiento acelerado", desc: "Tu carrera se acelera con exposiciÃ³n internacional, proyectos de alto impacto y lÃ­deres que invierten en tu desarrollo. AquÃ­ el techo lo pones tÃº." },
        { title: "Alcance internacional", desc: "Operamos en mÃ¡s de 10 paÃ­ses con servicios marÃ­timos, terrestres, aÃ©reos y aduaneros. Cada dÃ­a es una oportunidad de resolver desafÃ­os logÃ­sticos reales." },
        { title: "Cultura de expansiÃ³n", desc: "Cada idea tiene espacio. Cada voz importa. Construimos un entorno donde la curiosidad se premia, la innovaciÃ³n se celebra y los lÃ­mites se desafÃ­an." }
      ],
      blackBlock: {
        title: "Creemos en las personas que quieren mÃ¡s.",
        desc: "MÃ¡s impacto. MÃ¡s aprendizaje. MÃ¡s libertad. Si buscas un lugar donde tu energÃ­a se convierte en resultados reales y tu crecimiento profesional no tiene techo â este es tu lugar.",
        maritime: "Maritime",
        maritimeSub: "Ground, Air & Customs",
        countriesLabel: "PaÃ­ses en operaciÃ³n",
        teusLabel: "TEUs marÃ­timos gestionados",
        tonsLabel: "Tons Air & Land"
      }
    },
    departments: {
      tag: "Ãreas",
      title: "Encuentra tu espacio.",
      ops: { name: "Operaciones", count: "4 posiciones abiertas" },
      corporate: { name: "Corporate", count: "3 posiciones abiertas" },
      commercial: { name: "Comercial", count: "2 posiciones abiertas" }
    },
    experience: {
      tag: "La experiencia",
      title: "Contratamos talento excepcional. AsÃ­ se siente ser parte del proceso.",
      steps: [
        { num: "01", label: "Descubrimiento", title: "Nos encuentras. Te intrigamos.", desc: "Exploras nuestras oportunidades y algo conecta. No es solo un trabajo â es la posibilidad de hacer algo que importa en una escala internacional." },
        { num: "02", label: "ConversaciÃ³n", title: "No es una entrevista. Es un diÃ¡logo.", desc: "Queremos conocer quiÃ©n eres de verdad â tu curiosidad, tus ideas, tu forma de pensar. TÃº tambiÃ©n nos conoces a nosotros. Es un match de dos vÃ­as." },
        { num: "03", label: "InmersiÃ³n", title: "MuÃ©stranos cÃ³mo piensas.", desc: "Un reto real del negocio. Sin respuestas correctas. Queremos ver tu proceso, tu creatividad y cÃ³mo abordas lo desconocido." },
        { num: "04", label: "Bienvenida", title: "Empieza algo extraordinario.", desc: "Desde el dÃ­a uno, tienes mentor, equipo y acceso a un programa de onboarding diseÃ±ado para que despegues rÃ¡pido y con confianza." }
      ],
      cta: "Explorar vacantes abiertas"
    },
    benefits: {
      tag: "Lo que te espera",
      title: "DiseÃ±ado para que crezcas.",
      items: [
        { title: "Aprendizaje continuo", desc: "Presupuesto anual para formaciÃ³n, certificaciones y conferencias" },
        { title: "Experiencia internacional", desc: "Proyectos cross-country y oportunidad de asignaciones internacionales" },
        { title: "Bienestar integral", desc: "Programas de wellness, salud mental, flexibilidad y balance real" },
        { title: "Reconocimiento", desc: "Tu impacto se ve. CompensaciÃ³n competitiva y crecimiento acelerado" }
      ]
    },
    cta: {
      title: "Â¿Listo para lo que viene?",
      subtitle: "Las mejores historias profesionales empiezan con una decisiÃ³n valiente. Esta podrÃ­a ser la tuya.",
      button: "Ver todas las vacantes"
    },
    footer: {
      tagline: "Boutique freight forwarder. Movemos lo que importa, con precisiÃ³n y propÃ³sito.",
      services: "Servicios",
      company: "CompaÃ±Ã­a",
      companyAbout: "Nosotros",
      companyCareers: "Carreras",
      companyContact: "Contacto",
      followUs: "SÃ­guenos",
      legal: "Legal",
      privacy: "Privacidad",
      rights: "Todos los derechos reservados."
    },
    jobs: {
      pageTitle: "Vacantes abiertas",
      pageSubtitle: "Encuentra el rol que conecta con tu ambiciÃ³n.",
      backHome: "Volver al inicio",
      searchPlaceholder: "Buscar por tÃ­tulo, Ã¡rea o habilidad...",
      deptLabel: "Departamento:",
      modeLabel: "Modalidad:",
      all: "Todos",
      allFem: "Todas",
      resultsSingular: "posiciÃ³n encontrada",
      resultsPlural: "posiciones encontradas",
      clearFilters: "Limpiar filtros",
      noResults: "No encontramos vacantes con esos filtros.",
      backToJobs: "Todas las vacantes",
      notFound: "Vacante no encontrada",
      viewAll: "Ver todas las vacantes",
      whatYouDo: "Lo que harÃ¡s",
      whatWeSeek: "Lo que buscamos",
      applyBtn: "Aplicar a esta posiciÃ³n",
      applyTo: "Aplicar a",
      fullName: "Nombre completo",
      fullNamePlaceholder: "Tu nombre",
      email: "Email",
      emailPlaceholder: "tu@email.com",
      phone: "TelÃ©fono",
      phonePlaceholder: "+1 (555) 000-0000",
      linkedin: "LinkedIn",
      linkedinPlaceholder: "https://linkedin.com/in/tu-perfil",
      cvLabel: "CV / RÃ©sumÃ©",
      cvDrag: "Arrastra tu CV o",
      cvSelect: "selecciona un archivo",
      cvFormats: "PDF, DOC o DOCX (mÃ¡x. 10 MB)",
      whyTs: "Â¿Por quÃ© Trading Solutions?",
      whyTsPlaceholder: "CuÃ©ntanos quÃ© te motiva y quÃ© te harÃ­a excepcional en este rol...",
      submit: "Enviar aplicaciÃ³n",
      cancel: "Cancelar",
      successTitle: "AplicaciÃ³n enviada",
      successMsg: "Gracias por tu interÃ©s en Trading Solutions. Nuestro equipo revisarÃ¡ tu perfil y te contactaremos pronto.",
      backToJobsBtn: "Volver a vacantes"
    },
    deptNames: {
      Operaciones: "Operaciones",
      Corporate: "Corporate",
      Comercial: "Comercial",
      People: "People",
      Finanzas: "Finanzas"
    },
    modeNames: {
      Presencial: "Presencial",
      "HÃ­brido": "HÃ­brido",
      Remoto: "Remoto"
    }
  },
  en: {
    nav: { culture: "Culture", areas: "Areas", experience: "Experience", viewJobs: "View openings" },
    hero: {
      tag: "Trading Solutions Careers",
      title: "Your next chapter\nstarts here.",
      subtitle: "We are a boutique freight forwarder with operations in over 10 countries. We look for curious, committed people eager to grow with us.",
      cta: "Explore opportunities",
      ctaSecondary: "Learn about our culture"
    },
    stats: {
      countries: { value: "+10", label: "Countries of operation" },
      clients: { value: "+300", label: "Active clients" },
      teus: { value: "+52k", label: "Maritime TEUs" },
      tons: { value: "+500", label: "Tons Air & Land" }
    },
    culture: {
      tag: "Growth mindset",
      title: "You're not here to fill a role.\nYou're here to build your future.",
      subtitle: "At Trading Solutions we believe exceptional talent thrives when given room to grow, freedom to propose, and an environment where everyone can challenge the status quo.",
      cards: [
        { title: "Accelerated growth", desc: "Your career takes off with international exposure, high-impact projects, and leaders who invest in your development. Here, you set your own ceiling." },
        { title: "Global reach", desc: "We operate in over 10 countries with maritime, ground, air, and customs services. Every day is an opportunity to solve real logistics challenges." },
        { title: "Culture of expansion", desc: "Every idea has space. Every voice matters. We build an environment where curiosity is rewarded, innovation is celebrated, and limits are challenged." }
      ],
      blackBlock: {
        title: "We believe in people who want more.",
        desc: "More impact. More learning. More freedom. If you're looking for a place where your energy turns into real results and your professional growth knows no ceiling â this is your place.",
        maritime: "Maritime",
        maritimeSub: "Ground, Air & Customs",
        countriesLabel: "Countries of operation",
        teusLabel: "Maritime TEUs handled",
        tonsLabel: "Tons Air & Land"
      }
    },
    departments: {
      tag: "Areas",
      title: "Find your space.",
      ops: { name: "Operations", count: "4 open positions" },
      corporate: { name: "Corporate", count: "3 open positions" },
      commercial: { name: "Commercial", count: "2 open positions" }
    },
    experience: {
      tag: "The experience",
      title: "We hire exceptional talent. This is what being part of the process feels like.",
      steps: [
        { num: "01", label: "Discovery", title: "You find us. We intrigue you.", desc: "You explore our opportunities and something clicks. It's not just a job â it's the chance to do something that matters on an international scale." },
        { num: "02", label: "Conversation", title: "It's not an interview. It's a dialogue.", desc: "We want to meet the real you â your curiosity, your ideas, your way of thinking. You also get to know us. It's a two-way match." },
        { num: "03", label: "Immersion", title: "Show us how you think.", desc: "A real business challenge. No right answers. We want to see your process, your creativity, and how you approach the unknown." },
        { num: "04", label: "Welcome", title: "Start something extraordinary.", desc: "From day one, you have a mentor, a team, and access to an onboarding program designed to help you take off quickly and confidently." }
      ],
      cta: "Explore open positions"
    },
    benefits: {
      tag: "What awaits you",
      title: "Designed for your growth.",
      items: [
        { title: "Continuous learning", desc: "Annual budget for training, certifications, and conferences" },
        { title: "International experience", desc: "Cross-country projects and international assignment opportunities" },
        { title: "Holistic well-being", desc: "Wellness programs, mental health support, flexibility, and real balance" },
        { title: "Recognition", desc: "Your impact is visible. Competitive compensation and accelerated growth" }
      ]
    },
    cta: {
      title: "Ready for what's next?",
      subtitle: "The best professional stories begin with a bold decision. This could be yours.",
      button: "View all openings"
    },
    footer: {
      tagline: "Boutique freight forwarder. We move what matters, with precision and purpose.",
      services: "Services",
      company: "Company",
      companyAbout: "About",
      companyCareers: "Careers",
      companyContact: "Contact",
      followUs: "Follow us",
      legal: "Legal",
      privacy: "Privacy",
      rights: "All rights reserved."
    },
    jobs: {
      pageTitle: "Open positions",
      pageSubtitle: "Find the role that matches your ambition.",
      backHome: "Back to home",
      searchPlaceholder: "Search by title, area, or skill...",
      deptLabel: "Department:",
      modeLabel: "Work mode:",
      all: "All",
      allFem: "All",
      resultsSingular: "position found",
      resultsPlural: "positions found",
      clearFilters: "Clear filters",
      noResults: "No openings match those filters.",
      backToJobs: "All openings",
      notFound: "Position not found",
      viewAll: "View all openings",
      whatYouDo: "What you'll do",
      whatWeSeek: "What we're looking for",
      applyBtn: "Apply for this position",
      applyTo: "Apply for",
      fullName: "Full name",
      fullNamePlaceholder: "Your name",
      email: "Email",
      emailPlaceholder: "you@email.com",
      phone: "Phone",
      phonePlaceholder: "+1 (555) 000-0000",
      linkedin: "LinkedIn",
      linkedinPlaceholder: "https://linkedin.com/in/your-profile",
      cvLabel: "CV / RÃ©sumÃ©",
      cvDrag: "Drag your CV or",
      cvSelect: "select a file",
      cvFormats: "PDF, DOC, or DOCX (max. 10 MB)",
      whyTs: "Why Trading Solutions?",
      whyTsPlaceholder: "Tell us what motivates you and what would make you exceptional in this role...",
      submit: "Submit application",
      cancel: "Cancel",
      successTitle: "Application submitted",
      successMsg: "Thank you for your interest in Trading Solutions. Our team will review your profile and contact you soon.",
      backToJobsBtn: "Back to openings"
    },
    deptNames: {
      Operaciones: "Operations",
      Corporate: "Corporate",
      Comercial: "Commercial",
      People: "People",
      Finanzas: "Finance"
    },
    modeNames: {
      Presencial: "On-site",
      "HÃ­brido": "Hybrid",
      Remoto: "Remote"
    }
  }
};

// Deep writable type that converts readonly string literals to string
type DeepWritable<T> = {
  -readonly [K in keyof T]: T[K] extends ReadonlyArray<infer U>
    ? DeepWritable<U>[]
    : T[K] extends string
    ? string
    : T[K] extends object
    ? DeepWritable<T[K]>
    : T[K];
};

export type Translations = DeepWritable<typeof translations.es>;
