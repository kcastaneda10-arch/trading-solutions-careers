#!/bin/bash
# =========================================================
# Trading Solutions Careers ATS — Deploy script
# Kelly: copia/pega esto en la terminal, ejecuta, y listo.
# =========================================================
set -e

cd "$(dirname "$0")"

echo "── 1. Limpiando cualquier lock huérfano"
rm -f .git/index.lock

echo "── 2. Estado actual"
git status --short

echo "── 3. Verificando TypeScript"
npx tsc --noEmit && echo "   TypeScript OK"

echo "── 4. Staging archivos nuevos y modificados"
git add src/data/jobs.ts
git add src/data/assessments.ts
git add src/lib/linkedin.ts
git add src/app/api/linkedin/
git add src/app/assessment/
git add src/app/hr-admin/
git add deploy-ats.sh

echo "── 5. Lo que se va a commitear"
git status --short

echo "── 6. Commit"
git commit -m "feat(ats): 3 vacantes Barranquilla reales + HR Admin productivo + Factor X + LinkedIn OAuth

- Reemplaza 11 vacantes demo por las 3 reales de Barranquilla
  (Senior Pricing Analyst, Inside Sales Support, Customer Documentation Specialist)
  con descripciones ES/EN completas y link a LinkedIn oficial.

- Migra las pruebas psicometricas Factor X desde Elevare/WellnessOS:
  Factor X Cognitivo, Factor X Actitudinal, BETESA Liderazgo, Ingles CEFR,
  Simulacion del rol. Pagina token-based en /assessment/[token].

- Añade HR Admin completo en /hr-admin con 10 modulos:
  Dashboard, Vacantes, Pipeline Kanban, CV Bank, Entrevistas IA,
  Pruebas Psicometricas, Agentes IA, Analytics, LinkedIn TS, Bases de datos.

- Integracion productiva con LinkedIn via OAuth 2.0 corporativo
  (sin credenciales personales):
  - src/lib/linkedin.ts  cliente + OAuth + publishJob + fetchApplications
  - /api/linkedin/auth   inicia OAuth
  - /api/linkedin/callback  intercambia code por token
  - /api/linkedin/webhook   recibe Easy Apply via Recruiter System Connect
  - /hr-admin/linkedin-setup  wizard de 6 pasos para el admin corporativo"

echo ""
echo "── 7. LISTO PARA PUSH"
echo "   Para subir a GitHub y desplegar en Vercel:"
echo "     git push origin main"
echo ""
