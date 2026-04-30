/**
 * POST /api/headhunting/candidates/[candidateId]/send-test-battery
 *
 * Crea un draft en el Gmail de Kelly con la plantilla de batería de pruebas
 * complementarias (16Personalities + DISC + Motivación + 2 placeholders para
 * Bluesite y Psicoalianza). Kelly/Mary completa los 2 placeholders manualmente
 * antes de enviar.
 *
 * Tres pruebas son self-reported: el candidato completa el test público y
 * reenvía los resultados al correo de Kelly.
 *
 * Bluesite (BETESA) y Psicoalianza requieren setup manual por candidato (no
 * tienen API pública), por eso van como placeholder.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";
import { createDraftViaGmail, isGmailConnected } from "@/lib/gmail";

export async function POST(
  req: NextRequest,
  { params }: { params: { candidateId: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { candidateId } = params;
    if (!candidateId) {
      return NextResponse.json({ error: "candidateId requerido" }, { status: 400 });
    }

    const { data: candidate, error } = await supabaseAdmin
      .from("ht_candidates")
      .select("*, ht_vacancies(title), ht_clients(name)")
      .eq("id", candidateId)
      .single();

    if (error || !candidate) {
      return NextResponse.json({ error: "Candidato no encontrado" }, { status: 404 });
    }

    const gmailStatus = await isGmailConnected();
    if (!gmailStatus.connected) {
      return NextResponse.json(
        { error: "Gmail no conectado. Settings → Conectar Gmail." },
        { status: 503 }
      );
    }

    // Primer nombre para personalizar el saludo
    const firstName = (candidate.name || "").split(" ")[0] || "candidato";
    const vacancyTitle = candidate.ht_vacancies?.title || "la vacante";

    const subject = `Trading Solutions · Pruebas complementarias para ${candidate.name}`;

    // HTML body con la plantilla de Mary, ajustada para mantener orden y
    // dejar placeholders muy visibles para Bluesite y Psicoalianza.
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: Inter, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 24px; background: #f9f9f9; }
  .container { max-width: 640px; margin: 0 auto; background: white; padding: 32px; border-radius: 12px; }
  h2 { color: #1a1a1a; margin-top: 0; font-size: 18px; }
  ol { padding-left: 20px; }
  ol li { margin-bottom: 18px; }
  a { color: #2C64ED; }
  .nota { color: #666; font-size: 14px; font-style: italic; }
  .placeholder { background: #FFF3CD; padding: 8px 12px; border-radius: 6px; color: #856404; font-weight: 600; }
  .footer { margin-top: 24px; color: #999; font-size: 12px; }
</style></head><body>
  <div class="container">
    <p>Buenas tardes <strong>${firstName}</strong>,</p>

    <p>Gracias por tu interés en formar parte de nuestro equipo en <strong>Trading Solutions</strong>. Como parte del proceso de selección para la posición de <strong>${vacancyTitle}</strong>, queremos conocerte un poco más, no solo a través de tu experiencia, sino también a través de tu estilo de personalidad y forma de trabajar.</p>

    <p>Por eso, te pedimos completar los siguientes cuestionarios:</p>

    <ol>
      <li>
        <strong>Test MBTI:</strong> <a href="https://www.16personalities.com/es/test-de-personalidad">https://www.16personalities.com/es/test-de-personalidad</a><br>
        <span class="nota">Al finalizar, compártenos los dos links que genera al darle click al ícono de compartir. Por favor, reenvíalos a esta misma dirección para que los registremos correctamente.</span>
      </li>
      <li>
        <strong>Test DISC:</strong> <a href="https://miperfildisc.com/">https://miperfildisc.com/</a><br>
        <span class="nota">Al finalizar este test, recibirás un correo con tus resultados. Por favor reenvíalo a esta misma dirección una vez lo recibas.</span>
      </li>
      <li>
        <strong>Test de Motivación:</strong> <a href="https://motivation-test-production.up.railway.app/">https://motivation-test-production.up.railway.app/</a>
      </li>
      <li>
        <strong>Test BETESA (Bluesite):</strong>
        <span class="placeholder">[ PEGAR ENLACE PERSONALIZADO DE BLUESITE ]</span>
      </li>
      <li>
        <strong>Test Psicoalianza:</strong>
        <span class="placeholder">[ PEGAR ENLACE PERSONALIZADO DE PSICOALIANZA ]</span>
      </li>
    </ol>

    <p><strong>Tiempo estimado total:</strong> aproximadamente 2 horas (puedes repartirlas en varias sesiones).</p>

    <p>Por favor, asegúrate de realizar los tests con tranquilidad y sin interrupciones. Una vez que los completes, por favor confírmame por este medio.</p>

    <p>Cualquier duda o inconveniente, no dudes en escribirme.</p>

    <p>¡Gracias de nuevo y muchos éxitos!</p>

    <p>Un abrazo,<br>
    <strong>Kelly Castañeda</strong><br>
    Talent Acquisition and Development Lead<br>
    Trading Solutions</p>

    <div class="footer">Este correo es personal. Antes de enviarlo, completa los enlaces de Bluesite y Psicoalianza arriba.</div>
  </div>
</body></html>`;

    const draftRes = await createDraftViaGmail({
      to: candidate.email,
      subject,
      html,
      fromName: "Kelly Castañeda",
    });

    if (!draftRes.ok) {
      return NextResponse.json(
        { error: "Error creando draft", detail: draftRes.error },
        { status: 502 }
      );
    }

    // Marcar en DB que se envió la batería (idempotente — si ya existe el
    // campo, lo sobreescribe; si la columna no existe, el catch silencia)
    try {
      await supabaseAdmin
        .from("ht_candidates")
        .update({ tests_battery_sent_at: new Date().toISOString() })
        .eq("id", candidateId);
    } catch {
      // columna probablemente no existe aún — lo trackeamos en draft_id solo
    }

    return NextResponse.json({
      success: true,
      candidate_id: candidateId,
      candidate_name: candidate.name,
      candidate_email: candidate.email,
      vacancy: vacancyTitle,
      draft_id: draftRes.draft_id,
      gmail_email: draftRes.gmail_email,
      note: "Draft creado en Gmail. Antes de enviar, completa los enlaces personalizados de Bluesite y Psicoalianza.",
      placeholders: ["Bluesite", "Psicoalianza"],
    });
  } catch (err) {
    console.error("send-test-battery error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
