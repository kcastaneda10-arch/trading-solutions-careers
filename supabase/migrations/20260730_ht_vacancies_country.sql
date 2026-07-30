-- ─────────────────────────────────────────────────────────────────
--  País de la vacante (funnel geográfico).
--
--  Hasta ahora todas las vacantes de ht_vacancies eran de Colombia
--  (implícito). Con el arranque del "Builder Team" en China necesitamos
--  distinguir vacantes por país para: filtrar el funnel, enrutar al
--  prefiltro correcto y aplicar reglas legales locales (PIPL vs Ley 1581).
--
--  El marcador de una vacante China es la combinación:
--      form_template_key = 'china'   (qué preguntas mostrar / cómo validar)
--    + country           = 'China'   (dónde vive la vacante)
--
--  Nullable · las vacantes existentes quedan con country NULL (Colombia
--  implícito) y no se rompen.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE ht_vacancies
  ADD COLUMN IF NOT EXISTS country text;

COMMENT ON COLUMN ht_vacancies.country IS
  'País donde vive la vacante. NULL = Colombia (implícito, legacy). Ej: China para el Builder Team.';

CREATE INDEX IF NOT EXISTS idx_ht_vacancies_country ON ht_vacancies(country);
