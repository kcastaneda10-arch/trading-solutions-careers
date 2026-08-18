# Pendientes en base de datos · 18-ago-2026

El código de esta rama ya quedó listo. Lo que sigue **no se puede hacer desde
el código** porque vive en Supabase. Son cuatro cosas, en orden.

---

## 1. Correr la migración del historial de etapas

**Archivo:** `supabase/migrations/20260818_stage_events.sql`
**Dónde:** Supabase → SQL Editor → pegar el archivo completo → Run.

Crea dos tablas:

- `ht_candidate_stage_events` — cada movimiento del funnel queda registrado.
- `ht_candidate_tests` — el estado de cada una de las 6 pruebas por candidato.

**Por qué importa.** Hasta hoy los "días en etapa" salían de `updated_at`, que
se pisa con cualquier edición al candidato. Si le corregías el teléfono, el
contador se reiniciaba y el candidato aparecía como recién movido llevando tres
semanas parado. El dashboard escondía justo lo que tenía que mostrar.

La migración también siembra el histórico con los sellos de tiempo sueltos que
ya existían (`prefilter_invited_at`, `prefilter_completed_at`, los de Calendly,
`rejected_at`). Esa parte queda marcada `source='backfill'` y tiene huecos: es
una reconstrucción, no un registro. **De acá en adelante los números son
reales.** El dashboard muestra qué porcentaje sigue siendo aproximado, y ese
número baja solo a medida que se mueven candidatos.

---

## 2. Correr los cambios de vacantes

**Archivo:** `scripts/20260818_vacantes.sql`

Hace tres cosas:

- Cierra **Inside Sales** (`status = 'closed'`). Ya se quitó de la página de careers.
- Cambia **Full Stack Developer** a `Full Stack Developer Junior`, nivel junior.
- Corrige **"Luisa Gamez" → "Luis Agamez"** (el apellido se partió mal al importar).

El archivo trae los `SELECT` de verificación comentados. Corré el de la sección 0
antes de empezar y guardá el resultado, por si hay que devolverse.

---

## 3. ~~Configurar la variable del Full Stack Junior~~ — ya no hace falta

Esto era un paso manual en Vercel y se eliminó. Ahora, cuando un `job_id` no está
en el mapa, el sistema busca la vacante por título en `ht_vacancies` y prefiere la
que esté abierta. Queda registrado en los logs cada vez que resuelve así.

La variable `VACANCY_ID_FULLSTACK_JUNIOR` sigue funcionando si algún día se quiere
fijar el UUID a mano: si está puesta, manda ella.

**Por qué se cambió.** Un mapa de números escritos a mano se rompe solo: cada
vacante nueva exige que alguien se acuerde de agregar la línea, y hasta que lo haga
las aplicaciones se guardan pero nunca entran al funnel — en silencio, y al
candidato igual le llega el correo de "aplicación recibida".

## 4. Poblar las pruebas (cuando quieras)

La tabla `ht_candidate_tests` arranca vacía. Mientras esté vacía, el desglose de
la etapa **Pruebas** en el dashboard muestra las 6 evaluaciones en cero: la etapa
te dice que va lenta, pero no cuál prueba la está frenando.

Se llena registrando una fila por candidato y prueba cuando se envía cada una:

```sql
INSERT INTO ht_candidate_tests (candidate_id, test_id, status, sent_at)
VALUES ('<uuid del candidato>', 'neurocluster', 'enviada', now());
```

`test_id` válidos: `disc`, `motivacion`, `maquina_turing`, `betesa`,
`iq_factorial`, `neurocluster`, `assessment_grupal`, `prueba_tecnica_cargo`.

Lo natural sería que HR Admin escriba estas filas solo, al enviar cada prueba.
Eso todavía no está construido — es el siguiente paso lógico si el desglose te
resulta útil.
