-- ─────────────────────────────────────────────────────────────────
--  CV Recommendations / Referrals
--  Página pública /recomendar-hoja-de-vida → candidatos referidos por terceros
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ts_referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Persona referida (la hoja de vida que llega)
  candidate_name  TEXT NOT NULL,
  candidate_email TEXT,
  candidate_phone TEXT,
  candidate_role  TEXT,
  candidate_location TEXT,
  cv_url          TEXT,
  cv_filename     TEXT,
  linkedin_url    TEXT,
  -- Quién la recomendó
  referrer_name   TEXT,
  referrer_email  TEXT,
  referrer_relationship TEXT, -- "ex-compañero", "amigo", "familiar", etc.
  -- Notas del referidor
  notes           TEXT,
  recommended_for_role TEXT, -- "para cualquier vacante", "Pricing", etc.
  -- Estado interno
  status          TEXT DEFAULT 'received' CHECK (status IN ('received','reviewed','imported_to_cvbank','contacted','rejected','archived')),
  reviewed_by     TEXT,
  reviewed_at     TIMESTAMPTZ,
  internal_notes  TEXT,
  -- Linked candidate si se importó al ATS
  linked_candidate_id UUID REFERENCES ht_candidates(id) ON DELETE SET NULL,
  -- Source tracking
  source_channel  TEXT DEFAULT 'public_form', -- 'public_form'|'whatsapp'|'email'
  ip_address      TEXT,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ts_referrals_status ON ts_referrals(status);
CREATE INDEX IF NOT EXISTS idx_ts_referrals_email ON ts_referrals(candidate_email);
CREATE INDEX IF NOT EXISTS idx_ts_referrals_created ON ts_referrals(created_at DESC);
