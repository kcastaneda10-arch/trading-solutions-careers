-- ─────────────────────────────────────────────────────────────────
--  Interviews scheduling — Trading Solutions
--  Track de entrevistas agendadas + integración Google Calendar
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ts_interviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    UUID NOT NULL REFERENCES ht_candidates(id) ON DELETE CASCADE,
  vacancy_id      UUID REFERENCES ht_vacancies(id) ON DELETE SET NULL,
  interview_type  TEXT CHECK (interview_type IN ('recruiter','cwo','technical','area_lead','wellness','final')) NOT NULL,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_min    INTEGER NOT NULL DEFAULT 45,
  location        TEXT,
  meeting_url     TEXT,
  interviewer_emails TEXT[] DEFAULT '{}',
  status          TEXT CHECK (status IN ('scheduled','completed','cancelled','no_show')) DEFAULT 'scheduled',
  outcome         TEXT,
  notes           TEXT,
  ics_uid         TEXT UNIQUE,
  email_sent      BOOLEAN DEFAULT FALSE,
  email_sent_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ts_interviews_candidate ON ts_interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_ts_interviews_vacancy ON ts_interviews(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_ts_interviews_scheduled ON ts_interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_ts_interviews_status ON ts_interviews(status);
