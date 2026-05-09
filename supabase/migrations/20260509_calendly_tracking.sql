-- ─────────────────────────────────────────────────────────────────
--  Calendly tracking · cuando se envía la invitación, registramos
--  cuándo. Si el candidato agenda, podemos guardar fecha/hora del
--  evento (futuro: webhook de Calendly).
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS calendly_invitation_sent_at TIMESTAMPTZ;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS calendly_scheduled_at       TIMESTAMPTZ;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS calendly_event_url          TEXT;

CREATE INDEX IF NOT EXISTS idx_ht_candidates_calendly_pending
  ON ht_candidates(calendly_invitation_sent_at)
  WHERE calendly_invitation_sent_at IS NOT NULL AND calendly_scheduled_at IS NULL;
