-- ============================================================================
-- Vacante: Especialista SIG-SST  ·  Wellness  ·  Barranquilla
-- Creado: 7-sep-2026  ·  job_id 12 en src/data/jobs.ts
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
  'Especialista SIG-SST',
  'Especialista SIG-SST',
  'Integrated Management Systems & HSE Specialist',
  'Wellness',
  'Barranquilla, Atlántico, Colombia',
  'Presencial',
  'Término indefinido',
  'Senior',
  NULL,                       -- <<< sin banda salarial, por decision de Wellness
  'open',
  'especialista-sig-sst',
  'jointheteam@tradingsolutions.com',
  '2026-09-07',
  'SIG, SST, BASC V6, ISO 9001/14001/45001, Licencia SST, Bilingüe EN/ES',

  '¡Buscamos un Especialista SIG-SST para unirse a nuestro equipo!

En Trading Solutions estamos redefiniendo el futuro de la logística global, uniendo tecnología de punta, visibilidad en tiempo real y coordinación fluida entre continentes. Le damos a las empresas la capacidad de moverse más rápido, con más inteligencia y con total confianza en cada embarque.

Buscamos un Especialista SIG-SST que lidere el sistema que mantiene a Trading Solutions operando al nivel por el que nuestros clientes ya nos reconocen. Es un rol end to end —calidad, ambiental, seguridad y salud en el trabajo, seguridad de la cadena de suministro e inocuidad— e incluye el plan anual de formación, el programa de auditorías internas y las prácticas del día a día que mantienen nuestra operación segura y consistente. Vas a trabajar con toda la compañía y en terreno: reportas al CWO, lideras a un analista y a un practicante, y eres nuestra voz técnica con clientes y aliados alrededor del mundo. El cargo se mide por dos cosas: certificaciones que se mantienen fuertes, y un equipo que trabaja seguro todos los días.',

  'We are looking for an Integrated Management Systems & HSE Specialist to join our team!

At Trading Solutions, we are redefining the future of global logistics by merging cutting-edge technology, real-time visibility, and seamless coordination across continents. We empower businesses to move faster, smarter, and with absolute confidence in every shipment.

We are looking for an Integrated Management Systems & HSE Specialist to lead the system that keeps Trading Solutions operating at the standard our clients already know us for. It is an end-to-end role - quality, environment, occupational health and safety, supply chain security and food safety - including the annual training plan, the internal audit programme and the everyday practices that keep our operation safe and consistent. You will work across the whole company and out in the field: you report to the CWO, lead an analyst and an intern, and are our technical voice with clients and partners around the world. The role is measured on two things: certifications that stay strong, and a team that works safely every day.',

  '["Mantener y fortalecer el Sistema Integrado de Gestión: calidad, ambiental, seguridad y salud en el trabajo, seguridad de la cadena de suministro e inocuidad",
    "Liderar el sistema de seguridad y salud en el trabajo: matriz de peligros, plan anual de trabajo, programas de vigilancia epidemiológica y plan de emergencias",
    "Acompañar la prevención en el día a día: inspecciones planeadas, análisis de incidentes y seguimiento de los indicadores de seguridad",
    "Sostener las prácticas de seguridad de la cadena de suministro: inspección de unidades de carga, control de sellos, estudios de seguridad y acuerdos con nuestros aliados",
    "Ser dueño del plan anual de formación de los cinco sistemas y de la medición de su eficacia",
    "Planear y ejecutar el programa anual de auditorías internas y preparar a la compañía para las evaluaciones externas",
    "Ser nuestra voz técnica ante clientes internacionales, aliados y entes certificadores",
    "Liderar al Analista SIG y al practicante, y llevar el sistema a bodega, patio y puerto — no solo al escritorio"]'::jsonb,

  '["Maintain and strengthen the Integrated Management System: quality, environment, occupational health and safety, supply chain security and food safety",
    "Lead the occupational health and safety system: hazard matrix, annual work plan, health surveillance programmes and the emergency plan",
    "Support prevention day to day: planned inspections, incident analysis and follow-up on safety indicators",
    "Sustain our supply chain security practices: cargo unit inspections, seal control, background studies and agreements with our partners",
    "Own the annual training plan across all five systems and the measurement of its effectiveness",
    "Plan and run the annual internal audit programme and prepare the company for external assessments",
    "Be our technical voice with international clients, partners and certification bodies",
    "Lead the SIG Analyst and the intern, and take the system to the warehouse, the yard and the port - not just to the desk"]'::jsonb,

  '["Profesional en Ingeniería Industrial, Ambiental, de Procesos, Administración o Seguridad y Salud en el Trabajo, con posgrado en SST, HSEQ o Sistemas Integrados de Gestión",
    "Licencia vigente en Seguridad y Salud en el Trabajo (Resolución 908 de 2025). Se verifica número, entidad expedidora y fecha de vencimiento antes de la entrevista técnica",
    "Curso de 50 horas del SG-SST y curso de actualización de 20 horas vigente",
    "Auditor interno en ISO 9001, ISO 14001 e ISO 45001",
    "Mínimo 5 años en sistemas integrados de gestión y SST, con al menos 3 liderando el sistema en una empresa certificada",
    "Haber atendido de forma directa al menos un ciclo completo de auditoría de certificación o recertificación externa",
    "Inglés B2 o superior. Se valida durante el proceso con una entrevista sostenida en inglés",
    "Excel avanzado. Hay prueba técnica",
    "Preferible: auditor interno BASC V6:2022. Si no lo trae, se certifica durante los primeros seis meses",
    "Preferible: experiencia en logística internacional, freight forwarding, agenciamiento aduanero, puerto o zona franca"]'::jsonb,

  '["Degree in Industrial, Environmental or Process Engineering, Business Administration or Occupational Health and Safety, with a postgraduate qualification in OHS, HSEQ or Integrated Management Systems",
    "Valid Colombian OHS licence (Resolution 908 of 2025). Licence number, issuing authority and expiry date are verified before the technical interview",
    "50-hour OHS management course and a current 20-hour refresher course",
    "Internal auditor for ISO 9001, ISO 14001 and ISO 45001",
    "At least 5 years in integrated management systems and OHS, including 3 years leading the system in a certified company",
    "Direct, hands-on involvement in at least one full external certification or recertification audit cycle",
    "English at B2 or above, verified during the process through an interview held entirely in English",
    "Advanced Excel. There is a technical exercise",
    "Preferred: BASC V6:2022 internal auditor. If not held on entry, certification is completed within the first six months",
    "Preferred: background in international logistics, freight forwarding, customs brokerage, ports or free trade zones"]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- Verificar:
-- SELECT id, title, slug, status, department FROM vacancies WHERE slug = 'especialista-sig-sst';


-- ============================================================================
-- PARTE B · SUPABASE  (SQL Editor del proyecto mojbhvphztnadndhnraf)
-- ============================================================================

-- OJO: `model_id` es NOT NULL y no tiene default. Es el modelo de competencias
-- (los 16 mandatos) con el que se evalúa a los candidatos. Por eso el INSERT
-- va con SELECT: reutiliza el mismo modelo que ya usan las demás vacantes de
-- Trading Solutions y no hay que escribir ningún UUID a mano.
-- (Mismo tropiezo del 19-ago con Talent Acquisition Specialist.)

-- PASO 1 · crear la vacante reutilizando el modelo de competencias vigente
INSERT INTO ht_vacancies (client_id, model_id, title, status)
SELECT '98b62872-5767-4815-9b49-1394b9527c1f',
       model_id,
       'Especialista SIG-SST',
       'open'
FROM ht_vacancies
WHERE client_id = '98b62872-5767-4815-9b49-1394b9527c1f'
  AND model_id IS NOT NULL
  -- guarda contra duplicados: este INSERT no tiene ON CONFLICT y correrlo
  -- dos veces crea dos vacantes con el mismo titulo (fue lo que paso con
  -- Talent Acquisition Specialist, que quedo cinco veces en la tabla).
  AND NOT EXISTS (
    SELECT 1 FROM ht_vacancies
    WHERE client_id = '98b62872-5767-4815-9b49-1394b9527c1f'
      AND title = 'Especialista SIG-SST'
  )
LIMIT 1;

-- PASO 2 · completar los datos del cargo
-- `role_level` tiene CHECK (`ht_vacancies_role_level_check`) y solo acepta
-- 'entry' | 'lead' | 'c_suite'. NO es el nivel del career site ('Senior'):
-- ese vive en Neon. Aqui va 'lead' porque el cargo tiene equipo a cargo.
UPDATE ht_vacancies
SET area              = 'Wellness',
    role_level        = 'lead',
    vacancy_type      = 'incremental',
    form_template_key = 'sig_sst'   -- plantilla de prefiltro propia de este cargo
WHERE client_id = '98b62872-5767-4815-9b49-1394b9527c1f'
  AND title = 'Especialista SIG-SST';

-- VERIFICAR · debe devolver UNA fila, con model_id lleno
SELECT id, title, status, area, role_level, model_id, form_template_key
FROM ht_vacancies
WHERE title = 'Especialista SIG-SST';

-- >>> COPIAR el UUID que devuelve el SELECT de verificacion.
--
-- En esta rama (`etapa2-funnel-china`) NO existe resolveVacancyId(): el parche
-- `sin-variable-vercel.patch` sigue sin aplicar. Por lo tanto HAY que agregar la
-- linea al VACANCY_MAP de los TRES archivos:
--
--   src/app/api/applications/route.ts
--   src/app/api/admin/sync-applications-to-funnel/route.ts
--   src/app/api/headhunting/candidates/bulk-import/route.ts   (mapea por titulo)
--
--     12: "<UUID-DEVUELTO-ARRIBA>", // Especialista SIG-SST (Wellness)
--
-- OJO: el job_id 11 (Talent Acquisition Specialist) TAMPOCO esta en el
-- VACANCY_MAP de esta rama. Hoy el mapa llega hasta el 9. Si 11 sigue abierta,
-- agregar tambien su UUID en la misma pasada.
--
-- El job_id 12 es el que quedo en src/data/jobs.ts. Se eligio 12 porque el 10
-- esta reservado para Full Stack Developer Junior en los parches pendientes y
-- el 11 es Talent Acquisition Specialist.


-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- Neon:     UPDATE vacancies SET status = 'closed', updated_at = NOW()
--           WHERE slug = 'especialista-sig-sst';
-- Supabase: UPDATE ht_vacancies SET status = 'closed'
--           WHERE client_id = '98b62872-5767-4815-9b49-1394b9527c1f'
--             AND title = 'Especialista SIG-SST';
