-- ─────────────────────────────────────────────────────────────────
--  Sistema de motivos de rechazo · clasificación + CV Bank reactivation
--
--  7 categorías × N sub-detalles · nota privada (interna) + nota pública
--  (lo que llega al candidato) · flag save_for_future para rediscovery.
--
--  El catálogo vive en ts_rejection_categories (editable vía UI). Cada
--  rechazo guarda category_key + sub_detail_key + notas + save_for_future
--  en ht_candidates (denormalizado para queries rápidas en Funnel/Reportes).
-- ─────────────────────────────────────────────────────────────────

-- 1. Catálogo de categorías + sub-detalles
CREATE TABLE IF NOT EXISTS ts_rejection_categories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key    TEXT UNIQUE NOT NULL,
  category_label  TEXT NOT NULL,
  description     TEXT,
  sub_details     JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- public_message_template: copy sugerido para enviar al candidato (lo edita Kelly antes de mandar)
  public_message_template TEXT,
  display_order   INTEGER DEFAULT 0,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Columnas en ht_candidates para guardar el rechazo
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS rejection_category   TEXT;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS rejection_sub_detail TEXT;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS rejection_note_private TEXT;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS rejection_note_public  TEXT;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS rejection_save_for_future BOOLEAN DEFAULT FALSE;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS rejected_by  TEXT;
ALTER TABLE ht_candidates ADD COLUMN IF NOT EXISTS rejected_at  TIMESTAMPTZ;

-- Index para queries de reporting · "rechazados por categoría en Q actual"
CREATE INDEX IF NOT EXISTS idx_ht_candidates_rejection_category ON ht_candidates(rejection_category) WHERE stage = 'rechazado';
CREATE INDEX IF NOT EXISTS idx_ht_candidates_rejected_at ON ht_candidates(rejected_at DESC) WHERE stage = 'rechazado';
CREATE INDEX IF NOT EXISTS idx_ht_candidates_save_for_future ON ht_candidates(rejection_save_for_future) WHERE stage = 'rechazado' AND rejection_save_for_future = TRUE;

-- 3. Seed · 7 categorías iniciales
INSERT INTO ts_rejection_categories (category_key, category_label, description, sub_details, display_order, public_message_template) VALUES

('experiencia_insuficiente',
 'Experiencia insuficiente',
 'El perfil no tiene los años o el tipo de experiencia que la posición requiere hoy.',
 '[
   {"key":"anos_industria","label":"Pocos años en la industria"},
   {"key":"sin_experiencia_rol","label":"Sin experiencia en el rol específico"},
   {"key":"industria_distinta","label":"Industria muy distinta · curva alta"},
   {"key":"sin_liderazgo","label":"Sin experiencia liderando equipo"},
   {"key":"sin_resultados_medibles","label":"Sin resultados medibles documentados"}
 ]'::jsonb,
 10,
 'Hola {firstName}, gracias por tomar el tiempo para conversar con nosotros. Después de revisar tu perfil contra lo que la posición de {vacancy} demanda hoy, decidimos avanzar con candidatos que tienen experiencia más cercana al rol. Esto no es un cierre · si en algún momento tu trayectoria se acerca más a otra de nuestras búsquedas, te buscamos.'
),

('match_cultural',
 'Match cultural · soft skills',
 'Habilidades blandas o estilo de trabajo no encajan con la cultura TS o el equipo específico.',
 '[
   {"key":"comunicacion","label":"Comunicación poco clara · escrita u oral"},
   {"key":"autonomia","label":"Necesita más estructura de la que damos"},
   {"key":"energia","label":"Energía o ritmo no encaja con el equipo"},
   {"key":"ownership","label":"Falta ownership · enfoque más reactivo que proactivo"},
   {"key":"colaboracion","label":"Estilo más individual que colaborativo"},
   {"key":"otro_soft","label":"Otro soft skill · ver nota"}
 ]'::jsonb,
 20,
 'Hola {firstName}, gracias por la conversación. Después de evaluar el conjunto, sentimos que tu estilo y el de nuestro equipo no se complementan tanto como necesitamos para esta posición. Te deseamos lo mejor en tu búsqueda.'
),

('pretension_salarial',
 'Pretensión salarial fuera de rango',
 'La expectativa salarial está significativamente sobre o bajo nuestra banda.',
 '[
   {"key":"sobre_banda","label":"Sobre nuestra banda · gap grande"},
   {"key":"sobre_banda_marginal","label":"Sobre banda · gap manejable pero candidato no flexibiliza"},
   {"key":"bajo_banda","label":"Muy bajo banda · señal de subvaloración o experiencia menor"},
   {"key":"beneficios","label":"Esquema de beneficios no encaja"},
   {"key":"modalidad","label":"Modalidad de contratación no encaja"}
 ]'::jsonb,
 30,
 'Hola {firstName}, gracias por la transparencia con tus expectativas. Para esta posición no podemos llegar al rango que necesitas. Si en el futuro abrimos una posición que se acomode mejor, te avisamos.'
),

('disponibilidad_movilidad',
 'Disponibilidad · movilidad',
 'Horario, ubicación, viajes, fecha de inicio no son compatibles con la posición.',
 '[
   {"key":"ubicacion","label":"No puede vivir en Barranquilla · presencial requerido"},
   {"key":"horario","label":"Horario incompatible"},
   {"key":"viajes","label":"No puede viajar · requerido por el rol"},
   {"key":"fecha_inicio","label":"Fecha de inicio muy lejana"},
   {"key":"contrato","label":"Restricciones contractuales · cláusulas previas"}
 ]'::jsonb,
 40,
 'Hola {firstName}, gracias por todo el interés. Las condiciones de la posición no se ajustan a tu disponibilidad actual. Te tenemos presente para próximas búsquedas que se acomoden mejor.'
),

('resultado_evaluacion',
 'Resultado de evaluación',
 'Assessment, prueba técnica, entrevista IA o batería psicométrica no alcanzaron el umbral.',
 '[
   {"key":"assessment_bajo","label":"Assessment virtual · score bajo"},
   {"key":"ai_interview_bajo","label":"Entrevista IA · score bajo"},
   {"key":"prefilter_bajo","label":"Prefilter · respuestas no convencen"},
   {"key":"prueba_tecnica","label":"Prueba técnica · no alcanza"},
   {"key":"bateria_psico","label":"Batería psicométrica · perfil no encaja"},
   {"key":"red_flag_proctor","label":"Red flag de proctoring · honestidad cuestionada"}
 ]'::jsonb,
 50,
 'Hola {firstName}, gracias por completar el proceso. Después de ver los resultados de la evaluación, decidimos no avanzar a la siguiente etapa. Apreciamos mucho el tiempo que nos diste.'
),

('comunicacion_proceso',
 'Comunicación · proceso',
 'No respondió, no se presentó, retiró interés sin formalizar, problemas de seguimiento.',
 '[
   {"key":"ghosting","label":"Ghosting · no respondió a recordatorios"},
   {"key":"no_show","label":"No se presentó a entrevista o evaluación"},
   {"key":"retiro_interes","label":"Comunicó que ya no le interesa"},
   {"key":"otra_oferta","label":"Aceptó otra oferta · contraoferta no avanzó"},
   {"key":"comunicacion_dificil","label":"Comunicación difícil · seguimiento desgastante"}
 ]'::jsonb,
 60,
 'Hola {firstName}, no logramos retomar contacto. Si tu interés sigue activo, escríbeme y vemos. De lo contrario, dejamos tu perfil en nuestra base por si se abre algo que te calce mejor.'
),

('decision_candidato',
 'Decisión del candidato',
 'El candidato se retiró del proceso por su propia decisión.',
 '[
   {"key":"acepta_otra_oferta","label":"Aceptó otra oferta"},
   {"key":"contraoferta_actual","label":"Aceptó contraoferta de su empleo actual"},
   {"key":"no_es_momento","label":"No es el momento personal · pausa"},
   {"key":"cambio_intereses","label":"Cambió de intereses · ya no le encaja el rol"},
   {"key":"otra_razon","label":"Otra razón · ver nota"}
 ]'::jsonb,
 70,
 'Hola {firstName}, gracias por avisarnos. Te deseamos lo mejor en tu nuevo paso · y como te dijimos, mantenemos tu perfil para futuras búsquedas que puedan calzarte mejor.'
)

ON CONFLICT (category_key) DO UPDATE SET
  category_label = EXCLUDED.category_label,
  description = EXCLUDED.description,
  sub_details = EXCLUDED.sub_details,
  display_order = EXCLUDED.display_order,
  public_message_template = EXCLUDED.public_message_template;

-- 4. Sincronizar open_to_rediscovery con rejection_save_for_future
-- Cuando guardamos un rechazo con save_for_future=true, también se prende open_to_rediscovery
-- para que el CV Bank lo considere.
CREATE OR REPLACE FUNCTION ts_sync_rediscovery_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage = 'rechazado' AND NEW.rejection_save_for_future = TRUE THEN
    NEW.open_to_rediscovery := TRUE;
  ELSIF NEW.stage = 'rechazado' AND NEW.rejection_save_for_future = FALSE THEN
    NEW.open_to_rediscovery := FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_rediscovery_flag ON ht_candidates;
CREATE TRIGGER trg_sync_rediscovery_flag
  BEFORE INSERT OR UPDATE OF rejection_save_for_future, stage ON ht_candidates
  FOR EACH ROW
  EXECUTE FUNCTION ts_sync_rediscovery_flag();
