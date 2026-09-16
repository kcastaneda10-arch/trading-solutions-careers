-- ============================================================
-- Evaluación del candidato contra la rúbrica del cargo
-- Proyecto: mojbhvphztnadndhnraf (elevare-careers)
-- Idempotente. Ejecutar completo en el SQL Editor.
-- ============================================================
-- Qué guarda: el veredicto criterio por criterio con su cita, los
-- niveles que cargó Wellness a mano, y los dos puntajes con su
-- cobertura. Se guarda cada corrida, no se pisa: si alguien
-- reclama una decisión de hace tres meses, hay que poder mostrar
-- con qué rúbrica y con qué evidencia se tomó ese día.

create extension if not exists pgcrypto;

create table if not exists ht_candidate_evaluations (
  id                  uuid primary key default gen_random_uuid(),
  candidate_id        uuid not null references ht_candidates(id) on delete cascade,

  -- Con qué regla se calificó. La versión importa: una rúbrica v2
  -- no compara contra una v1 y el ranking tiene que poder decirlo.
  rubrica_key         text not null,
  rubrica_version     text not null,

  run_at              timestamptz not null default now(),
  modelo              text,

  -- Un objeto por criterio: estado, nivel, cita textual, archivo y
  -- la pregunta de entrevista cuando quedó sin evidencia.
  veredictos          jsonb not null default '[]'::jsonb,

  -- Lo que califica una persona que estuvo en la sala (assessment,
  -- juego de roles, entrevista). El agente no los toca.
  niveles_manuales    jsonb not null default '{}'::jsonb,

  -- Los dos ejes van separados a propósito. Promediarlos esconde
  -- justo lo que hay que ver.
  capacidad_puntaje   numeric(4,2),
  capacidad_cobertura int,
  ajuste_puntaje      numeric(4,2),
  ajuste_cobertura    int,

  bloqueado_por       jsonb not null default '[]'::jsonb,
  semaforo            text not null default 'falta_evidencia',

  documentos_leidos   jsonb not null default '[]'::jsonb,
  documentos_omitidos jsonb not null default '[]'::jsonb,

  created_at          timestamptz not null default now()
);

create index if not exists ht_cand_eval_cand_idx
  on ht_candidate_evaluations(candidate_id, run_at desc);
create index if not exists ht_cand_eval_rubrica_idx
  on ht_candidate_evaluations(rubrica_key, run_at desc);

-- RLS: son juicios sobre personas. Todo pasa por el service role
-- del backend, y la app exige sesión de admin en cada llamada.
alter table ht_candidate_evaluations enable row level security;

-- Última evaluación por candidato. Es la que usa el Funnel para
-- ordenar, sin traerse el histórico completo.
create or replace view ht_evaluacion_vigente as
select distinct on (e.candidate_id)
  e.*,
  c.name       as candidato,
  c.stage      as etapa,
  v.title      as vacante
from ht_candidate_evaluations e
join ht_candidates c on c.id = e.candidate_id
left join ht_vacancies v on v.id = c.vacancy_id
order by e.candidate_id, e.run_at desc;
