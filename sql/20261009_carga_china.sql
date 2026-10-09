-- ============================================================
-- Pruebas externas · cargar lo de China (Zijian Zhou y Ali LI)
-- Proyecto: mojbhvphztnadndhnraf (elevare-careers)
-- Idempotente. Correr DESPUÉS de 20261009_pruebas_externas.sql
-- ============================================================
-- De dónde salen estos datos: de la bandeja de k.castaneda y del tablero de
-- TuringLab, leídos el 9 de octubre de 2026. Son los dos candidatos de la
-- vacante de China que pasan a entrevista; a los demás no se les aplicaron
-- estas pruebas, y por eso no aparecen aquí.
--
-- POR QUÉ FALTAN DOS PROVEEDORES EN EL CATÁLOGO
-- Al proceso de China no se le mandó el DISC de la cuenta corporativa
-- (disc-prime) sino el gratuito de myDISCprofile, y además un assessment
-- situacional en Tally. Son dos instrumentos distintos de los que ya estaban
-- sembrados: se agregan en vez de reusar la fila de otro, porque mezclarlos
-- haría que el informe cite un proveedor que nadie aplicó.

-- ── 1) Los dos proveedores que faltaban ──────────────────────
insert into ts_test_providers (key, nombre, categoria, portal_url, via, campos, notas)
values
  ('disc_free', 'DISC · myDISCprofile', 'estilo',
   'https://www.mydiscprofile.com/en-us/free-personality-test.php', 'candidato',
   '["tipo","palabras_clave"]'::jsonb,
   'Versión gratuita. El informe lo recibe el candidato y lo reenvía. No entrega los cuatro ejes numéricos, solo el tipo.'),

  ('assessment_tally', 'Assessment situacional (Tally)', 'situacional',
   'https://tally.so/r/Pdg8EB', 'manual',
   '["respondido"]'::jsonb,
   'Formulario propio. Las respuestas viven en la cuenta de Tally.')
on conflict (lower(key)) do update
  set nombre = excluded.nombre, categoria = excluded.categoria,
      portal_url = excluded.portal_url, via = excluded.via,
      campos = excluded.campos, notas = excluded.notas, updated_at = now();

-- ── 2) Los resultados ────────────────────────────────────────
-- Se cruza por correo y vacante en vez de por id escrito a mano: si alguien
-- reconstruyó la ficha, el correo sigue siendo el mismo y esto no se rompe.
with v as (
  select '9be8d3da-8fdd-4fc5-84d6-68fb5ee3f383'::uuid as vacancy_id,
         '98b62872-5767-4815-9b49-1394b9527c1f'::uuid as client_id
),
datos (correo, proveedor, estado, presentada, resumen, puntajes, notas) as (
  values
  -- ── Zijian Zhou ──────────────────────────────────────────
  ('zhouzijian7@gmail.com', '16personalities', 'cargada', date '2026-10-08',
   'INTJ-A · Architect',
   '{"tipo":"INTJ-A","rol":"Architect"}'::jsonb,
   'Informe en PDF enviado por el candidato el 8-oct.'),

  ('zhouzijian7@gmail.com', 'disc_free', 'cargada', date '2026-10-08',
   'Consultant · metódico, analítico, reservado, evita el riesgo',
   '{"tipo":"Consultant","palabras_clave":"consistente, reservado, analítico, técnico, práctico, confiable, brusco, reticente"}'::jsonb,
   'Busca regularidad y que las cosas sigan un patrón predecible. El informe gratuito no entrega los cuatro ejes.'),

  ('zhouzijian7@gmail.com', 'turing', 'presentada', date '2026-10-08',
   '5 de 7 problemas · sin calificar en el portal',
   '{"problemas":"5/7","nota":null}'::jsonb,
   'Aparece como UNGRADED en el tablero de TuringLab. Hasta que tenga nota, el 5 de 7 no se compara con nadie.'),

  ('zhouzijian7@gmail.com', 'motivacion', 'pendiente', null,
   'No aparece en el panel, aunque escribió que había completado todo',
   null,
   'Revisar con María José cuál de los dos despliegues se le envió: a los candidatos les llega motivations-pg, y el panel que se revisa es el de Railway.'),

  ('zhouzijian7@gmail.com', 'assessment_tally', 'enviada', null,
   'Dice haberlo hecho · sin verificar en la cuenta de Tally',
   null, null),

  -- ── Ali LI Yi Chun · en el ATS figura como LI I YICHUN ───
  ('aliupup2018@gmail.com', '16personalities', 'cargada', date '2026-10-07',
   'ENTJ-A · Commander',
   '{"tipo":"ENTJ-A","rol":"Commander","extravertido":98,"intuitivo":77,"pensamiento":89,"juicio":92,"asertivo":90}'::jsonb,
   'Perfil público: 16personalities.com/profiles/a1fa85ae1e9ef'),

  ('aliupup2018@gmail.com', 'disc_free', 'cargada', date '2026-10-07',
   'Balanced · la plataforma no pudo emitir informe',
   '{"tipo":"Balanced"}'::jsonb,
   'myDISCprofile declara que ningún factor se separa del promedio y recomienda repetir la prueba. No es un resultado utilizable: o se repite o no se cuenta.'),

  ('aliupup2018@gmail.com', 'turing', 'pendiente', null,
   'Sin presentar · el enlace y el código no fueron reconocidos',
   null,
   'Lo reportó el 7-oct. Se le volvió a pedir el reenvío a María José el 9-oct.'),

  ('aliupup2018@gmail.com', 'motivacion', 'pendiente', null,
   'No aparece en el panel', null,
   'Coherente con que tampoco pudo entrar a Turing: a él los enlaces le fallaron.'),

  ('aliupup2018@gmail.com', 'assessment_tally', 'enviada', null,
   'Dice haberlo hecho · sin verificar en la cuenta de Tally',
   null, null)
)
insert into ht_external_test_results
  (client_id, candidate_id, provider_id, vacancy_id, estado,
   presentada_at, cargada_at, puntajes, resumen, notas, cargado_por)
select
  v.client_id,
  c.id,
  p.id,
  v.vacancy_id,
  d.estado,
  d.presentada::timestamptz,
  case when d.estado = 'cargada' then now() else null end,
  d.puntajes,
  d.resumen,
  d.notas,
  'k.castaneda@tradingsolutions.com'
from datos d
join v on true
join ts_test_providers p on p.key = d.proveedor
join ht_candidates c
  on lower(c.email) = lower(d.correo)
 and c.vacancy_id = v.vacancy_id
on conflict (candidate_id, provider_id) do update
  set estado        = excluded.estado,
      presentada_at = excluded.presentada_at,
      cargada_at    = excluded.cargada_at,
      puntajes      = excluded.puntajes,
      resumen       = excluded.resumen,
      notas         = excluded.notas,
      updated_at    = now();

-- ── 3) Betesa y 3D Skills no se aplican en China ─────────────
-- Marcarlas como «no aplica» en vez de dejarlas en pendiente: así la matriz
-- no las cuenta como algo que falta, que es distinto de algo que no va.
insert into ht_external_test_results
  (client_id, candidate_id, provider_id, vacancy_id, estado, notas, cargado_por)
select
  '98b62872-5767-4815-9b49-1394b9527c1f'::uuid,
  c.id, p.id, c.vacancy_id, 'no_aplica',
  'El proceso de China no incluye las pruebas de Bluesite.',
  'k.castaneda@tradingsolutions.com'
from ht_candidates c
cross join ts_test_providers p
where c.vacancy_id = '9be8d3da-8fdd-4fc5-84d6-68fb5ee3f383'
  and lower(c.email) in ('zhouzijian7@gmail.com', 'aliupup2018@gmail.com')
  and p.key in ('betesa', 'skills_3d', 'disc_prime', 'psico_alianza')
on conflict (candidate_id, provider_id) do nothing;

-- ── 4) Verificación ──────────────────────────────────────────
select
  c.name                                   as candidato,
  p.nombre                                 as prueba,
  r.estado,
  to_char(r.presentada_at, 'DD Mon')       as presentada,
  r.resumen
from ht_external_test_results r
join ht_candidates c on c.id = r.candidate_id
join ts_test_providers p on p.id = r.provider_id
where c.vacancy_id = '9be8d3da-8fdd-4fc5-84d6-68fb5ee3f383'
order by c.name, p.nombre;

-- Debe devolver 18 filas: 9 por cada uno de los dos candidatos.
-- Si devuelve 0, revisar que los correos existan en esa vacante.
