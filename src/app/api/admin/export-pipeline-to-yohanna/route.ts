/**
 * POST /api/admin/export-pipeline-to-yohanna
 *
 * Genera un draft de Gmail dirigido a Yohanna con TODOS los candidatos que
 * están actualmente en una etapa específica (por default: recruiter_interview).
 *
 * El draft contiene un menú consolidado: por cada candidato, nombre + cédula +
 * contacto + LinkedIn + CV link + resumen del prefilter. Yohanna recibe el
 * listado y decide a quién entrevistar y con quién.
 *
 * Caso de uso: Kelly sale el viernes y le pasa el handoff a Yohanna del pipeline
 * actual. Yohanna decide los siguientes pasos.
 *
 * Body opcional: { stage?: string, vacancy_id?: string, to?: string }
 *   stage: default "recruiter_interview"
 *   vacancy_id: opcional, filtra por vacante
 *   to: default "yfranco@tradingsolutions.com"
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { createDraftViaGmail, isGmailConnected } from "@/lib/gmail";

export const runtime = "nodejs";

const YOHANNA_EMAIL = process.env.HANDOFF_EMAIL || "yfranco@tradingsolutions.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://trading-solutions-careers.vercel.app";

function escapeHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type Cand = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  cv_url: string | null;
  cv_filename: string | null;
  vacancy_id: string | null;
  ht_vacancies: { title: string } | null;
  created_at: string | null;
  current_job_role: string | null;
  prefilter_score: number | null;
  prefilter_notes: string | null;
  metadata: Record<string, unknown> | null;
};

function pickCedula(c: Cand): string {
  const meta = (c.metadata || {}) as Record<string, unknown>;
  return (
    (meta["cedula"] as string) ||
    (meta["identification"] as string) ||
    (meta["document_number"] as string) ||
    ""
  );
}

function buildEmailHtml(cands: Cand[], stageName: string): string {
  const stageLabel = stageName === "recruiter_interview"
    ? "Recruiter Interview"
    : stageName;

  const rows = cands.map((c, i) => {
    const cedula = pickCedula(c);
    const vacancyTitle = c.ht_vacancies?.title || "(sin vacante asignada)";
    const cvHref = c.cv_url || (c.cv_filename ? `${APP_URL}/api/cv/${c.id}` : "");
    const prefScore = c.prefilter_score != null ? `${c.prefilter_score}/100` : "—";
    const appliedDate = c.created_at ? new Date(c.created_at).toISOString().slice(0, 10) : "—";

    return `
      <tr style="border-top:1px solid #e8e8e8">
        <td style="padding:14px 8px;vertical-align:top;width:32px;color:#737373;font-weight:600">${i + 1}</td>
        <td style="padding:14px 8px;vertical-align:top">
          <div style="font-weight:700;font-size:14px;color:#0a0a0a">${escapeHtml(c.name || "—")}</div>
          <div style="font-size:12px;color:#525252;margin-top:2px">${escapeHtml(vacancyTitle)}</div>
          ${c.current_job_role ? `<div style="font-size:11px;color:#737373;margin-top:1px;font-style:italic">Cargo actual: ${escapeHtml(c.current_job_role)}</div>` : ""}
        </td>
        <td style="padding:14px 8px;vertical-align:top;font-size:12px">
          ${c.email ? `<div><a href="mailto:${escapeHtml(c.email)}" style="color:#2563eb;text-decoration:none">${escapeHtml(c.email)}</a></div>` : "<div style='color:#a3a3a3'>sin email</div>"}
          ${c.phone ? `<div style="margin-top:2px;color:#404040">${escapeHtml(c.phone)}</div>` : ""}
          ${cedula ? `<div style="margin-top:2px;color:#737373;font-size:11px">CC: ${escapeHtml(cedula)}</div>` : ""}
        </td>
        <td style="padding:14px 8px;vertical-align:top;font-size:12px;text-align:center">
          ${c.linkedin_url ? `<a href="${escapeHtml(c.linkedin_url)}" target="_blank" style="color:#0a66c2;text-decoration:none;font-weight:600">LinkedIn ↗</a>` : "<span style='color:#a3a3a3'>—</span>"}
          ${cvHref ? `<br><a href="${escapeHtml(cvHref)}" target="_blank" style="color:#0a0a0a;text-decoration:none;font-weight:600;margin-top:4px;display:inline-block">CV ↗</a>` : "<br><span style='color:#a3a3a3'>sin CV</span>"}
        </td>
        <td style="padding:14px 8px;vertical-align:top;font-size:12px;text-align:center">
          <div style="font-weight:700;font-size:13px;color:#0a0a0a">${prefScore}</div>
          <div style="font-size:11px;color:#737373;margin-top:2px">Aplicó ${appliedDate}</div>
        </td>
      </tr>
      ${c.prefilter_notes ? `
        <tr>
          <td></td>
          <td colspan="4" style="padding:0 8px 12px;font-size:11px;color:#525252;font-style:italic;line-height:1.5">
            <strong style="color:#737373;font-style:normal;text-transform:uppercase;font-size:10px;letter-spacing:0.5px">Notas prefilter:</strong> ${escapeHtml(c.prefilter_notes).slice(0, 400)}${c.prefilter_notes.length > 400 ? "…" : ""}
          </td>
        </tr>
      ` : ""}
    `;
  }).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:'Open Sauce Sans',-apple-system,sans-serif;line-height:1.6;color:#0a0a0a">
  <div style="max-width:780px;margin:0 auto;padding:32px 16px">
    <div style="background:white;padding:32px;border:1px solid #e8e8e8">

      <p style="font-size:11px;color:#737373;letter-spacing:0.6px;text-transform:uppercase;margin:0 0 6px">Handoff Pipeline · Trading Solutions</p>
      <h2 style="font-size:22px;margin:4px 0 12px;font-weight:700">Candidatos en ${escapeHtml(stageLabel)} · ${cands.length} total</h2>

      <p style="font-size:14px;margin:0 0 16px">Hola Yohanna,</p>
      <p style="font-size:14px;margin:0 0 16px">
        Te paso el menú completo de candidatos que están actualmente en la etapa
        <strong>${escapeHtml(stageLabel)}</strong>. Por cada uno tenés su info
        de contacto, link a LinkedIn, link al CV y resumen del prefilter para
        que decidas <strong>a quién entrevistar y con quién</strong>.
      </p>
      <p style="font-size:14px;margin:0 0 16px">
        El ATS ya está montado con el nuevo flujo · cuando decidas mover candidatos,
        usa la app directamente (mismo login que el mío).
      </p>

      <table cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin-top:24px;background:white">
        <thead>
          <tr style="background:#0a0a0a;color:white;text-align:left">
            <th style="padding:10px 8px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;width:32px">#</th>
            <th style="padding:10px 8px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase">Candidato</th>
            <th style="padding:10px 8px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase">Contacto</th>
            <th style="padding:10px 8px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;text-align:center">Links</th>
            <th style="padding:10px 8px;font-size:11px;font-weight:600;letter-spacing:0.4px;text-transform:uppercase;text-align:center">Prefilter</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="5" style="padding:40px 16px;text-align:center;color:#737373;font-style:italic">No hay candidatos en esta etapa.</td></tr>`}
        </tbody>
      </table>

      <p style="margin-top:28px;font-size:14px">
        Cualquier duda sobre algún candidato puntual, escríbeme.
      </p>

      <p style="margin-top:18px;font-size:14px">
        Un abrazo,<br><strong>Kelly</strong>
      </p>

      <div style="margin-top:28px;padding-top:18px;border-top:1px solid #e8e8e8;font-size:11px;color:#737373;line-height:1.5">
        Generado automáticamente desde el ATS · ${new Date().toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" })}<br>
        Acceso al ATS: <a href="${APP_URL}/hr-admin" style="color:#525252">${APP_URL.replace("https://", "")}/hr-admin</a>
      </div>

    </div>
  </div>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const stage: string = body.stage || "recruiter_interview";
    const vacancyId: string | null = body.vacancy_id || null;
    const toEmail: string = body.to || YOHANNA_EMAIL;

    // 1. Cargar candidatos en esa etapa
    let q = supabaseAdmin
      .from("ht_candidates")
      .select(
        "id, name, email, phone, linkedin_url, cv_url, cv_filename, vacancy_id, " +
        "current_job_role, prefilter_score, prefilter_notes, metadata, created_at, " +
        "ht_vacancies(title)"
      )
      .eq("stage", stage)
      .order("created_at", { ascending: false });

    if (vacancyId) q = q.eq("vacancy_id", vacancyId);

    const { data, error } = await q;
    if (error) {
      console.error("Error cargando candidatos:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const cands = ((data || []) as unknown as Cand[]);

    // 2. Crear draft Gmail
    let draftId: string | null = null;
    try {
      const gmail = await isGmailConnected();
      if (!gmail.connected) {
        return NextResponse.json({ error: "Gmail no conectado" }, { status: 503 });
      }
      const html = buildEmailHtml(cands, stage);
      const stageLabel = stage === "recruiter_interview" ? "Recruiter Interview" : stage;
      const draftRes = await createDraftViaGmail({
        to: toEmail,
        subject: `Handoff pipeline · ${cands.length} candidatos en ${stageLabel}`,
        html,
        fromName: "Kelly Castañeda",
        replyTo: "kcastaneda@tradingsolutions.com",
      });
      if (draftRes.ok) draftId = draftRes.draft_id;
    } catch (e: any) {
      console.error("Yohanna handoff draft creation failed:", e);
      return NextResponse.json({ error: e?.message || "Error generando draft" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      stage,
      vacancy_id: vacancyId,
      candidates_count: cands.length,
      draft_id: draftId,
      to: toEmail,
    });
  } catch (err: any) {
    console.error("export-pipeline-to-yohanna error:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
