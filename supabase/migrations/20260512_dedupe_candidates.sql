-- ─────────────────────────────────────────────────────────────────
--  Dedupe ht_candidates · normaliza emails + cleanup de duplicados
--
--  Problema: la dedup del seed/import usaba .in() exact-match · si el
--  email tenía mayúsculas mezcladas en BD vs lowercase en el seed, no
--  detectaba dupe. Caso real: Carlos De La Cruz (dlccarlosa@gmail.com)
--  terminó con 2 registros · uno en assessment_invitado (Apr 17) y otro
--  en prefiltro_enviado (Apr 30).
--
--  Esta migración:
--   1. Normaliza todos los emails a lowercase (trim incluido)
--   2. Muestra qué duplicados quedaron (no los borra automáticamente ·
--      revisión manual antes de mergear)
--   3. Agrega un UNIQUE INDEX sobre (lower(email), client_id) que va
--      a fallar si quedan dupes · esto es a propósito · obliga a
--      decidir manualmente cuál record conservar.
-- ─────────────────────────────────────────────────────────────────

-- 1. Normalizar emails existentes
UPDATE ht_candidates
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL
  AND email <> LOWER(TRIM(email));

-- 2. Vista temporal para revisar dupes manualmente (no borra nada)
-- Corre esto DESPUÉS de la normalización · si devuelve filas, mergea
-- manualmente antes de crear el UNIQUE INDEX abajo.
CREATE OR REPLACE VIEW v_candidate_dupes AS
SELECT
  email,
  client_id,
  COUNT(*) AS dup_count,
  ARRAY_AGG(id ORDER BY created_at DESC) AS candidate_ids,
  ARRAY_AGG(name ORDER BY created_at DESC) AS names,
  ARRAY_AGG(stage ORDER BY created_at DESC) AS stages,
  ARRAY_AGG(created_at ORDER BY created_at DESC) AS created_dates
FROM ht_candidates
WHERE email IS NOT NULL
GROUP BY email, client_id
HAVING COUNT(*) > 1;

-- NOTA: el UNIQUE INDEX queda COMENTADO porque va a fallar mientras
-- haya dupes. Después de hacer la limpieza manual (mergeando los dupes
-- al record más reciente con stage activo), descomenta y vuelve a correr.
--
-- CREATE UNIQUE INDEX IF NOT EXISTS uniq_ht_candidates_email_client
--   ON ht_candidates (LOWER(email), client_id);
