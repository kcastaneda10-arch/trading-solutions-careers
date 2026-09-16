-- ============================================================
-- Adjuntos del candidato · evidencia del proceso de selección
-- Proyecto: mojbhvphztnadndhnraf (elevare-careers)
-- Idempotente. Ejecutar completo en el SQL Editor.
-- ============================================================
-- Qué resuelve: hoy la evidencia de un assessment vive en el
-- computador de quien lo aplicó. Si alguien reclama, o si el
-- proceso se audita, no hay expediente. Esto lo pone en la
-- ficha del candidato, que es donde ya está todo lo demás.

create extension if not exists pgcrypto;

-- 1) Índice de documentos -------------------------------------
create table if not exists ht_candidate_files (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid not null references ht_candidates(id) on delete cascade,
  kind          text not null default 'otro',
  title         text,
  storage_path  text not null unique,
  mime          text,
  bytes         int,
  uploaded_by   text,
  created_at    timestamptz not null default now()
);

create index if not exists ht_candidate_files_cand_idx on ht_candidate_files(candidate_id, created_at desc);
create index if not exists ht_candidate_files_kind_idx on ht_candidate_files(kind);

-- 2) RLS · todo pasa por el service role del backend ----------
-- Son documentos de personas. Sin políticas para anon ni para
-- authenticated: nadie los lee sin pasar por la app, y la app
-- exige sesión de admin en cada llamada.
alter table ht_candidate_files enable row level security;

-- 3) Bucket privado -------------------------------------------
-- Nunca público. Se sirven con URL firmada de una hora.
insert into storage.buckets (id, name, public)
values ('candidate-files', 'candidate-files', false)
on conflict (id) do nothing;

-- 4) Vista de control -----------------------------------------
create or replace view ht_adjuntos_resumen as
select
  f.id,
  c.id            as candidate_id,
  c.name          as candidato,
  v.title         as vacante,
  f.kind          as tipo,
  f.title         as documento,
  f.bytes,
  f.uploaded_by,
  f.created_at
from ht_candidate_files f
join ht_candidates c on c.id = f.candidate_id
left join ht_vacancies v on v.id = c.vacancy_id
order by f.created_at desc;
