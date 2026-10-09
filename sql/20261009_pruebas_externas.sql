-- ============================================================
-- Pruebas externas · catálogo de proveedores y resultados
-- Proyecto: mojbhvphztnadndhnraf (elevare-careers)
-- Idempotente. Ejecutar completo en el SQL Editor.
-- ============================================================
-- EL PROBLEMA QUE RESUELVE
-- Trading Solutions aplica pruebas en seis plataformas distintas, cada una con
-- su cuenta, su formato y su forma de exportar. Hoy el resultado vive en el
-- portal del proveedor y, si alguien lo baja, termina en un PDF suelto en el
-- escritorio de quien lo bajó. Para comparar dos candidatos hay que abrir seis
-- pestañas y acordarse de qué se vio en cada una — que es exactamente el
-- trabajo que se hace una vez y después se abandona.
--
-- Esto no reemplaza a la batería propia (`ts_bat_sessions`), que seguirá siendo
-- la que se calcula aquí. Esto es para lo que se mide afuera: deja constancia
-- en la ficha del candidato de qué se le aplicó, cuándo, cómo le fue y dónde
-- está el soporte.
--
-- POR QUÉ UNA TABLA GENÉRICA Y NO UNA POR PROVEEDOR
-- Porque los proveedores cambian. El año pasado no estaba Turing, el próximo
-- puede no estar Psico Alianza. Una tabla por proveedor obliga a migrar el
-- esquema cada vez que Talent cambia de herramienta. Acá el proveedor es una
-- fila, no una tabla, y los puntajes van en jsonb porque no hay dos
-- proveedores que midan lo mismo.

-- ── 1) Catálogo de proveedores ───────────────────────────────
create table if not exists ts_test_providers (
  id            uuid primary key default gen_random_uuid(),
  key           text not null,                 -- 'disc_prime', 'betesa', ...
  nombre        text not null,                 -- como lo llama Talent
  categoria     text,                          -- 'estilo', 'personalidad', 'cognitiva', 'motivacion'
  portal_url    text,
  -- Cómo llega el resultado. Determina qué puede hacer el ATS:
  --   'manual'   → alguien lo baja del portal y lo carga aquí
  --   'candidato'→ el candidato manda el PDF (16personalities)
  --   'api'      → el proveedor tiene integración (ninguno hoy)
  via           text not null default 'manual'
                check (via in ('manual', 'candidato', 'api')),
  -- Qué campos de puntaje esperar. Sirve para que la pantalla sepa qué
  -- casillas mostrar sin que nadie las escriba a mano cada vez.
  campos        jsonb not null default '[]'::jsonb,
  activo        boolean not null default true,
  notas         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists ts_test_providers_key_idx on ts_test_providers (lower(key));

-- ── 2) Resultado de una prueba externa para un candidato ─────
create table if not exists ht_external_test_results (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid,
  candidate_id    uuid not null references ht_candidates(id) on delete cascade,
  provider_id     uuid not null references ts_test_providers(id),
  vacancy_id      uuid,

  -- El ciclo de vida, en los términos en que Talent lo vive.
  estado          text not null default 'pendiente'
                  check (estado in ('pendiente', 'enviada', 'presentada', 'cargada', 'no_aplica')),
  enviada_at      timestamptz,
  presentada_at   timestamptz,
  cargada_at      timestamptz,

  -- Los puntajes, con la forma que tenga cada proveedor. Sin esquema fijo a
  -- propósito: DISC devuelve cuatro ejes, Betesa devuelve cuadrantes de
  -- cerebro y 16personalities devuelve cuatro letras. Forzarlos a una misma
  -- estructura sería inventar equivalencias que no existen.
  puntajes        jsonb,
  -- Una sola línea que se pueda leer en una tabla sin abrir el PDF.
  resumen         text,
  -- Dónde está el soporte: el PDF en Supabase Storage o el enlace al portal.
  archivo_url     text,
  archivo_nombre  text,
  portal_url      text,

  cargado_por     text,                        -- correo de quien lo registró
  notas           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Una fila por candidato y proveedor. Si se vuelve a aplicar la misma prueba,
-- se actualiza la fila: el historial de intentos no es lo que Talent consulta,
-- y dos filas compitiendo por la misma casilla de la matriz confunden más de
-- lo que informan.
create unique index if not exists ht_ext_results_cand_prov_idx
  on ht_external_test_results (candidate_id, provider_id);

create index if not exists ht_ext_results_cand_idx on ht_external_test_results (candidate_id);
create index if not exists ht_ext_results_estado_idx on ht_external_test_results (estado);

alter table ts_test_providers enable row level security;
alter table ht_external_test_results enable row level security;

-- ── 3) Los seis proveedores de hoy ───────────────────────────
-- `campos` es lo que la pantalla va a pedir cuando alguien cargue el
-- resultado. Son los nombres que usa cada informe, no una traducción.
insert into ts_test_providers (key, nombre, categoria, portal_url, via, campos, notas)
values
  ('disc_prime', 'DISC', 'estilo', 'https://www.disc-prime.com/login', 'manual',
   '["D","I","S","C","perfil"]'::jsonb,
   'Cuenta cwo@. Devuelve los cuatro ejes y un perfil nombrado.'),

  ('psico_alianza', 'Psico Alianza', 'personalidad', 'https://app.psicoalianza.com', 'manual',
   '["informe","recomendacion"]'::jsonb,
   'Agendamiento y aplicación asistida. El informe lo emite el proveedor.'),

  ('16personalities', 'Test de personalidad · 16personalities', 'personalidad',
   'https://www.16personalities.com/es/test-de-personalidad', 'candidato',
   '["tipo","rol","estrategia"]'::jsonb,
   'Gratuita y la presenta el candidato por su cuenta: él manda el PDF. Es referencial, no decide.'),

  ('motivacion', 'Test de motivación', 'motivacion',
   'https://motivation-test-production.up.railway.app/', 'manual',
   '["motivador_principal","motivador_secundario","perfil"]'::jsonb,
   'Herramienta propia de Wellness.'),

  ('turing', 'Máquina de Turing', 'cognitiva',
   'https://turinglab-fyqie5kiza-uc.a.run.app/signin', 'manual',
   '["puntaje","percentil","nivel"]'::jsonb,
   'Cuenta wco@.'),

  ('betesa', 'Betesa', 'estilo', 'https://app.bluesitehr.com/', 'manual',
   '["cuadrante_dominante","perfil","alertas"]'::jsonb,
   'Bluesite. Misma cuenta que 3D Skills.'),

  ('skills_3d', '3D Skills', 'cognitiva', 'https://app.bluesitehr.com/', 'manual',
   '["competencias","nivel_global"]'::jsonb,
   'Bluesite. Misma cuenta que Betesa.')
on conflict (lower(key)) do update
  set nombre     = excluded.nombre,
      categoria  = excluded.categoria,
      portal_url = excluded.portal_url,
      via        = excluded.via,
      campos     = excluded.campos,
      notas      = excluded.notas,
      updated_at = now();

-- ── 4) Verificación ──────────────────────────────────────────
select
  (select count(*) from ts_test_providers where activo)        as proveedores_activos,
  (select count(*) from ht_external_test_results)              as resultados_cargados;

-- Debe dar 7 y 0 la primera vez.
