-- ============================================================================
-- El líder aporta el insumo del cargo · 26-ago-2026
--
-- POR QUÉ
-- El formulario del líder solo pedía cargo, tipo y motivo. Wellness tenía que
-- inventar la descripción y los requisitos, o perseguir al líder por WhatsApp
-- para que le contara qué hace el puesto.
--
-- Pero tampoco se le pide al líder la versión publicable: un líder describe el
-- cargo en lenguaje interno, y los requisitos escritos sin filtro son donde
-- aparecen los criterios que no se pueden pedir. El líder aporta el insumo en
-- crudo; Wellness lo traduce.
-- ============================================================================

alter table ht_requisitions add column if not exists lead_responsibilities text;
alter table ht_requisitions add column if not exists lead_must_haves text;

select count(*) as columnas_agregadas
from information_schema.columns
where table_name = 'ht_requisitions'
  and column_name in ('lead_responsibilities', 'lead_must_haves');
-- Esperado: 2
