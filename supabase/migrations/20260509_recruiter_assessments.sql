-- ─────────────────────────────────────────────────────────────────
--  Recruiter Assessment · evaluación de entrevista con recruiter
--  contra los 16 mandatos del CEO. Permite IA-asistido + override
--  manual. Visible en el Funnel cuando candidato está en stage
--  recruiter_interview o posterior.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ts_recruiter_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES ht_candidates(id) ON DELETE CASCADE,

  -- Metadata de la entrevista
  interview_date TIMESTAMPTZ DEFAULT NOW(),
  interviewer_email TEXT,
  duration_minutes INTEGER,

  -- 16 mandatos · scores: pass | partial | fail | data | not_probed
  -- Ej: { "1": "partial", "2": "not_probed", "3": "fail", ... }
  mandate_scores JSONB DEFAULT '{}'::jsonb,
  -- Texto resumen de evidencia por mandato
  mandate_evidence JSONB DEFAULT '{}'::jsonb,
  -- Quotes literales del transcript por mandato
  mandate_quotes JSONB DEFAULT '{}'::jsonb,

  -- English assessment
  english_declared TEXT,
  english_real TEXT,
  english_evidence TEXT,
  english_verdict TEXT,  -- 'pass' | 'gap' | 'fail'

  -- Verdict global
  verdict TEXT CHECK (verdict IN ('strong_yes', 'maybe', 'no')),
  verdict_summary TEXT,         -- frase corta de cierre
  pass_reasons TEXT[] DEFAULT ARRAY[]::TEXT[],
  fail_reasons TEXT[] DEFAULT ARRAY[]::TEXT[],
  next_filter_probes TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Sources
  transcript_text TEXT,            -- transcript completo (opcional, puede ser largo)
  transcript_hash TEXT,            -- para detectar reenvíos del mismo transcript
  parsed_by_ai BOOLEAN DEFAULT false,
  ai_model_version TEXT,           -- ej: 'claude-sonnet-4-6'
  human_reviewed BOOLEAN DEFAULT false,
  human_overrides JSONB,           -- qué cambió Kelly del output IA

  full_eval_doc_url TEXT,          -- link al docx (opcional)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_assessments_candidate
  ON ts_recruiter_assessments(candidate_id);

CREATE INDEX IF NOT EXISTS idx_recruiter_assessments_date
  ON ts_recruiter_assessments(interview_date DESC);
