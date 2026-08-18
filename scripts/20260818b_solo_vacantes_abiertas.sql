-- ═══════════════════════════════════════════════════════════════
-- 18-ago-2026 · Dejar abiertas SOLO las vacantes que siguen vivas
--
-- Kelly: "Salen todas las vacantes, ya muchas están cerradas. Solo déjame
-- las abiertas que son: las de China y Full Stack."
--
-- Hoy el ATS tiene 9 vacantes marcadas como abiertas. Por eso el dashboard
-- dice "380 candidatos activos en 11 vacantes abiertas" y el 100% aparece
-- estancado: está contando gente de procesos que ya cerraron hace meses.
-- No es un problema del dashboard, es que la base nunca se actualizó.
--
-- Se usa lista blanca en vez de lista negra: se cierra TODO y después se
-- reabre lo que sigue vivo. Así ninguna vacante vieja que nadie recuerda se
-- queda abierta por omisión.
--
-- CÓMO CORRERLO · Supabase → SQL Editor → pegar → Run
-- ═══════════════════════════════════════════════════════════════

-- ── 0 · FOTO PREVIA · guardá este resultado antes de tocar nada ──
SELECT id, title, area, status, country
FROM ht_vacancies
WHERE client_id = '98b62872-5767-4815-9b49-1394b9527c1f'
ORDER BY status, title;


-- ── 1 · Cerrar todo ─────────────────────────────────────────────
UPDATE ht_vacancies
SET status = 'closed'
WHERE client_id = '98b62872-5767-4815-9b49-1394b9527c1f';


-- ── 2 · Reabrir solo las que siguen vivas ───────────────────────
-- Las 4 de China + Full Stack. Cualquier otra queda cerrada, incluida
-- Talent Acquisition and Development Lead (ya cubierta) e Inside Sales.

UPDATE ht_vacancies
SET status = 'open'
WHERE client_id = '98b62872-5767-4815-9b49-1394b9527c1f'
  AND (
       country = 'China'
    OR title ILIKE '%full stack%'
  );

-- ── 3 · Verificar · deberían quedar exactamente 5 abiertas ──────
SELECT status, count(*) AS cuantas
FROM ht_vacancies
WHERE client_id = '98b62872-5767-4815-9b49-1394b9527c1f'
GROUP BY status;

SELECT id, title, country, status
FROM ht_vacancies
WHERE client_id = '98b62872-5767-4815-9b49-1394b9527c1f'
  AND status = 'open'
ORDER BY title;

-- Si alguna de China no quedó abierta, es porque su columna `country` está
-- vacía. Revisá con este SELECT y, si hace falta, marcalas a mano por título:
--   SELECT id, title, country FROM ht_vacancies
--   WHERE title ILIKE '%china%' OR title ILIKE '%overseas%'
--      OR title ILIKE '%pricing executive%' OR title ILIKE '%operations executive%';


-- ── 4 · Los candidatos de las vacantes cerradas ─────────────────
-- No se tocan: siguen en la base con su historia intacta, solo dejan de
-- contar en el dashboard porque su vacante ya no está abierta.
--
-- Si querés ver cuántos son y decidir si pasarlos al CV Bank para futuras
-- búsquedas (mejor que rechazarlos):
-- SELECT v.title, count(*) AS candidatos
-- FROM ht_candidates c
-- JOIN ht_vacancies v ON v.id = c.vacancy_id
-- WHERE v.status = 'closed'
--   AND c.status NOT IN ('rejected', 'completed')
-- GROUP BY v.title
-- ORDER BY candidatos DESC;
