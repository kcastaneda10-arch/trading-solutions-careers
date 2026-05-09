-- ─────────────────────────────────────────────────────────────────
--  Categoría nueva: "Idioma · nivel insuficiente"
--  Aparece en el dropdown del modal "Rechazar candidato".
--  El prefilter ahora también marca como rechazado a candidatos
--  con inglés bajo del mínimo de cada vacante.
-- ─────────────────────────────────────────────────────────────────

INSERT INTO ts_rejection_categories (category_key, category_label, description, sub_details, display_order, public_message_template) VALUES

('idioma_insuficiente',
 'Idioma · nivel insuficiente',
 'El candidato no alcanza el nivel de inglés (u otro idioma) que la posición requiere.',
 '[
   {"key":"ingles_a1_a2","label":"Inglés A1-A2 · vacante requiere B2+"},
   {"key":"ingles_b1","label":"Inglés B1 · vacante requiere B2+"},
   {"key":"ingles_b2_para_c1","label":"Inglés B2 · vacante requiere C1+"},
   {"key":"sin_certificacion","label":"Inglés autorreportado pero sin evidencia / certificación"},
   {"key":"otro_idioma_requerido","label":"Otro idioma requerido (portugués, alemán, etc)"},
   {"key":"comunicacion_oral","label":"Inglés escrito OK · comunicación oral débil"}
 ]'::jsonb,
 25,
 'Hola {firstName}, gracias por tu interés en {vacancy}. Para este rol necesitamos un nivel de inglés más alto del que tienes hoy. Si en el futuro consolidás tu nivel y se abre algo afín, te buscamos.'
)

ON CONFLICT (category_key) DO UPDATE SET
  category_label = EXCLUDED.category_label,
  description = EXCLUDED.description,
  sub_details = EXCLUDED.sub_details,
  display_order = EXCLUDED.display_order,
  public_message_template = EXCLUDED.public_message_template;
