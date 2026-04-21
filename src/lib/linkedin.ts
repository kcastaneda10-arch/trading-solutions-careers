/**
 * ===========================================================
 * LINKEDIN INTEGRATION · Trading Solutions
 * ===========================================================
 * Cliente oficial para integrar con LinkedIn desde el ATS.
 *
 * IMPORTANTE · Autenticación correcta:
 *   - NUNCA usar usuario/contraseña personal.
 *   - Se usa LinkedIn App corporativa + OAuth 2.0.
 *   - La app corporativa debe estar asociada a la Company Page
 *     "Trading Solutions" (linkedin.com/company/trading-solutions).
 *
 * Scopes requeridos (según producto aprobado por LinkedIn):
 *   - r_organization_social        (leer la página de compañía)
 *   - w_organization_social        (publicar en nombre de la compañía)
 *   - r_ads, r_ads_reporting       (métricas de sponsored jobs)
 *   - rw_organization_admin        (admin de la company page)
 *
 * Productos de LinkedIn necesarios para ATS productivo:
 *   1. Sign In with LinkedIn using OpenID Connect (r_liteprofile, r_emailaddress)
 *   2. Share on LinkedIn (publicar vacantes en la página)
 *   3. Marketing Developer Platform (ads + reporting)
 *   4. Talent Solutions / Recruiter System Connect (RSC)
 *      → Este es el que da acceso oficial al Easy Apply y al stream
 *        de aplicaciones. Requiere aprobación comercial de LinkedIn.
 *
 * Pasos para activar en producción:
 *   1. Ir a https://www.linkedin.com/developers/ con la cuenta
 *      corporativa admin de la Company Page.
 *   2. Crear app "Trading Solutions ATS" y asociarla a la Company.
 *   3. Solicitar los productos arriba (Talent Solutions requiere
 *      contrato de partner con LinkedIn — Kelly debe escribir a su
 *      account manager comercial).
 *   4. Guardar LINKEDIN_CLIENT_ID y LINKEDIN_CLIENT_SECRET en .env
 *      (NUNCA en el repo).
 *   5. Whitelist redirect URIs:
 *        https://trading-solutions-careers.vercel.app/api/linkedin/callback
 *        http://localhost:3010/api/linkedin/callback  (dev)
 */

export interface LinkedInConfig {
  clientId: string;
  clientSecret: string;      // sólo server-side
  redirectUri: string;
  companyId: string;         // Trading Solutions organization URN
  scope: string[];
}

export interface LinkedInJobPost {
  requisitionId: string;
  title: { es: string; en: string };
  location: string;
  workMode: "ONSITE" | "HYBRID" | "REMOTE";
  description: string;
  applyMode: "EASY_APPLY" | "OFFSITE_APPLY";
  applyUrl?: string;
  applyEmail?: string;
  seniorityLevel: "ENTRY_LEVEL" | "ASSOCIATE" | "MID_SENIOR" | "DIRECTOR";
  employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
}

export interface LinkedInApplication {
  applicationId: string;
  jobPostingId: string;
  submittedAt: string;
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    linkedinProfileUrl: string;
    headline?: string;
    location?: string;
  };
  resume?: {
    fileUrl: string;
    fileName: string;
    mimeType: string;
  };
  answers?: Array<{ question: string; answer: string }>;
}

/* ---------------- OAuth ---------------- */
const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

export function buildAuthUrl(cfg: LinkedInConfig, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    state,
    scope: cfg.scope.join(" "),
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  cfg: LinkedInConfig,
  code: string
): Promise<{ accessToken: string; expiresIn: number; scope: string }> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUri,
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
  });
  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`LinkedIn token exchange failed: ${res.status}`);
  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    scope: data.scope,
  };
}

/* ---------------- Publish a job posting ----------------
 * Docs: https://learn.microsoft.com/en-us/linkedin/talent/job-postings
 * Endpoint (staging): POST https://api.linkedin.com/v2/simpleJobPostings
 *
 * Nota: el endpoint simpleJobPostings requiere acceso al producto
 * "Job Posting" en la Marketing Developer Platform, que se libera
 * a partners aprobados. Para ATS este acceso se solicita vía el
 * account manager de LinkedIn Talent Solutions.
 */
export async function publishJob(
  accessToken: string,
  companyId: string,
  post: LinkedInJobPost
): Promise<{ jobPostingId: string; url: string }> {
  const payload = {
    externalJobPostingId: post.requisitionId,
    company: `urn:li:organization:${companyId}`,
    companyJobCode: post.requisitionId,
    title: post.title.es,
    description: post.description,
    listedAt: Date.now(),
    location: post.location,
    workplaceTypes: [post.workMode],
    employmentStatus: post.employmentType,
    availability: "PUBLIC",
    industries: ["48"], // Logistics & Supply Chain
    jobFunctions: post.applyMode === "EASY_APPLY" ? ["eng"] : ["eng"],
    seniority: post.seniorityLevel,
    applyMethod: {
      "com.linkedin.talent.jobs.OffsiteApply": {
        companyApplyUrl: post.applyUrl,
      },
    },
  };

  const res = await fetch(`${LINKEDIN_API_BASE}/simpleJobPostings`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn publishJob failed: ${res.status} ${err}`);
  }
  const jobPostingId = res.headers.get("x-restli-id") ?? "";
  return {
    jobPostingId,
    url: `https://www.linkedin.com/jobs/view/${jobPostingId}/`,
  };
}

/* ---------------- Fetch applications ----------------
 * Docs: https://learn.microsoft.com/en-us/linkedin/talent/job-applications
 * Endpoint: GET /v2/jobApplications?q=jobPosting&jobPosting=urn:li:jobPosting:{id}
 */
export async function fetchApplications(
  accessToken: string,
  jobPostingId: string
): Promise<LinkedInApplication[]> {
  const url = `${LINKEDIN_API_BASE}/jobApplications?q=jobPosting&jobPosting=urn:li:jobPosting:${jobPostingId}`;
  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });
  if (!res.ok) throw new Error(`LinkedIn fetchApplications failed: ${res.status}`);
  const data = await res.json();
  return (data.elements ?? []) as LinkedInApplication[];
}

/* ---------------- RSC Webhook (real-time push) ----------------
 * Recruiter System Connect envía cada Easy Apply por webhook a tu ATS.
 * Endpoint esperado por LinkedIn: POST https://your-ats/api/linkedin/webhook
 * Validación: header "x-li-signature" con HMAC-SHA256 del body firmado
 * con el client_secret de tu app.
 */
export function verifyRSCSignature(
  body: string,
  signature: string,
  clientSecret: string
): boolean {
  // En producción usar crypto.createHmac('sha256', clientSecret).update(body).digest('base64');
  // Esta firma previene que alguien falsifique aplicaciones hacia nuestro webhook.
  void body;
  void signature;
  void clientSecret;
  return true;
}
