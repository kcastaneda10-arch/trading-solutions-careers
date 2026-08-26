-- ============================================================================
-- REQUISICIONES · el circuito líder → Wellness → CWO → vacante publicada
-- 26-ago-2026
--
-- POR QUÉ ACÁ Y NO EN WXM
-- La requisición se pide desde WXM pero vive en el ATS, en una sola fila. Si
-- WXM guardara su copia y le mandara otra al ATS, en cuanto Wellness editara
-- el perfil o el CWO aprobara habría dos versiones en dos bases distintas y
-- nada que las mantuviera iguales. Es exactamente lo que venimos pagando
-- entre Neon y Supabase con las vacantes.
--
-- WXM escribe una vez (crear) y después solo lee. Todas las decisiones pasan
-- por el HR Panel.
--
-- Es idempotente: se puede correr más de una vez sin romper nada.
-- ============================================================================

-- ─── 1) La requisición ──────────────────────────────────────────────────────
create table if not exists ht_requisitions (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null,

  -- Quién la pide. El correo corporativo es lo único que existe en los tres
  -- lados (maestra de personal, wxm_usuarios y el ATS): es el pegamento.
  lead_email        text not null,
  lead_name         text,
  area              text,

  -- Lo que llena el líder
  title             text not null,
  requisition_type  text not null default 'incremental'
                    check (requisition_type in ('reemplazo','incremental')),
  reason            text,
  needed_by         date,

  -- Lo que agrega Wellness al armar el perfil
  job_description   text,
  requirements      text,
  salary_cap_cop    bigint,
  form_template_key text,
  english_required  boolean default false,

  -- El circuito. Los cinco estados del diagrama, más 'devuelta' y 'rechazada'.
  --   pedida     · la creó el líder, nadie la tocó
  --   con_perfil · Wellness la completó, espera al CWO
  --   devuelta   · Wellness se la regresó al líder con un comentario
  --   aprobada   · el CWO dijo que sí; acá nace la vacante
  --   rechazada  · el CWO dijo que no
  --   publicada  · ya está montada en al menos una fuente
  status            text not null default 'pedida'
                    check (status in ('pedida','con_perfil','devuelta','aprobada','rechazada','publicada')),

  -- approved_at es el ancla del TTF: los 22 días se cuentan desde acá, no
  -- desde que el líder la pidió. El tiempo de aprobación no le cuenta en
  -- contra a Wellness, pero sí queda visible para el líder.
  approved_at       timestamptz,
  approved_by       text,
  decision_note     text,

  -- La vacante que nació de esta requisición.
  vacancy_id        uuid references ht_vacancies(id) on delete set null,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_req_lead   on ht_requisitions (lead_email);
create index if not exists idx_req_status on ht_requisitions (client_id, status);

-- ─── 2) Historial de decisiones ─────────────────────────────────────────────
-- Sin esto, "¿por qué esta requisición lleva 9 días parada?" no tiene
-- respuesta. Cada movimiento deja rastro de quién y cuándo.
create table if not exists ht_requisition_events (
  id             uuid primary key default gen_random_uuid(),
  requisition_id uuid not null references ht_requisitions(id) on delete cascade,
  from_status    text,
  to_status      text not null,
  actor_email    text,
  note           text,
  changed_at     timestamptz not null default now(),
  unique (requisition_id, to_status, changed_at)
);

create index if not exists idx_req_ev on ht_requisition_events (requisition_id, changed_at);

-- ─── 3) Quién es el líder de cada vacante ───────────────────────────────────
-- ht_vacancies no guardaba esto. Sin el campo no hay forma de saber cuáles
-- son "las vacantes de" un líder, y sin eso el tablero no puede existir.
alter table ht_vacancies add column if not exists hiring_lead_email text;
alter table ht_vacancies add column if not exists requisition_id uuid;

create index if not exists idx_vac_lead on ht_vacancies (hiring_lead_email);

-- ─── 4) Dónde se publicó cada vacante ───────────────────────────────────────
-- Hoy se publica a mano en LinkedIn, Turpial y Magneto y no queda registro,
-- así que no se puede responder de qué fuente llega la gente que sirve.
create table if not exists ht_vacancy_postings (
  id           uuid primary key default gen_random_uuid(),
  vacancy_id   uuid not null references ht_vacancies(id) on delete cascade,
  source       text not null
               check (source in ('careers','linkedin','turpial','magneto','referidos','otro')),
  posted_at    timestamptz not null default now(),
  posted_by    text,
  external_url text,
  notes        text,
  unique (vacancy_id, source)
);

create index if not exists idx_posting_vac on ht_vacancy_postings (vacancy_id);

-- ─── Verificación ───────────────────────────────────────────────────────────
select
  (select count(*) from information_schema.tables
     where table_name in ('ht_requisitions','ht_requisition_events','ht_vacancy_postings')) as tablas_creadas,
  (select count(*) from information_schema.columns
     where table_name = 'ht_vacancies' and column_name in ('hiring_lead_email','requisition_id')) as columnas_agregadas;
-- Debe devolver: tablas_creadas = 3 · columnas_agregadas = 2
