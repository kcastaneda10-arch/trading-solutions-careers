-- ─────────────────────────────────────────────────────────────────
--  RYS Corporate Standard + Market alignment — Trading Solutions
--
--  Política híbrida (RYS para Entry/Lead, mercado para C-Suite):
--    Entry/Lead    + Reemplazo    : 35 días  (RYS upper bound)
--    Entry/Lead    + Incremental  : 50 días  (RYS upper bound)
--    C-Suite       + Reemplazo    : 60 días  (mercado Colombia freight)
--    C-Suite       + Incremental  : 80 días  (mercado Colombia freight)
-- ─────────────────────────────────────────────────────────────────

-- 1) Add vacancy_type column to ht_vacancies (default 'incremental' — más conservador)
ALTER TABLE ht_vacancies
  ADD COLUMN IF NOT EXISTS vacancy_type TEXT
    CHECK (vacancy_type IN ('reemplazo','incremental'))
    DEFAULT 'incremental';

-- 2) Mark vacantes ya cerradas como reemplazo (heurística: cubrieron salidas reales)
UPDATE ht_vacancies v
SET vacancy_type = 'reemplazo'
WHERE EXISTS (
  SELECT 1 FROM ht_vacancy_milestones m
  WHERE m.vacancy_id = v.id AND m.hire_date IS NOT NULL
);

-- 3) Restructurar ts_targets para soportar (role_level + vacancy_type)
-- Drop existing PK/unique if any so we can have multiple rows per role_level
ALTER TABLE ts_targets DROP CONSTRAINT IF EXISTS ts_targets_pkey;
ALTER TABLE ts_targets DROP CONSTRAINT IF EXISTS ts_targets_role_level_key;

ALTER TABLE ts_targets
  ADD COLUMN IF NOT EXISTS vacancy_type TEXT
    CHECK (vacancy_type IN ('reemplazo','incremental'));

-- 4) Wipe + insertar matriz híbrida (RYS + mercado)
TRUNCATE TABLE ts_targets;
INSERT INTO ts_targets (role_level, vacancy_type, target_days_to_fill) VALUES
  ('entry',   'reemplazo',   35),  -- RYS
  ('entry',   'incremental', 50),  -- RYS
  ('lead',    'reemplazo',   35),  -- RYS
  ('lead',    'incremental', 50),  -- RYS
  ('c_suite', 'reemplazo',   60),  -- mercado Colombia freight forwarding
  ('c_suite', 'incremental', 80);  -- mercado Colombia freight forwarding

-- 5) Constraint compuesto (evita duplicados del mismo combo)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ts_targets_role_type
  ON ts_targets(role_level, vacancy_type);

-- 6) Index para queries rápidas por type en vacantes
CREATE INDEX IF NOT EXISTS idx_ht_vacancies_vacancy_type ON ht_vacancies(vacancy_type);
