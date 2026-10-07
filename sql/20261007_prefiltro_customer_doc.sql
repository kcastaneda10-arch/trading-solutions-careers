-- ============================================================
-- Prefiltro de Customer Documentation · asignar el cuestionario
-- Proyecto: mojbhvphztnadndhnraf (elevare-careers)
-- Idempotente. Ejecutar completo en el SQL Editor.
-- ============================================================
-- Esto NO crea la vacante: la vacante nace desde la requisición o
-- desde la sincronización con la web. Lo único que hace es dejarle
-- el cuestionario correcto.
--
-- Por qué importa: cuando `form_template_key` está vacío, el ATS cae
-- al cuestionario de comex y le pregunta por años en pricing y por
-- liderazgo de equipos a alguien que va a radicar órdenes y conciliar
-- facturas. El candidato se confunde y el dato no sirve para decidir.
--
-- Si la vacante se crea con la sincronización desde la web y su slug
-- dice «customer-documentation», el template se asigna solo y esto
-- no hace falta. Queda igual, por si la vacante se crea a mano.

-- 1) Ver qué hay antes de tocar nada -------------------------
select id, title, status, form_template_key, created_at
  from ht_vacancies
 where title ilike '%customer%document%'
 order by created_at desc;

-- 2) Asignar el cuestionario a la vacante ABIERTA ------------
-- Solo toca las abiertas: las cerradas conservan el cuestionario con
-- el que respondieron sus candidatos, que es parte del expediente.
update ht_vacancies
   set form_template_key = 'customer_doc'
 where title ilike '%customer%document%'
   and (status is null or status = 'open')
   and coalesce(form_template_key, '') <> 'customer_doc';

-- 3) Verificación --------------------------------------------
select id, title, status, form_template_key
  from ht_vacancies
 where title ilike '%customer%document%'
 order by created_at desc;

-- ── Nota sobre la banda salarial ──────────────────────────────
-- El tope de $3.500.000 vive en el código, en TEMPLATE_SALARY_CAP, y
-- aplica a cualquier vacante con este cuestionario. Si esta vacante
-- en particular necesita otro tope, se agrega su id a SALARY_CAPS en
-- src/app/api/headhunting/prefilter/[token]/route.ts, que manda sobre
-- el del template.
--
-- Lo mismo con el inglés: el mínimo es A2 por template. Nadie queda
-- rechazado por eso — el prefiltro marca y una persona decide.
