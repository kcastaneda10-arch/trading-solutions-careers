-- ─────────────────────────────────────────────────────────────────
--  Generalizar ts_recruiter_assessments para soportar múltiples
--  evaluaciones por candidato (Recruiter · CWO · Hiring Manager).
--
--  Cada stage del proceso (recruiter_interview, cwo_interview,
--  hiring_manager_interview) puede tener SU PROPIA evaluación contra
--  los 16 mandatos del CEO. La CWO redunda intencionalmente para
--  triangular el verdict desde su lente ejecutiva.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE ts_recruiter_assessments
  ADD COLUMN IF NOT EXISTS assessment_stage TEXT DEFAULT 'recruiter_interview';

-- Valores válidos: 'recruiter_interview' | 'cwo_interview' | 'hiring_manager_interview'
-- Sin enum estricto · permite agregar stages futuros (ceo_interview · final, etc)

-- Index para queries rápidas por candidato + stage
CREATE INDEX IF NOT EXISTS idx_recruiter_assessments_cand_stage
  ON ts_recruiter_assessments(candidate_id, assessment_stage);

-- Backfill · todos los assessments existentes son recruiter_interview por default
UPDATE ts_recruiter_assessments
SET assessment_stage = 'recruiter_interview'
WHERE assessment_stage IS NULL;
