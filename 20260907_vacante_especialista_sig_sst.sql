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

  'Somos un freight forwarder boutique, y esa palabra aquí significa algo concreto: somos 73 personas en Barranquilla moviendo carga entre continentes, todos nos conocemos por el nombre y a nadie se le pierde un embarque entre los procesos.

Boutique también significa que lo hacemos bien. Trabajamos con cinco sistemas de gestión —calidad, ambiental, seguridad y salud en el trabajo, seguridad de la cadena de suministro e inocuidad— y no los tenemos colgados en la pared: nos los auditan de verdad, y de ahí sale la confianza que un cliente al otro lado del mundo pone en nosotros.

Ese sistema completo va a ser tuyo. Vas a trabajar al lado del CWO, con un analista y un practicante, y con la operación abierta de par en par: aquí el especialista del SIG camina la bodega, se sube al patio y habla con el conductor. Si te gusta dejar un sistema ordenado, medible y defendible frente a cualquier auditor —y que además se note en la gente, no solo en el papel—, queremos conocerte.',

  'We are a boutique freight forwarder, and here that word means something concrete: 73 people in Barranquilla moving cargo across continents, everyone on a first-name basis, and no shipment lost between processes.

Boutique also means we do it properly. We run five management systems - quality, environment, occupational health and safety, supply chain security and food safety - and they are not framed on a wall: they get audited for real, and that is where the trust of a client on the other side of the world comes from.

That whole system will be yours. You will work alongside the CWO, with an analyst and an intern, and with the operation wide open to you: here the management systems specialist walks the warehouse, climbs onto the yard and talks to the driver. If you like leaving a system tidy, measurable and defensible before any auditor - and want it to show in the people, not just on paper - we would like to meet you.',

  '["Mantener y hacer auditable el Sistema Integrado de Gestión: ISO 9001, ISO 14001, ISO 45001, BASC V6:2022, régimen OEA e inocuidad",
    "Ejercer como responsable del SG-SST con licencia vigente: estándares mínimos, matriz de peligros, plan anual de trabajo, programas de vigilancia epidemiológica y plan de emergencias",
    "Investigar accidentes e incidentes dentro de los términos de ley y responder por la estadística de accidentalidad y ausentismo",
    "Sostener el Sistema de Gestión en Control y Seguridad: cargos críticos, estudios de seguridad, inspección de unidades de carga, control de sellos ISO 17712 y acuerdos con asociados de negocio",
    "Ser dueño del plan anual de formación de los cinco sistemas, con eficacia medida y no digitada, sobre metas de 80 % de cobertura y 80 % de eficacia",
    "Planear y ejecutar el programa anual de auditorías internas y preparar a la compañía para las auditorías externas",
    "Ser el interlocutor técnico ante la certificadora, BASC, la ARL, la DIAN, la autoridad ambiental y los clientes internacionales que nos auditan como proveedor",
    "Liderar al Analista SIG y al practicante, y llevar el sistema a bodega, patio y puerto — no solo al escritorio"]'::jsonb,

  '["Keep the Integrated Management System auditable at all times: ISO 9001, ISO 14001, ISO 45001, BASC V6:2022, AEO regime and food safety",
    "Act as the licensed owner of the Colombian OHS management system: minimum standards, hazard matrix, annual work plan, health surveillance programmes and the emergency plan",
    "Investigate accidents and incidents within legal deadlines and own the accident and absenteeism statistics",
    "Sustain the supply chain security management system: critical roles, background studies, cargo unit inspections, ISO 17712 seal control and business partner security agreements",
    "Own the annual training plan across all five systems, with effectiveness that is measured rather than typed in, against targets of 80 % coverage and 80 % effectiveness",
    "Plan and run the annual internal audit programme and get the company ready for external audits",
    "Be the technical counterpart before the certification body, BASC, the occupational risk insurer, Customs, the environmental authority and the international clients who audit us as a supplier",
    "Lead the SIG Analyst and the intern, and take the system to the warehouse, the yard and the port — not just to the desk"]'::jsonb,

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

INSERT INTO ht_vacancies (client_id, title, area, status, role_level, vacancy_type)
VALUES (
  '98b62872-5767-4815-9b49-1394b9527c1f',
  'Especialista SIG-SST',
  'Wellness',
  'open',
  'Senior',
  'internal'
)
RETURNING id, title, status;

-- >>> COPIAR el UUID que devuelve el RETURNING.
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
