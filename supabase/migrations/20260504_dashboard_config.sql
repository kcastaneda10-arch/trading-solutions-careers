-- ─────────────────────────────────────────────────────────────────
--  Dashboard Config — singleton key-value para metas que pueden
--  cambiar sin redeploy (target hires Q, NPS goal, etc.)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ts_dashboard_config (
  id                       INTEGER PRIMARY KEY DEFAULT 1,
  target_hires_quarter     INTEGER NOT NULL DEFAULT 5,
  target_hires_month       INTEGER NOT NULL DEFAULT 2,
  target_nps               INTEGER NOT NULL DEFAULT 70,
  pipeline_aging_days      INTEGER NOT NULL DEFAULT 21,
  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT singleton CHECK (id = 1)
);

-- Insert default si no existe
INSERT INTO ts_dashboard_config (id, target_hires_quarter, target_hires_month, target_nps, pipeline_aging_days)
VALUES (1, 5, 2, 70, 21)
ON CONFLICT (id) DO NOTHING;
