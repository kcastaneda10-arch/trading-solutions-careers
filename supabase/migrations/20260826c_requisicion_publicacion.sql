-- ============================================================================
-- Lo que falta para publicar una vacante nacida de una requisición
-- 26-ago-2026
--
-- POR QUÉ
-- Al aprobar, la vacante nace en ht_vacancies y el proceso arranca — pero para
-- publicarla en careers y en los portales hacen falta datos que la requisición
-- nunca pidió: dónde es el trabajo, si es presencial, qué se dice del salario,
-- y el texto en inglés. Sin eso el botón de publicar no tiene qué escribir.
-- ============================================================================

alter table ht_requisitions add column if not exists location        text;
alter table ht_requisitions add column if not exists work_mode       text;
alter table ht_requisitions add column if not exists salary_public   text;
alter table ht_requisitions add column if not exists nice_to_have    text;

-- El aviso separa el párrafo de contexto de la lista de tareas ("What You'll
-- Do"). Mezclados en un solo campo no se puede armar el formato estándar.
alter table ht_requisitions add column if not exists responsibilities text;

-- El post estándar de la compañía se publica en inglés, y careers tiene las
-- dos versiones. Si el inglés queda vacío, la página cae al español.
alter table ht_requisitions add column if not exists title_en        text;
alter table ht_requisitions add column if not exists description_en  text;
alter table ht_requisitions add column if not exists requirements_en text;
alter table ht_requisitions add column if not exists nice_to_have_en text;
alter table ht_requisitions add column if not exists responsibilities_en text;

-- Una frase corta que abre el aviso: "to connect markets, build international
-- agent networks, and take our global operations to the next level".
alter table ht_requisitions add column if not exists hook_en         text;

-- El id de la vacante en Neon, para no tener que buscarla por título después.
alter table ht_requisitions add column if not exists web_vacancy_id  integer;

select count(*) as columnas
from information_schema.columns
where table_name = 'ht_requisitions'
  and column_name in ('location','work_mode','salary_public','nice_to_have',
                      'title_en','description_en','requirements_en',
                      'nice_to_have_en','hook_en','web_vacancy_id',
                      'responsibilities','responsibilities_en');
-- Esperado: 12
