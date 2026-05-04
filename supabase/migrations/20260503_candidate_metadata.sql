-- ─────────────────────────────────────────────────────────────────
--  Enriquecer ht_candidates con metadata LinkedIn / sourcing
--  Idempotente — seguro re-correr.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS headline TEXT;
-- Nota: current_role es palabra reservada de PostgreSQL → usamos current_job_role
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS current_job_role TEXT;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS current_company TEXT;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS source TEXT; -- 'linkedin'|'organic'|'referral'|'careers_page'
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS salary_aspiration_cop INTEGER;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS english_level TEXT;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS location TEXT;

CREATE INDEX IF NOT EXISTS idx_ht_candidates_source ON ht_candidates(source);
CREATE INDEX IF NOT EXISTS idx_ht_candidates_salary ON ht_candidates(salary_aspiration_cop);

-- Backfill: candidatos importados con LinkedIn URL en cv_url
-- mover a linkedin_url y limpiar cv_url
UPDATE ht_candidates
SET linkedin_url = cv_url, cv_url = NULL, source = 'linkedin'
WHERE cv_url ILIKE '%linkedin.com%' AND (linkedin_url IS NULL OR linkedin_url = '');
