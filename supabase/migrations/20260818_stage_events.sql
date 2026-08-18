-- ═══════════════════════════════════════════════════════════════
-- 18-ago-2026 · Historial real de etapas + sub-pruebas
--
-- PROBLEMA QUE RESUELVE
-- Hasta hoy los "días en etapa" del dashboard se calculaban con
-- ht_candidates.updated_at. Ese campo se pisa con CUALQUIER edición al
-- candidato (corregir un teléfono, adjuntar un CV, guardar una nota), así
-- que el contador se reiniciaba solo y los candidatos realmente estancados
-- aparecían como "recién movidos". El dashboard escondía justo lo que
-- debía mostrar.
--
-- SOLUCIÓN
-- ht_candidate_stage_events registra cada movimiento del funnel. Los días
-- en etapa se calculan desde el último evento, no desde updated_at.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Historial de cambios de etapa ────────────────────────────

CREATE TABLE IF NOT EXISTS ht_candidate_stage_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES ht_candidates(id) ON DELETE CASCADE,
  vacancy_id   uuid REFERENCES ht_vacancies(id) ON DELETE SET NULL,
  from_stage   text,
  to_stage     text NOT NULL,
  changed_at   timestamptz NOT NULL DEFAULT now(),
  changed_by   text,
  -- 'ui'        → alguien lo movió desde HR Admin
  -- 'system'    → lo movió un automatismo (prefiltro, sync, cron)
  -- 'backfill'  → reconstruido del pasado, fecha aproximada
  source       text NOT NULL DEFAULT 'ui',
  note         text,
  -- Sin esto el ON CONFLICT de abajo no dispara nunca (el PK es un uuid
  -- nuevo por fila) y volver a correr la siembra duplicaría todo.
  UNIQUE (candidate_id, to_stage, changed_at)
);

CREATE INDEX IF NOT EXISTS idx_stage_events_candidate
  ON ht_candidate_stage_events (candidate_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_stage_events_vacancy
  ON ht_candidate_stage_events (vacancy_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_stage_events_to_stage
  ON ht_candidate_stage_events (to_stage, changed_at DESC);

-- ── 2. Estado de cada prueba por candidato ──────────────────────
-- La etapa "Pruebas" agrupa 6 evaluaciones distintas (DISC, Motivación,
-- Máquina de Turing, Betesa, IQ Factorial, Neurocluster). Sin esta tabla
-- la etapa se ve lenta pero no se sabe cuál prueba la está frenando.

CREATE TABLE IF NOT EXISTS ht_candidate_tests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES ht_candidates(id) ON DELETE CASCADE,
  -- disc · motivacion · maquina_turing · betesa · iq_factorial · neurocluster
  -- assessment_grupal · prueba_tecnica_cargo
  test_id      text NOT NULL,
  -- pendiente · enviada · completada · vencida · no_aplica
  status       text NOT NULL DEFAULT 'pendiente',
  sent_at      timestamptz,
  completed_at timestamptz,
  score        numeric,
  result       jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_candidate_tests_candidate
  ON ht_candidate_tests (candidate_id);

CREATE INDEX IF NOT EXISTS idx_candidate_tests_pending
  ON ht_candidate_tests (test_id, status) WHERE status IN ('pendiente', 'enviada');

-- ── 3. Siembra del histórico ────────────────────────────────────
-- Reconstruye lo que se pueda del pasado con los sellos de tiempo sueltos
-- que ya existen en ht_candidates. Queda marcado source='backfill' para que
-- nadie confunda una fecha reconstruida con una registrada de verdad.
--
-- Sellos usados: created_at, prefilter_invited_at, prefilter_completed_at,
-- rejected_at. (tests_battery_sent_at y mary_psico_sent_at se escriben desde
-- el código pero NUNCA se crearon como columnas — los updates que las tocan
-- fallan en silencio porque nadie revisa el error de supabase. No se pueden
-- usar acá: Postgres aborta el script entero al primer nombre desconocido.)

INSERT INTO ht_candidate_stage_events (candidate_id, vacancy_id, from_stage, to_stage, changed_at, source, note)
SELECT id, vacancy_id, NULL, 'aplico', created_at, 'backfill', 'Reconstruido de created_at'
FROM ht_candidates
WHERE created_at IS NOT NULL
ON CONFLICT (candidate_id, to_stage, changed_at) DO NOTHING;

INSERT INTO ht_candidate_stage_events (candidate_id, vacancy_id, from_stage, to_stage, changed_at, source, note)
SELECT id, vacancy_id, 'aplico', 'prefiltro_enviado', prefilter_invited_at, 'backfill', 'Reconstruido de prefilter_invited_at'
FROM ht_candidates
WHERE prefilter_invited_at IS NOT NULL
ON CONFLICT (candidate_id, to_stage, changed_at) DO NOTHING;

INSERT INTO ht_candidate_stage_events (candidate_id, vacancy_id, from_stage, to_stage, changed_at, source, note)
SELECT id, vacancy_id, 'prefiltro_enviado', 'prefiltro_pasado', prefilter_completed_at, 'backfill', 'Reconstruido de prefilter_completed_at'
FROM ht_candidates
WHERE prefilter_completed_at IS NOT NULL
ON CONFLICT (candidate_id, to_stage, changed_at) DO NOTHING;

INSERT INTO ht_candidate_stage_events (candidate_id, vacancy_id, from_stage, to_stage, changed_at, source, note)
SELECT id, vacancy_id, NULL, 'rechazado', rejected_at, 'backfill', 'Reconstruido de rejected_at'
FROM ht_candidates
WHERE rejected_at IS NOT NULL
ON CONFLICT (candidate_id, to_stage, changed_at) DO NOTHING;

-- Cierre: para todo candidato vivo cuya etapa actual no quedó cubierta
-- arriba, dejamos un evento en su etapa actual usando updated_at. Es la
-- parte menos confiable de la siembra — por eso va marcada.
INSERT INTO ht_candidate_stage_events (candidate_id, vacancy_id, from_stage, to_stage, changed_at, source, note)
SELECT c.id, c.vacancy_id, NULL, c.stage, c.updated_at, 'backfill',
       'Reconstruido de updated_at · fecha aproximada'
FROM ht_candidates c
WHERE c.stage IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ht_candidate_stage_events e
    WHERE e.candidate_id = c.id AND e.to_stage = c.stage
  )
ON CONFLICT (candidate_id, to_stage, changed_at) DO NOTHING;
