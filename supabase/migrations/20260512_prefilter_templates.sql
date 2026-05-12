-- ─────────────────────────────────────────────────────────────────
--  Prefilter templates por tipo de vacante.
--
--  Hasta ahora el form /prefiltro/[token] tenía preguntas hardcodeadas
--  para comercio exterior/ventas/pricing. Cuando una vacante de tipo
--  HR/Tech/Finance usaba el mismo form, el candidato veía preguntas que
--  no aplicaban a su rol (caso real: Johan @ Talent Acquisition Lead).
--
--  Fix: cada vacante tiene un `form_template_key` que selecciona qué
--  secciones del form renderizar. Default = 'comex' para no romper las
--  vacantes existentes.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE ht_vacancies
  ADD COLUMN IF NOT EXISTS form_template_key TEXT DEFAULT 'comex';

COMMENT ON COLUMN ht_vacancies.form_template_key IS
  'Identifica qué set de preguntas mostrar en el prefilter público. Valores: comex (default), hr_lead, finance, tech.';

-- Asignar template HR a Talent Acquisition Lead
UPDATE ht_vacancies
SET form_template_key = 'hr_lead'
WHERE LOWER(title) LIKE '%talent acquisition%'
   OR LOWER(title) LIKE '%talent development%'
   OR LOWER(title) LIKE '%recursos humanos%'
   OR LOWER(title) LIKE '%human resources%';

-- Asignar template finance a Lead Accounting Finance Officer
UPDATE ht_vacancies
SET form_template_key = 'finance'
WHERE LOWER(title) LIKE '%accounting%'
   OR LOWER(title) LIKE '%finance officer%'
   OR LOWER(title) LIKE '%controller%';

-- Index para queries rápidas si el funnel filtra por template
CREATE INDEX IF NOT EXISTS idx_ht_vacancies_form_template ON ht_vacancies(form_template_key);
