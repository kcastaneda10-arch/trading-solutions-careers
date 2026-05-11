-- ─────────────────────────────────────────────────────────────────
--  Joint Scheduling · agendamiento con múltiples entrevistadores.
--  Reemplaza Calendly Collective sin pagar plan Teams · usa Google
--  Calendar freebusy API para encontrar slots donde TODOS los hosts
--  están libres simultáneamente.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ts_joint_schedulings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,

  -- Quién lo creó (recruiter · normalmente Kelly)
  created_by_email TEXT,

  -- Para quién es
  candidate_id UUID REFERENCES ht_candidates(id) ON DELETE CASCADE,
  candidate_name TEXT,
  candidate_email TEXT,
  vacancy_id UUID,
  vacancy_title TEXT,

  -- Quiénes son los entrevistadores (emails de TS workspace que tienen
  -- su calendario compartido con kcastaneda@tradingsolutions.com)
  interviewer_emails TEXT[] NOT NULL,
  interviewer_names TEXT[],

  -- Configuración del evento
  duration_minutes INTEGER DEFAULT 45,
  window_start TIMESTAMPTZ NOT NULL,   -- desde cuándo buscar slots
  window_end TIMESTAMPTZ NOT NULL,     -- hasta cuándo
  business_hours_start INTEGER DEFAULT 8,   -- hora local Colombia (24h)
  business_hours_end INTEGER DEFAULT 18,
  buffer_minutes INTEGER DEFAULT 15,   -- gap mínimo entre slots
  timezone TEXT DEFAULT 'America/Bogota',

  -- Estado del agendamiento
  scheduled_at TIMESTAMPTZ,           -- cuándo eligió el slot
  scheduled_slot_start TIMESTAMPTZ,   -- inicio del slot elegido
  scheduled_slot_end TIMESTAMPTZ,
  meet_url TEXT,                      -- link de Google Meet generado
  google_event_id TEXT,               -- ID del evento en Google Calendar

  -- Notas opcionales que aparecen en el correo invite
  description TEXT,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'cancelled', 'expired')),

  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_joint_schedulings_token ON ts_joint_schedulings(token);
CREATE INDEX IF NOT EXISTS idx_joint_schedulings_candidate ON ts_joint_schedulings(candidate_id);
CREATE INDEX IF NOT EXISTS idx_joint_schedulings_status ON ts_joint_schedulings(status);
