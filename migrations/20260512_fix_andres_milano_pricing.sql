-- ═══════════════════════════════════════════════════════════════
-- Fix · Andres Milano (Pricing) · pegada de info incorrecta
-- Fecha: 2026-05-12
-- ═══════════════════════════════════════════════════════════════
-- Kelly pegó por error info de otro Andres en la entrevista recruiter
-- de Andres Milano (vacante Pricing). Hay que limpiar ese registro.
--
-- IMPORTANTE: correr primero el SELECT para verificar que estás borrando
-- el candidato correcto, antes del DELETE.
-- ═══════════════════════════════════════════════════════════════

-- Paso 1 · Buscar al candidato Andres Milano en vacante Pricing
-- Esto debería devolver UN solo candidato.
SELECT c.id, c.name, c.email, c.stage, v.title as vacancy
FROM ht_candidates c
LEFT JOIN ht_vacancies v ON v.id = c.vacancy_id
WHERE c.name ILIKE '%Andres%Milano%'
  AND v.title ILIKE '%Pricing%';

-- Paso 2 · Ver las evaluaciones recruiter actuales de este candidato.
-- Reemplaza 'CANDIDATE_ID_AQUI' con el id que devolvió el SELECT de arriba.
SELECT id, candidate_id, assessment_stage, interview_date, verdict,
       LEFT(verdict_summary, 80) as verdict_preview,
       LEFT(summary_for_cwo, 80) as cwo_preview,
       interviewer_email
FROM ts_recruiter_assessments
WHERE candidate_id = 'CANDIDATE_ID_AQUI'
ORDER BY interview_date DESC;

-- Paso 3 · Borrar la evaluación incorrecta.
-- OPCIÓN A · borrar TODAS las evaluaciones recruiter de este candidato
-- (recomendado si fue una sola entrevista mal pegada):
--
-- DELETE FROM ts_recruiter_assessments
-- WHERE candidate_id = 'CANDIDATE_ID_AQUI'
--   AND assessment_stage = 'recruiter_interview';
--
-- OPCIÓN B · borrar SOLO una evaluación específica (si hay varias):
-- DELETE FROM ts_recruiter_assessments WHERE id = 'ASSESSMENT_ID_AQUI';

-- Paso 4 · (Opcional) Devolver al candidato a un stage anterior para
-- que se le pueda hacer la entrevista recruiter de nuevo:
-- UPDATE ht_candidates SET stage = 'prefiltro_pasado', updated_at = NOW()
-- WHERE id = 'CANDIDATE_ID_AQUI';

-- ═══════════════════════════════════════════════════════════════
-- Cómo correr esto:
-- 1. Supabase SQL Editor: https://supabase.com/dashboard/project/mojbhvphztnadndhnraf/sql/new
-- 2. Correr SOLO el Paso 1 primero, anotar el candidate_id
-- 3. Correr el Paso 2 con el id real, ver qué evaluaciones existen
-- 4. Descomentar y correr el Paso 3 (Opción A o B)
-- 5. Opcional: correr Paso 4 si quieres que vuelva a quedar en prefiltro pasado
-- ═══════════════════════════════════════════════════════════════
