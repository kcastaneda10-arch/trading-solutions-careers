-- ═══════════════════════════════════════════════════════════════
-- 28-ago-2026 · Reinicio de búsqueda y pausas de vacante
--
-- PROBLEMA QUE RESUELVE
-- Dos cosas que pasan todo el tiempo y que el sistema no sabía registrar,
-- así que terminaban castigando el indicador de quien no tomó la decisión:
--
--   1. El área cambia el perfil a mitad de camino. Las hojas de vida que ya
--      se vieron dejan de servir: es una búsqueda nueva, pero el reloj
--      seguía corriendo desde la primera.
--
--   2. El área pide poner el proceso en stand-by — que se siga buscando,
--      pero sin urgencia. Sin registrarlo, esos días se leen como demora
--      del área de Talento. El tiempo de cubrimiento mide la capacidad de
--      cubrir una vacante, no cuánto tarda el negocio en decidir.
--
-- CÓMO SE MIDE A PARTIR DE ACÁ
-- Días calendario  = desde el arranque (o el reinicio), tal cual.
-- Días en pausa    = suma de los tramos de stand-by.
-- Días activos     = calendario − pausa.  ← contra este va el SLA.
--
-- Las dos cifras se reportan juntas, siempre. La neta explica el trabajo
-- del equipo; la bruta es la que vivió el candidato, y esa no se borra.
-- ═══════════════════════════════════════════════════════════════

-- ── 1 · Reinicio de búsqueda ────────────────────────────────────
-- No se pisa la fecha de creación: se agrega el momento desde el cual la
-- búsqueda cuenta. Sobrescribir el original habría hecho desaparecer que
-- la vacante existe desde antes, que es justo lo que alguien va a preguntar.
alter table ht_vacancies add column if not exists search_restarted_at    timestamptz;
alter table ht_vacancies add column if not exists search_restart_reason  text;

comment on column ht_vacancies.search_restarted_at is
  'Desde cuándo cuenta la búsqueda actual. Se pone cuando cambia el perfil: '
  'lo anterior fue otra búsqueda. La fecha de creación no se toca.';

-- ── 2 · Pausas ──────────────────────────────────────────────────
-- Una fila por tramo. ended_at en null = la pausa sigue abierta hoy.
create table if not exists ht_vacancy_holds (
  id            uuid primary key default gen_random_uuid(),
  vacancy_id    uuid not null references ht_vacancies(id) on delete cascade,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  -- Quién la pidió importa tanto como cuándo: el día que alguien pregunte
  -- por qué esta vacante lleva 34 días, la respuesta tiene que tener nombre.
  requested_by  text,
  reason        text,
  created_by    text,
  created_at    timestamptz not null default now(),
  constraint hold_coherente check (ended_at is null or ended_at >= started_at)
);

create index if not exists idx_holds_vacancy on ht_vacancy_holds (vacancy_id, started_at desc);

-- Una sola pausa abierta por vacante: dos tramos abiertos a la vez harían
-- que los días en pausa se contaran dos veces.
create unique index if not exists idx_holds_una_abierta
  on ht_vacancy_holds (vacancy_id) where ended_at is null;

grant select, insert, update on ht_vacancy_holds to service_role;

-- ── 3 · Verificación ────────────────────────────────────────────
select
  (select count(*) from information_schema.columns
     where table_name = 'ht_vacancies'
       and column_name in ('search_restarted_at','search_restart_reason')) as columnas_nuevas,
  (select count(*) from information_schema.tables
     where table_name = 'ht_vacancy_holds') as tabla_pausas;
-- Esperado: columnas_nuevas = 2 · tabla_pausas = 1
