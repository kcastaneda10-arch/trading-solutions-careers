-- ============================================================
-- Batería SIG-SST · esquema de la prueba propia
-- Proyecto Supabase: mojbhvphztnadndhnraf (elevare-careers)
-- Ejecutar completo en el SQL Editor. Es idempotente.
-- ============================================================

-- 1) SESIONES ------------------------------------------------
create table if not exists ts_bat_sessions (
  id                uuid primary key default gen_random_uuid(),
  token             text not null unique,
  battery_version   text not null default '1.1-piloto',
  purpose           text not null default 'piloto',        -- piloto | candidato
  candidate_name    text,
  candidate_email   text,
  ht_candidate_id   uuid,                                   -- opcional: enlaza con ht_candidates
  vacancy_title     text,

  status            text not null default 'created',        -- created|consented|in_progress|completed|invalidated
  modality          text,                                   -- remoto | presencial

  -- Habeas data · evidencia para auditoría
  consent_data_at   timestamptz,
  consent_cam_at    timestamptz,
  consent_text_ver  text,
  consent_ip        text,
  consent_ua        text,

  started_at        timestamptz,
  finished_at       timestamptz,
  duration_seconds  int,

  scores            jsonb,
  validity          jsonb,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists ts_bat_sessions_token_idx on ts_bat_sessions(token);
create index if not exists ts_bat_sessions_status_idx on ts_bat_sessions(status);

-- 2) RESPUESTAS ----------------------------------------------
create table if not exists ts_bat_answers (
  id            bigserial primary key,
  session_id    uuid not null references ts_bat_sessions(id) on delete cascade,
  item_code     text not null,
  block         text not null,
  subdomain     text,
  item_type     text,
  answer        jsonb not null,
  latency_ms    int,
  answered_at   timestamptz not null default now(),
  unique (session_id, item_code)
);

create index if not exists ts_bat_answers_session_idx on ts_bat_answers(session_id);

-- 3) EVENTOS DE PROCTORING -----------------------------------
create table if not exists ts_bat_events (
  id          bigserial primary key,
  session_id  uuid not null references ts_bat_sessions(id) on delete cascade,
  kind        text not null,   -- tab_blur|tab_focus|paste|copy|contextmenu|shortcut|cam_lost|cam_ok|resume|fullscreen_exit
  detail      text,
  item_code   text,
  at          timestamptz not null default now()
);

create index if not exists ts_bat_events_session_idx on ts_bat_events(session_id);

-- 4) CAPTURAS DE CÁMARA --------------------------------------
create table if not exists ts_bat_snapshots (
  id            bigserial primary key,
  session_id    uuid not null references ts_bat_sessions(id) on delete cascade,
  storage_path  text not null,
  block         text,
  item_code     text,
  bytes         int,
  captured_at   timestamptz not null default now()
);

create index if not exists ts_bat_snapshots_session_idx on ts_bat_snapshots(session_id);

-- 5) RLS · todo pasa por el service role del backend ----------
alter table ts_bat_sessions  enable row level security;
alter table ts_bat_answers   enable row level security;
alter table ts_bat_events    enable row level security;
alter table ts_bat_snapshots enable row level security;
-- Sin políticas para anon/authenticated: solo el service_role escribe y lee.

-- 6) BUCKET DE IMÁGENES --------------------------------------
-- Reutiliza el bucket existente 'proctoring-snapshots' bajo el prefijo bateria/.
-- Si no existe, esta línea lo crea privado.
insert into storage.buckets (id, name, public)
values ('proctoring-snapshots', 'proctoring-snapshots', false)
on conflict (id) do nothing;

-- 7) VISTA DE CONTROL ----------------------------------------
create or replace view ts_bat_sesiones_resumen as
select
  s.id,
  s.token,
  s.purpose,
  coalesce(s.candidate_name, '(sin nombre)') as candidato,
  s.status,
  s.battery_version,
  s.started_at,
  s.finished_at,
  round(s.duration_seconds / 60.0, 1)              as minutos,
  (select count(*) from ts_bat_answers   a where a.session_id = s.id) as respuestas,
  (select count(*) from ts_bat_snapshots p where p.session_id = s.id) as capturas,
  (select count(*) from ts_bat_events    e where e.session_id = s.id
     and e.kind in ('tab_blur','paste','copy','contextmenu','shortcut','cam_lost')) as alertas,
  s.scores,
  s.validity
from ts_bat_sessions s
order by s.created_at desc;
