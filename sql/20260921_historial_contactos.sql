-- ============================================================
-- Historial de contactos del candidato · trazabilidad del proceso
-- Proyecto: mojbhvphztnadndhnraf (elevare-careers)
-- Idempotente. Ejecutar completo en el SQL Editor.
-- ============================================================
-- Qué resuelve: hoy cada contacto con un candidato vive donde se
-- hizo — el correo en Gmail, el WhatsApp en el celular de quien lo
-- mandó — y el ATS solo sabe la etapa. Si alguien pregunta «¿a esta
-- persona le escribimos? ¿cuándo? ¿qué contestó?», la respuesta
-- exige abrir tres aplicaciones. Esto junta todo en la ficha.
--
-- Una fila = un mensaje o un contacto. De dónde vino queda en
-- `source`, para distinguir lo que se leyó de Gmail (verificado)
-- de lo que alguien anotó a mano.

create extension if not exists pgcrypto;

-- 1) Tabla de contactos ---------------------------------------
create table if not exists ht_contact_events (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid not null references ht_candidates(id) on delete cascade,
  vacancy_id    uuid,

  -- Por dónde
  channel       text not null
                check (channel in ('email','whatsapp','llamada','presencial','otro')),
  -- Quién escribió a quién
  direction     text not null
                check (direction in ('saliente','entrante')),
  -- Qué fue: invitacion_prueba, recordatorio, rechazo, prefiltro,
  -- acuse, entrevista, respuesta… Libre, lo pone el clasificador.
  kind          text,

  occurred_at   timestamptz not null,
  summary       text,          -- asunto del correo o primeras líneas
  body          text,          -- texto completo (WhatsApp importado, notas)

  -- De dónde salió el registro:
  --   gmail_sync       leído de la bandeja · verificado
  --   whatsapp_export  importado del chat exportado · verificado
  --   whatsapp_boton   se abrió WhatsApp desde el ATS · intento, no confirma envío
  --   manual           lo anotó una persona
  --   sistema          lo generó el ATS
  source        text not null
                check (source in ('gmail_sync','whatsapp_export','whatsapp_boton','manual','sistema')),
  -- Id de origen para no duplicar al volver a sincronizar:
  -- id del mensaje en Gmail, o huella de la línea del chat.
  external_id   text,
  thread_id     text,
  -- intento = se abrió el canal pero no hay confirmación de envío
  status        text not null default 'confirmado'
                check (status in ('confirmado','intento','borrador')),

  created_by    text,
  created_at    timestamptz not null default now()
);

-- Re-sincronizar o re-importar el mismo chat no duplica filas.
-- Índice completo (no parcial) para que el upsert pueda usarlo: los
-- registros manuales van con external_id nulo y los nulos no chocan.
create unique index if not exists ht_contact_events_origen_uq
  on ht_contact_events(source, external_id);

create index if not exists ht_contact_events_cand_idx
  on ht_contact_events(candidate_id, occurred_at desc);
create index if not exists ht_contact_events_fecha_idx
  on ht_contact_events(occurred_at desc);

-- 2) Cuándo se revisó Gmail por última vez para cada candidato --
-- Sirve para que el cron recorra primero a quien lleva más tiempo
-- sin revisar, y para que la ficha sepa si su historial está al día.
alter table ht_candidates
  add column if not exists contactos_sync_at timestamptz;

-- 3) RLS · todo pasa por el service role del backend ----------
-- Son conversaciones con personas. Sin políticas para anon ni
-- authenticated: solo la app, con sesión de admin, las lee.
alter table ht_contact_events enable row level security;

-- 4) Verificación ---------------------------------------------
select
  (select count(*) from information_schema.tables
    where table_name = 'ht_contact_events')                        as tabla_creada,
  (select count(*) from information_schema.columns
    where table_name = 'ht_candidates'
      and column_name = 'contactos_sync_at')                       as columna_sync;
