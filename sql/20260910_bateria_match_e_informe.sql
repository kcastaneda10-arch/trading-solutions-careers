-- ============================================================
-- Batería · match con el cargo e informe del agente psicólogo
-- Proyecto: mojbhvphztnadndhnraf (elevare-careers)
-- Idempotente. Ejecutar completo en el SQL Editor.
-- ============================================================

alter table ts_bat_sessions add column if not exists perfil_cargo text;
alter table ts_bat_sessions add column if not exists match_data   jsonb;
alter table ts_bat_sessions add column if not exists informe_ia   jsonb;

create index if not exists ts_bat_sessions_perfil_idx on ts_bat_sessions(perfil_cargo);

-- Ranking listo para consultar desde el SQL Editor
create or replace view ts_bat_ranking as
select
  s.token,
  coalesce(s.candidate_name, '(sin nombre)')            as candidato,
  s.candidate_email                                     as correo,
  s.perfil_cargo                                        as perfil,
  (s.match_data ->> 'global')::int                      as match,
  (s.validity  ->> 'veredicto')                         as validez,
  jsonb_array_length(coalesce(s.match_data -> 'alertas', '[]'::jsonb)) as alertas,
  s.battery_version,
  s.finished_at
from ts_bat_sessions s
where s.status = 'completed' and s.match_data is not null
order by (s.match_data ->> 'global')::int desc nulls last;
