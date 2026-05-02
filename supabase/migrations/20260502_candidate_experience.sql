-- ─────────────────────────────────────────────────────────────────
--  Candidate Experience NPS — Trading Solutions
--  Encuesta enviada al final del proceso (rechazado o contratado)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ts_candidate_experience (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    UUID NOT NULL REFERENCES ht_candidates(id) ON DELETE CASCADE,
  vacancy_id      UUID REFERENCES ht_vacancies(id) ON DELETE SET NULL,
  token           TEXT UNIQUE NOT NULL,
  outcome         TEXT CHECK (outcome IN ('rejected','hired','withdrew','other')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  sent_at         TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '60 days',

  -- Survey responses
  nps_score                     INTEGER CHECK (nps_score BETWEEN 0 AND 10),
  process_clarity               INTEGER CHECK (process_clarity BETWEEN 1 AND 5),
  comm_quality                  INTEGER CHECK (comm_quality BETWEEN 1 AND 5),
  assessment_experience         INTEGER CHECK (assessment_experience BETWEEN 1 AND 5),
  recruiter_helpfulness         INTEGER CHECK (recruiter_helpfulness BETWEEN 1 AND 5),
  interview_quality             INTEGER CHECK (interview_quality BETWEEN 1 AND 5),
  would_recommend_company       BOOLEAN,
  comments                      TEXT,
  improvement_suggestions       TEXT
);

CREATE INDEX IF NOT EXISTS idx_ts_candidate_experience_token ON ts_candidate_experience(token);
CREATE INDEX IF NOT EXISTS idx_ts_candidate_experience_candidate ON ts_candidate_experience(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ts_candidate_experience_submitted ON ts_candidate_experience(submitted_at);
