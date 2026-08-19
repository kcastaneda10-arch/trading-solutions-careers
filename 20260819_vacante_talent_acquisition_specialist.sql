-- ============================================================================
-- Vacante: Talent Acquisition Specialist  ·  Wellness  ·  Barranquilla
-- Creado: 19-ago-2026
--
-- ATENCION: son DOS bases de datos distintas. No se sincronizan solas.
--   PARTE A -> Neon      (tabla `vacancies`)    = pagina publica /vacantes
--   PARTE B -> Supabase  (tabla `ht_vacancies`) = ATS / funnel interno
-- Correr las dos. Si solo se corre A, la vacante se ve pero las aplicaciones
-- no entran al funnel. Si solo se corre B, el funnel existe pero nadie la ve.
-- ============================================================================


-- ============================================================================
-- PARTE A · NEON  (SQL Editor de Neon, base del career site)
-- ============================================================================

INSERT INTO vacancies (
  title, title_es, title_en,
  department, location, work_mode, employment_type,
  level, salary_range, status, slug, apply_email, posted_at, tags,
  description_es, description_en,
  responsibilities_es, responsibilities_en,
  requirements_es, requirements_en
) VALUES (
  'Talent Acquisition Specialist',
  'Talent Acquisition Specialist',
  'Talent Acquisition Specialist',
  'Wellness',
  'Barranquilla, Atlántico, Colombia',
  'Presencial',
  'Término indefinido',
  'Mid-Level',
  NULL,                       -- <<< PENDIENTE: banda salarial
  'open',
  'talent-acquisition-specialist',
  'jointheteam@tradingsolutions.com',
  '2026-08-19',
  'Selección, Psicometría, Entrevista por competencias, ATS, Bilingüe EN/ES',

  'Trading Solutions es una compañía de logística internacional. Movemos carga entre continentes y, para sostener ese crecimiento, necesitamos elegir bien a las personas que lo hacen posible.

Buscamos un Talent Acquisition Specialist: un profesional en Psicología que lidere nuestros procesos de selección end to end y que evalúe con rigor técnico. No buscamos a alguien que coordine agendas: buscamos criterio.',

  'Trading Solutions is an international logistics company. We move cargo across continents, and sustaining that growth depends on choosing the right people.

We are hiring a Talent Acquisition Specialist: a psychologist who owns our hiring processes end to end and assesses with technical rigour. We are not looking for someone to coordinate calendars - we are looking for judgment.',

  '["Levantar el perfil con el líder solicitante antes de publicar y definir la estrategia de búsqueda de cada vacante",
    "Ejecutar sourcing activo y headhunting en LinkedIn, portales de empleo, bases propias, referidos y alianzas académicas",
    "Conducir entrevistas por competencias (metodología STAR/BEI) en español e inglés",
    "Aplicar, calificar e interpretar la batería psicométrica corporativa y elaborar informes de evaluación dirigidos al líder de negocio",
    "Construir y sustentar la terna de finalistas con evidencia y una recomendación técnica",
    "Verificar referencias y coordinar los pasos de la etapa de contratación con el equipo de People Ops",
    "Mantener la trazabilidad del proceso en el ATS y reportar los indicadores de selección"]'::jsonb,

  '["Run role intake with the hiring leader before publishing, and define the search strategy for each opening",
    "Execute active sourcing and headhunting across LinkedIn, job boards, internal databases, referrals and academic partnerships",
    "Conduct competency-based interviews (STAR/BEI) in Spanish and English",
    "Administer, score and interpret our psychometric battery, and write assessment reports addressed to business leaders",
    "Build and defend the final shortlist with evidence and a technical recommendation",
    "Verify references and coordinate the pre-employment steps with the People Ops team",
    "Maintain process traceability in the ATS and report recruitment metrics"]'::jsonb,

  '["Profesional en Psicología",
    "De 2 a 4 años de experiencia en procesos de selección end to end, con responsabilidad directa sobre vacantes",
    "Mínimo 1 año aplicando e interpretando pruebas psicométricas y elaborando informes de evaluación",
    "Inglés B2 o superior. Se valida durante el proceso con entrevista en vivo y prueba escrita",
    "Formación o certificación en entrevista por competencias (BEI/STAR)",
    "Excel nivel intermedio-avanzado y manejo de plataformas ATS",
    "Preferible: experiencia en logística internacional, freight forwarding, comercio exterior, agenciamiento aduanero o navieras",
    "Preferible: experiencia en compañías con operación en varios países y equipos distribuidos"]'::jsonb,

  '["Degree in Psychology",
    "2-4 years in end-to-end recruitment with direct ownership of openings",
    "At least 1 year administering and interpreting psychometric assessments",
    "English at B2 or above, verified during the process through a live interview and a written exercise",
    "Training or certification in competency-based interviewing (BEI/STAR)",
    "Intermediate-advanced Excel and hands-on ATS experience",
    "Preferred: background in international logistics, freight forwarding, foreign trade, customs brokerage or shipping lines",
    "Preferred: experience in companies operating across several countries with distributed teams"]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Verificar:
-- SELECT id, title, slug, status, department FROM vacancies WHERE slug = 'talent-acquisition-specialist';


-- ============================================================================
-- PARTE B · SUPABASE  (SQL Editor del proyecto mojbhvphztnadndhnraf)
-- ============================================================================

INSERT INTO ht_vacancies (client_id, title, area, status, role_level, vacancy_type)
VALUES (
  '98b62872-5767-4815-9b49-1394b9527c1f',
  'Talent Acquisition Specialist',
  'Wellness',
  'open',
  'Mid-Level',
  'internal'
)
RETURNING id, title, status;

-- >>> COPIAR el UUID que devuelve el RETURNING.
--
-- Si YA esta aplicado `sin-variable-vercel.patch`: no hay que hacer nada mas.
--   resolveVacancyId() busca por titulo en ht_vacancies y el titulo de arriba
--   coincide exactamente con el de Neon, asi que las aplicaciones se enrutan solas.
--
-- Si NO esta aplicado: agregar la linea al VACANCY_MAP de los TRES archivos
--   (src/app/api/applications/route.ts,
--    src/app/api/admin/sync-applications-to-funnel/route.ts,
--    src/app/api/headhunting/candidates/bulk-import/route.ts):
--
--     11: "<UUID-DEVUELTO-ARRIBA>", // Talent Acquisition Specialist (Wellness)
--
--   El job_id 11 es el que quedo en src/data/jobs.ts. Se eligio 11 y no 10
--   porque 10 esta reservado para Full Stack Developer Junior en los parches
--   pendientes de aplicar.


-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- Neon:     UPDATE vacancies SET status = 'closed', updated_at = NOW()
--           WHERE slug = 'talent-acquisition-specialist';
-- Supabase: UPDATE ht_vacancies SET status = 'closed'
--           WHERE client_id = '98b62872-5767-4815-9b49-1394b9527c1f'
--             AND title = 'Talent Acquisition Specialist';
