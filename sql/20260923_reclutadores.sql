-- ============================================================
-- Reclutadores y dueño de vacante
-- Proyecto: mojbhvphztnadndhnraf (elevare-careers)
-- Idempotente. Ejecutar completo en el SQL Editor.
-- ============================================================
-- Qué resuelve: hoy el ATS no sabe de quién es cada proceso. Todo
-- sale del mismo buzón, con la misma agenda y la misma firma, y las
-- métricas de gestión son un solo montón. Con varias personas
-- reclutando eso deja de servir: no se sabe a quién reclamarle un
-- candidato sin mover, ni con qué agenda citar.
--
-- Una fila en ts_recruiters = una persona del equipo de Talent.
-- Cada vacante apunta a su dueño (responde por el proceso) y, si
-- hace falta, a un apoyo (puede operarla igual: vacaciones, relevo).
--
-- Esto NO cambia permisos todavía: el ATS sigue entrando con la
-- misma llave. Es la base para el login por persona, que viene
-- después. Lo que sí cambia de inmediato: la agenda y la firma de
-- los correos de citación salen del dueño de la vacante.

create extension if not exists pgcrypto;

-- 1) Personas del equipo --------------------------------------
create table if not exists ts_recruiters (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  -- Correo corporativo. Es la identidad: cuando exista el login por
  -- persona, esta es la cuenta de Google con la que entra.
  email         text not null,
  rol           text not null default 'reclutador'
                check (rol in ('talent_lead','reclutador','hiring_manager')),
  -- Como firma en los correos: «Talent Acquisition Lead · Trading Solutions»
  cargo         text,
  -- Enlace público de agendamiento (Calendly u otro)
  calendly_url  text,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Un correo, una persona. Sin distinguir mayúsculas: el mismo correo
-- escrito de dos formas no puede ser dos usuarios distintos.
create unique index if not exists ts_recruiters_email_uniq
  on ts_recruiters (lower(email));

alter table ts_recruiters enable row level security;
-- Sin policies a propósito: solo el service_role del ATS entra aquí.

-- 2) Dueño y apoyo de cada vacante ----------------------------
alter table ht_vacancies
  add column if not exists owner_recruiter_id uuid references ts_recruiters(id) on delete set null;
alter table ht_vacancies
  add column if not exists support_recruiter_id uuid references ts_recruiters(id) on delete set null;

create index if not exists idx_ht_vacancies_owner on ht_vacancies(owner_recruiter_id);

-- 3) Estado inicial -------------------------------------------
-- Kelly entra como Talent Lead y queda de dueña de todo lo que hay.
-- Reasignar una vacante después es un clic en el ATS; empezar con
-- vacantes huérfanas, en cambio, deja correos sin firma y sin agenda.
insert into ts_recruiters (nombre, email, rol, cargo, calendly_url)
values (
  'Kelly Castañeda',
  'k.castaneda@tradingsolutions.com',
  'talent_lead',
  'Talent Acquisition and Development Lead · Trading Solutions',
  'https://calendly.com/k-castaneda-tradingsolutions/30min'
)
on conflict do nothing;

update ht_vacancies
   set owner_recruiter_id = (
         select id from ts_recruiters
          where lower(email) = 'k.castaneda@tradingsolutions.com'
       )
 where owner_recruiter_id is null;

-- 4) Verificación ---------------------------------------------
select
  (select count(*) from ts_recruiters)                              as reclutadores,
  (select count(*) from ht_vacancies where owner_recruiter_id is not null) as vacantes_con_dueno,
  (select count(*) from ht_vacancies where owner_recruiter_id is null)     as vacantes_sin_dueno;
