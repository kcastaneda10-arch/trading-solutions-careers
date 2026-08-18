-- ═══════════════════════════════════════════════════════════════
-- 18-ago-2026 · Cambios de vacantes y datos que NO viven en el código
--
-- El código ya quedó actualizado (página de careers, funnel, dashboard).
-- Esto es lo que hay que correr en Supabase, porque vive en la base de datos.
--
-- CÓMO CORRERLO
--   Supabase → SQL Editor → pegar → Run.
--   Cada bloque es independiente: se puede correr por partes.
--   Correr los SELECT de verificación antes y después.
-- ═══════════════════════════════════════════════════════════════

-- ── 0 · FOTO PREVIA (correr primero, guardar el resultado) ──────
SELECT id, title, area, status, role_level, country
FROM ht_vacancies
WHERE client_id = '98b62872-5767-4815-9b49-1394b9527c1f'
ORDER BY title;


-- ── 1 · CERRAR INSIDE SALES ─────────────────────────────────────
-- Kelly: "Inside marcala como cerrada, ya no está abierta."
-- Ya se quitó de la página de careers. Acá se cierra en el ATS para que
-- deje de contar en el dashboard y en los tiempos del funnel.

UPDATE ht_vacancies
SET status = 'closed'
WHERE client_id = '98b62872-5767-4815-9b49-1394b9527c1f'
  AND title ILIKE '%inside sales%';

-- Verificar:
-- SELECT id, title, status FROM ht_vacancies WHERE title ILIKE '%inside sales%';

-- OJO · los candidatos que quedaron en el funnel de Inside Sales NO se
-- tocan. Si querés cerrarlos también, decidí primero qué pasa con ellos:
-- pasarlos a CV Bank para futuras vacantes es mejor que rechazarlos.
-- SELECT c.id, c.name, c.stage FROM ht_candidates c
-- JOIN ht_vacancies v ON v.id = c.vacancy_id
-- WHERE v.title ILIKE '%inside sales%' AND c.status NOT IN ('rejected','completed');


-- ── 2 · FULL STACK DEVELOPER: MID → JUNIOR ──────────────────────
-- El perfil nuevo (job description del 18-ago) ya está en la página de
-- careers. Acá se alinea el registro del ATS.

UPDATE ht_vacancies
SET title      = 'Full Stack Developer Junior',
    role_level = 'junior'
WHERE client_id = '98b62872-5767-4815-9b49-1394b9527c1f'
  AND title ILIKE '%full stack%';

-- Verificar:
-- SELECT id, title, role_level FROM ht_vacancies WHERE title ILIKE '%full stack%';

-- ⚠️ IMPORTANTE · copiá el UUID que devuelve ese SELECT y ponelo en Vercel
-- como variable de entorno:
--     VACANCY_ID_FULLSTACK_JUNIOR = <ese uuid>
--
-- POR QUÉ: en jobs.ts la vacante de Full Stack tenía id 6, el mismo id que
-- la vacante de China "Customer Documentation and Support". VACANCY_MAP en
-- /api/applications mapea por ese número, así que TODA aplicación a Full
-- Stack estaba entrando al funnel de la vacante de China. Se cambió a 10
-- para romper la colisión, y el 10 se resuelve con esa variable.
--
-- Si querés ver el daño histórico antes de decidir qué hacer:
-- SELECT c.id, c.name, c.email, c.created_at, v.title AS vacante_actual
-- FROM ht_candidates c
-- JOIN ht_vacancies v ON v.id = c.vacancy_id
-- WHERE v.title ILIKE '%customer documentation%'
-- ORDER BY c.created_at DESC;


-- ── 3 · CORREGIR NOMBRE MAL PARSEADO ────────────────────────────
-- Kelly: "la persona no se llama Luisa sino Luis Agamez".
-- El apellido se partió mal al importar: "luisagamez050@gmail.com" se leyó
-- como "Luisa Gamez" en vez de "Luis Agamez".

UPDATE ht_candidates
SET name = 'Luis Agamez'
WHERE email = 'luisagamez050@gmail.com';

-- Verificar:
-- SELECT id, name, email FROM ht_candidates WHERE email = 'luisagamez050@gmail.com';

-- Vale la pena buscar si el mismo error de parseo pegó a más gente —
-- nombres donde la primera palabra termina en "a" y el correo sugiere otra
-- separación. Revisar a ojo, no automatizar:
-- SELECT id, name, email FROM ht_candidates
-- WHERE replace(lower(name), ' ', '') <> split_part(lower(email), '@', 1)
--   AND email LIKE '%gmail%'
-- ORDER BY name;


-- ── 4 · SLA POR ETAPA (opcional, solo si querés cambiarlos) ─────
-- Los SLA del funnel v4 viven en el código (src/lib/stage-labels.ts), no en
-- la base. Los que quedaron puestos son:
--   Aplicó 3 · Prefiltro enviado 5 · Prefiltro pasado 2 · Revisión 2
--   Pruebas 4 · Entrevista reclutador 5 · Prueba técnica 5 · Terna 5
--   Exámenes médicos 3 · Estudio de seguridad 5 · Documentación 3
--   Oferta 7 · Contratación 2
-- Nadie los validó con vos todavía. Si el semáforo del dashboard marca
-- cosas que no cuadran con la realidad, el problema son estos números.


-- ── 5 · REGLAS DE RECORDATORIO ──────────────────────────────────
-- La regla 'assessment_pending' se sembró en la migración
-- supabase/migrations/20260507_reminders.sql apuntando a los stages
-- 'assessment_invitado' y 'assessment_en_progreso'. En el funnel v4 esos dos
-- codes murieron: todo lo que era assessment suelto se consolidó en la etapa
-- "Pruebas" (code 'pruebas').
--
-- POR QUÉ IMPORTA CORRERLO
-- El cron /api/cron/run-reminders arma su consulta con estos stage_codes y
-- filtra en la base (.in("stage", ...)). normalizeStage() traduce codes viejos
-- al LEER en el código, pero no toca un filtro que corre en Postgres. Si esta
-- fila sigue apuntando a los codes muertos, la consulta no devuelve a nadie:
--   · nadie en Pruebas recibe recordatorio, aunque lleve semanas sin entrar
--   · el auto-rechazo por silencio (on_exhausted_action) nunca dispara, así que
--     esos candidatos se quedan en el pipeline inflando las métricas
-- Todo esto en silencio: el cron responde 200 y "0 procesados".
--
-- No se edita la migración vieja porque ya corrió en producción. Esto la migra.

UPDATE ts_reminder_rules
SET stage_codes = ARRAY['pruebas']
WHERE scenario_key = 'assessment_pending';

-- Verificar (esperado: {pruebas}):
-- SELECT scenario_key, stage_codes, active FROM ts_reminder_rules ORDER BY scenario_key;

-- De paso, revisar que ninguna otra regla haya quedado con codes muertos:
-- SELECT scenario_key, stage_codes FROM ts_reminder_rules
-- WHERE stage_codes && ARRAY['assessment_invitado','assessment_en_progreso',
--                            'assessment_completado','bateria_psicometrica',
--                            'solicitud_enviada_mary','touring','entrevista_ia',
--                            'cwo_interview','hiring_lead_interview',
--                            'prefiltro_rechazado','onboarding'];


-- ── 6 · LA PÁGINA DE CAREERS LEE OTRA BASE (Neon) ───────────────
-- Esto es lo más importante del archivo y es fácil que se pase por alto.
--
-- Hay DOS bases con vacantes:
--   · Neon, tabla `vacancies`    → es la que ve el público en /vacantes
--   · Supabase, tabla `ht_vacancies` → es la del ATS y el dashboard
--
-- src/data/jobs.ts NO alimenta la página. `fetchOpenJobs()` llama a
-- /api/vacancies (Neon) y solo cae al archivo estático si la red falla. O sea
-- que los cambios de código de hoy (quitar Inside Sales, Full Stack a Junior)
-- NO se ven en la web hasta correr esto.
--
-- Corré estos UPDATE contra NEON, no contra Supabase.

-- 6.1 · Cerrar Inside Sales en la web
UPDATE vacancies SET status = 'closed', updated_at = NOW()
WHERE title ILIKE '%inside sales%';

-- 6.2 · Full Stack: Mid → Junior en la web
UPDATE vacancies
SET title      = 'Full Stack Developer Junior',
    updated_at = NOW()
WHERE title ILIKE '%full stack%';

-- Verificar qué queda publicado:
-- SELECT id, title, status FROM vacancies ORDER BY status, title;

-- ⚠️ El id de esa fila de Neon es el `job_id` que viaja cuando alguien aplica.
-- Es el número que VACANCY_MAP tiene que mapear. Correr:
--   SELECT id, title FROM vacancies WHERE title ILIKE '%full stack%';
-- y decirme qué id devuelve, para dejar VACANCY_MAP alineado. Mientras tanto,
-- si ese id sigue siendo 6, las aplicaciones a Full Stack entran al funnel de
-- la vacante de China (Customer Documentation) — es el bug que veníamos
-- arrastrando.
