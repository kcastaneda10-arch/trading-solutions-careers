-- ─────────────────────────────────────────────────────────────────
--  Decision Nudges — desambiguar a CWO + Hiring Managers
--  Después de entrevista, se les pide decisión binaria via email/whatsapp.
--  Page pública con 3 botones forzados — auto-actualiza stage del candidato.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ts_interview_decisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    UUID NOT NULL REFERENCES ht_candidates(id) ON DELETE CASCADE,
  vacancy_id      UUID REFERENCES ht_vacancies(id) ON DELETE SET NULL,
  interview_type  TEXT, -- 'recruiter','cwo','area_lead','wellness'
  recipient_role  TEXT NOT NULL CHECK (recipient_role IN ('cwo','hiring_manager','area_lead','recruiter')),
  recipient_email TEXT NOT NULL,
  recipient_name  TEXT,
  token           TEXT UNIQUE NOT NULL,
  -- Tracking de envío
  channel         TEXT DEFAULT 'email' CHECK (channel IN ('email','whatsapp','both')),
  sent_via_draft_id TEXT, -- gmail draft id si fue draft
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  reminder_count  INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  -- Respuesta
  responded_at    TIMESTAMPTZ,
  decision        TEXT CHECK (decision IN ('avanza','no_avanza','needs_more_info','recommend_other_vacancy')),
  decision_to_stage TEXT, -- target stage si avanza ('touring','terna','recruiter_interview', etc.)
  recommended_vacancy_id UUID REFERENCES ht_vacancies(id) ON DELETE SET NULL,
  recommended_vacancy_text TEXT, -- si manager escribió libre ej. "para pricing junior"
  reasoning       TEXT,
  -- Auto-applied flag (si el endpoint actualizó stage automáticamente)
  stage_auto_updated BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_decisions_candidate ON ts_interview_decisions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_decisions_token ON ts_interview_decisions(token);
CREATE INDEX IF NOT EXISTS idx_decisions_pending ON ts_interview_decisions(responded_at) WHERE responded_at IS NULL;
