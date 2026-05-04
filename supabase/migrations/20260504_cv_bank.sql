-- ─────────────────────────────────────────────────────────────────
--  CV Bank rediscovery
--  Cuando un candidato es rechazado, queda en el banco para futuras vacantes.
--  AI rediscovery cruza pool con vacantes nuevas y sugiere matches.
-- ─────────────────────────────────────────────────────────────────

-- Tags y metadatos para rediscovery (extraidos del CV/notes/headline)
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS seniority_level TEXT CHECK (seniority_level IN ('junior','mid','senior','lead','director','c_suite'));
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS open_to_rediscovery BOOLEAN DEFAULT TRUE;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS rediscovery_blocked_reason TEXT;

-- Cache de matches AI (vacancy_id × candidate_id → score)
CREATE TABLE IF NOT EXISTS ts_cv_bank_matches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id   UUID NOT NULL REFERENCES ht_vacancies(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES ht_candidates(id) ON DELETE CASCADE,
  match_score  INTEGER CHECK (match_score BETWEEN 0 AND 100),
  match_reasoning TEXT,
  match_strengths TEXT[],
  match_concerns  TEXT[],
  recommendation  TEXT CHECK (recommendation IN ('strong','possible','weak','no')),
  computed_at  TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by  TEXT,
  reviewed_at  TIMESTAMPTZ,
  reviewed_decision TEXT CHECK (reviewed_decision IN ('contact','skip','already_processed')),
  UNIQUE (vacancy_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_cv_matches_vacancy ON ts_cv_bank_matches(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_cv_matches_score ON ts_cv_bank_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_ht_candidates_open_rediscovery ON ht_candidates(open_to_rediscovery) WHERE stage IN ('rechazado','contratado');
