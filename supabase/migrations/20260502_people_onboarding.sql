-- ─────────────────────────────────────────────────────────────────
--  People file + Onboarding — Trading Solutions
--  Directorio de empleados (TPs + nuevos hires) y planes de onboarding
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ts_people (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  email                 TEXT UNIQUE,
  role                  TEXT,
  area                  TEXT,
  role_level            TEXT CHECK (role_level IN ('entry','lead','c_suite')),
  start_date            DATE,
  status                TEXT CHECK (status IN ('active','onboarding','offboarded')) DEFAULT 'onboarding',
  manager_email         TEXT,
  buddy_email           TEXT,
  location              TEXT DEFAULT 'Barranquilla',
  is_top_performer      BOOLEAN DEFAULT FALSE,
  linked_candidate_id   UUID REFERENCES ht_candidates(id) ON DELETE SET NULL,
  linked_vacancy_id     UUID REFERENCES ht_vacancies(id) ON DELETE SET NULL,
  psychometric_profile  JSONB,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ts_people_email ON ts_people(email);
CREATE INDEX IF NOT EXISTS idx_ts_people_status ON ts_people(status);
CREATE INDEX IF NOT EXISTS idx_ts_people_tp ON ts_people(is_top_performer);
CREATE INDEX IF NOT EXISTS idx_ts_people_candidate ON ts_people(linked_candidate_id);

-- ─── Onboarding records ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ts_onboarding (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id       UUID NOT NULL REFERENCES ts_people(id) ON DELETE CASCADE,
  start_date      DATE NOT NULL,
  status          TEXT CHECK (status IN ('not_started','in_progress','completed','at_risk')) DEFAULT 'in_progress',

  -- Tasks: array de { id, label, milestone (day1|week1|day30|day60|day90), done, done_at, owner }
  tasks           JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Milestone completion flags (para queries rápidas)
  day1_completed_at      TIMESTAMPTZ,
  week1_completed_at     TIMESTAMPTZ,
  day30_completed_at     TIMESTAMPTZ,
  day60_completed_at     TIMESTAMPTZ,
  day90_completed_at     TIMESTAMPTZ,

  -- Reviews
  manager_30d_check_in   TEXT,
  manager_60d_check_in   TEXT,
  manager_90d_review     TEXT,
  ramp_up_score          INTEGER CHECK (ramp_up_score BETWEEN 1 AND 5),

  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ts_onboarding_person ON ts_onboarding(person_id);
CREATE INDEX IF NOT EXISTS idx_ts_onboarding_status ON ts_onboarding(status);
