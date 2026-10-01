-- ============================================================
-- Reabrir dos baterías de China que quedaron cerradas a medias
-- Proyecto: mojbhvphztnadndhnraf (elevare-careers)
-- 1-oct-2026 · correr completo en el SQL Editor
-- ============================================================
-- Qué pasó: /api/bateria/diag/<token> se llama "diag" pero escribía.
-- Al abrirla para revisar el estado de dos candidatas que estaban a
-- medias, marcó las sesiones como completadas y les calculó puntajes
-- sobre un cuestionario incompleto.
--
--   Yijiao Wang  · 68 de 172 respuestas
--   Judy Guo     · 16 de 172 respuestas
--
-- Las dos habían escrito preguntando por un problema con la prueba y
-- estaban esperando respuesta. El match que quedó guardado no mide
-- nada: hay que borrarlo para que nadie lo lea como su resultado.
--
-- Esto las devuelve a in_progress con sus respuestas intactas, así
-- retoman con el mismo enlace donde lo dejaron.

update ts_bat_sessions
set status      = 'in_progress',
    scores      = null,
    validity    = null,
    match_data  = null,
    informe_ia  = null,
    finished_at = null,
    duration_seconds = null,
    updated_at  = now()
where token in (
  'v5_zZQLM_eYdgsgKEnUlbZ6L-Gh0mJpX',  -- Yijiao Wang
  'mbKjxBqTPSysW_kzCH_52C4-78z6s0nS'   -- Judy Guo
);

-- Verificación: las dos deben quedar in_progress, con scores y match en
-- null, y con sus respuestas intactas.
select s.token,
       s.status,
       s.scores is null     as scores_limpio,
       s.match_data is null as match_limpio,
       (select count(*) from ts_bat_answers a where a.session_id = s.id) as respuestas_guardadas
from ts_bat_sessions s
where s.token in (
  'v5_zZQLM_eYdgsgKEnUlbZ6L-Gh0mJpX',
  'mbKjxBqTPSysW_kzCH_52C4-78z6s0nS'
);
