-- ============================================================
-- Batería · seguimiento de la invitación por correo
-- Proyecto: mojbhvphztnadndhnraf (elevare-careers)
-- Idempotente. Ejecutar completo en el SQL Editor.
-- ============================================================

alter table ts_bat_sessions add column if not exists invited_at     timestamptz;
alter table ts_bat_sessions add column if not exists invite_channel text;
alter table ts_bat_sessions add column if not exists invite_count   int not null default 0;

create index if not exists ts_bat_sessions_invited_idx on ts_bat_sessions(invited_at);

-- Quién fue invitado y todavía no ha presentado
create or replace view ts_bat_pendientes as
select
  s.token,
  coalesce(s.candidate_name, '(sin nombre)') as candidato,
  s.candidate_email                          as correo,
  s.vacancy_title                            as vacante,
  s.perfil_cargo                             as perfil,
  s.status,
  s.invited_at,
  s.invite_count,
  date_trunc('minute', now() - s.invited_at) as desde_la_invitacion
from ts_bat_sessions s
where s.invited_at is not null
  and s.status <> 'completed'
order by s.invited_at asc;
