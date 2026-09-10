-- ============================================================================
-- El líder aporta más contexto del cargo · 10-sep-2026
--
-- POR QUÉ
-- El insumo del líder solo tenía "qué hace" y "qué no puede faltar". Wellness
-- seguía teniendo que perseguirlo para lo básico que necesita para montar la
-- vacante: a quién reporta, ubicación, modalidad, herramientas, inglés,
-- formación/experiencia deseada y un tope salarial orientativo.
--
-- Igual que el resto del insumo del líder: es CRUDO, en el lenguaje del área.
-- Wellness lo formaliza en el perfil publicable; no se copia solo. Se guarda
-- como JSON en una sola columna para no ensanchar la tabla cada vez que se
-- agrega un campo de contexto.
-- ============================================================================

alter table ht_requisitions add column if not exists lead_profile jsonb;

comment on column ht_requisitions.lead_profile is
  'Contexto ampliado que aporta el líder (reporta_a, posiciones, ubicacion, modalidad, herramientas, ingles_nivel, ingles_para, formacion, experiencia, competencias, salario_tope). Insumo en crudo; Wellness lo formaliza.';

select count(*) as columnas_agregadas
from information_schema.columns
where table_name = 'ht_requisitions' and column_name = 'lead_profile';
-- Esperado: 1
