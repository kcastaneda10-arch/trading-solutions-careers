-- ═══════════════════════════════════════════════════════════════
-- Migration: Handoff Kelly v3 · pipeline simplificado
-- Fecha: 2026-05-12
-- ═══════════════════════════════════════════════════════════════
-- 1. Mueve candidatos en etapas Elevare/IA → bateria_psicometrica
-- 2. Cierra vacantes ya contratadas (Finance Lead, Pricing Sr, Documentation)
-- 3. (Opcional) Marca candidatos contratados como contratados explícitamente
--
-- Correr esto desde Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mojbhvphztnadndhnraf/sql/new
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Mover candidatos en etapas legacy a Pruebas Psicométricas ───
-- Total esperado: 16 candidatos (12 invitados + 2 en progreso + 2 completados + 0 IA)
UPDATE ht_candidates
SET stage = 'bateria_psicometrica',
    updated_at = NOW()
WHERE stage IN (
  'assessment_invitado',
  'assessment_en_progreso',
  'assessment_completado',
  'entrevista_ia'
);

-- Verificación: cuántos quedaron en cada etapa
SELECT stage, COUNT(*) as candidatos
FROM ht_candidates
GROUP BY stage
ORDER BY stage;

-- ─── 2. Cerrar vacantes ya contratadas ───
-- Estas 3 vacantes ya tienen hire confirmado · marcarlas inactivas
-- para que no aparezcan en el funnel ni en el HR Admin como activas.
--
-- IMPORTANTE: ajustar los títulos exactos si difieren en BD.
-- Buscá primero con: SELECT id, title_es, posted_at, status FROM live_vacancies WHERE active = true;

-- Finance Lead → cerrada
UPDATE live_vacancies
SET active = false, closed_at = NOW(), closed_reason = 'hired'
WHERE title_es ILIKE '%Finance%Lead%' AND active = true;

-- Pricing Senior → Roger contratado
UPDATE live_vacancies
SET active = false, closed_at = NOW(), closed_reason = 'hired'
WHERE (title_es ILIKE '%Pricing%Senior%' OR title_es ILIKE '%Pricing Sr%') AND active = true;

-- Documentation → Michelle contratada
UPDATE live_vacancies
SET active = false, closed_at = NOW(), closed_reason = 'hired'
WHERE title_es ILIKE '%Documentation%' AND active = true;

-- Verificación: vacantes activas tras la migración
SELECT id, title_es, active, posted_at, closed_at, closed_reason
FROM live_vacancies
ORDER BY active DESC, posted_at DESC;

-- ─── 3. Confirmar candidatos hire confirmados (si no están como 'contratado') ───
-- Ajustar emails reales una vez verificados.
-- UPDATE ht_candidates SET stage = 'contratado' WHERE email IN ('roger@...', 'michelle@...');
-- (Comentado · descomentar y completar emails si quieres limpiar el funnel también)

-- ═══════════════════════════════════════════════════════════════
-- FIN de la migración. Resultado esperado:
--   - 16 candidatos movidos a 'bateria_psicometrica'
--   - 3 vacantes marcadas active = false (Finance Lead, Pricing Sr, Documentation)
--   - Vacantes activas restantes: Pricing Junior, Inside Sales (2), Talent Acquisition
-- ═══════════════════════════════════════════════════════════════
