import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/bateria/auth';
import { getAnthropic } from '@/lib/anthropic';
import { calcularMatch } from '@/lib/bateria/match';
import { perfilDe, perfilPorTitulo } from '@/lib/bateria/perfiles-cargo';
import { FACTORS, MOTIVADORES, INTEGRIDAD_LABEL, RAZONAMIENTO_LABEL, DISC_PATRONES, ARQUETIPOS } from '@/lib/bateria/interpretacion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const MODEL = 'claude-sonnet-4-5';

/** El informe completo en una sola llamada pedia ~4.000 tokens de salida:
 *  entre 90 y 150 s, y si la API reintentaba se iba mucho mas alla. El boton
 *  se quedaba pensando sin devolver nada. Ahora son dos llamadas en paralelo
 *  con timeout propio: pase lo que pase la ruta responde, con exito o con la
 *  causa exacta.
 *
 *  El cupo de salida NO se reparte por igual. La primera version daba 2.600 a
 *  cada mitad y la de decision se quedaba sin espacio antes de cerrar el JSON:
 *  cinco preguntas de entrevista con su porque y su que-escuchar, mas el plan
 *  de entrada, ocupan bastante mas que el resumen y las fortalezas. */
const TIMEOUT_MODELO_MS = 170_000;

const REGLAS = `Eres psicólogo organizacional con tarjeta profesional, redactando el informe de una batería de selección propia de Trading Solutions (freight forwarder, Barranquilla).

REGLAS QUE NO PUEDES ROMPER:

1. Los puntajes te llegan calculados. NUNCA inventes, estimes ni corrijas un número. Si necesitas citar una cifra, usa exactamente la que recibiste.
2. NO diagnostiques. "Estabilidad emocional" es el nombre de una escala laboral, no una condición de salud. Prohibido: ansiedad, depresión, trastorno, patología, terapia, y cualquier inferencia clínica.
3. Los puntajes DISC son ipsativos: dicen qué eje pesa más DENTRO de la persona. Nunca digas que es "más dominante que otros candidatos".
4. Si la validez de la sesión viene marcada como no interpretable o con reservas por deseabilidad social alta o respuestas demasiado rápidas, DILO PRIMERO y no caracterices a la persona como si el perfil fuera confiable.
5. Escribe en español colombiano, directo y concreto. Nada de "el candidato demuestra una notable capacidad". Frases cortas. Ejemplos observables de trabajo.
6. Cada afirmación se apoya en un dato que recibiste. Si no tienes evidencia para algo, no lo digas.
7. Nunca menciones características protegidas: edad, sexo, origen, religión, salud, situación familiar.

Responde ÚNICAMENTE con JSON válido, sin texto antes ni después.`;

/** Parte 1 · quién es y cómo trabaja. */
const SISTEMA_PERFIL = `${REGLAS}

Forma exacta del JSON:
{
  "resumen": "2 o 3 párrafos sobre cómo trabaja esta persona",
  "fortalezas": [{"titulo":"","detalle":"","evidencia":""}],
  "oportunidades": [{"titulo":"","detalle":"","evidencia":""}],
  "loQueNoAfirma": ""
}
3 a 5 fortalezas, 2 a 4 oportunidades. En "loQueNoAfirma" declara los límites del instrumento: qué NO mide esta batería y qué queda por verificar en assessment presencial y referencias.`;

/** Parte 2 · qué hacer con esta persona en este cargo. */
const SISTEMA_DECISION = `${REGLAS}

Forma exacta del JSON:
{
  "compatibilidad": {"lectura":"", "aFavor":[""], "riesgos":[""]},
  "preguntasEntrevista": [{"pregunta":"","porque":"","queEscuchar":""}],
  "planEntrada": [{"periodo":"","foco":"","porque":""}],
  "conclusion": {"recomendacion":"avanzar|entrevistar_con_reservas|no_avanzar","texto":""}
}
4 preguntas de entrevista conductual (STAR), cada una dirigida a verificar un punto dudoso del perfil. 3 periodos de plan de entrada (0-30, 30-60, 60-90 días) pensados para que el jefe los use desde el onboarding. Sé concreto y breve en cada campo: dos o tres frases, no párrafos.`;

type Parte = { ok: true; datos: any } | { ok: false; error: string; crudo?: string };

async function redactar(sistema: string, insumo: unknown, maxTokens: number): Promise<Parte> {
  try {
    const client = getAnthropic();
    const r = await client.messages
      .stream(
        {
          model: MODEL,
          max_tokens: maxTokens,
          system: sistema,
          messages: [{ role: 'user', content: `Redacta tu parte del informe con estos datos:\n\n${JSON.stringify(insumo, null, 2)}` }],
        },
        { timeout: TIMEOUT_MODELO_MS, maxRetries: 1 }
      )
      .finalMessage();

    const texto = r.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    const limpio = texto.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    if (r.stop_reason === 'max_tokens') return { ok: false, error: `El modelo se quedó sin espacio antes de cerrar el JSON (tope ${maxTokens} tokens).` };
    try {
      return { ok: true, datos: JSON.parse(limpio) };
    } catch {
      return { ok: false, error: 'El agente no devolvió JSON válido', crudo: limpio.slice(0, 400) };
    }
  } catch (e: any) {
    const status = e?.status ? ` (HTTP ${e.status})` : '';
    return { ok: false, error: `${e?.name === 'APIConnectionTimeoutError' ? 'El modelo no respondió en 170 s' : e?.message ?? 'fallo al llamar al modelo'}${status}` };
  }
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const t0 = Date.now();

  try {
    const { data: sesion, error } = await supabaseAdmin
      .from('ts_bat_sessions').select('*').eq('token', params.token).single();
    if (error || !sesion) return NextResponse.json({ error: `Sesión no encontrada: ${error?.message ?? 'sin fila'}` }, { status: 404 });

    const sc: any = sesion.scores;
    if (!sc?.personalidad) {
      return NextResponse.json({ error: 'La sesión no tiene puntajes calculados. Use Recalcular primero.' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const perfilKey = body?.perfil ?? sesion.perfil_cargo ?? perfilPorTitulo(sesion.vacancy_title);
    const perfil = perfilDe(perfilKey);
    const match = calcularMatch(sc, perfilKey);

    // Se le entrega TODO con etiquetas legibles: el agente no debe adivinar
    // que significa 'RES-dis' ni reconstruir escalas.
    const insumo = {
      candidato: sesion.candidate_name,
      cargo: perfil?.nombre ?? sesion.vacancy_title ?? 'Sin perfil de cargo definido',
      perfilCargo: perfil
        ? { nombre: perfil.nombre, version: perfil.version, descripcion: perfil.descripcion, fundamento: perfil.fundamento, criticos: perfil.criticos }
        : null,
      validez: sesion.validity,
      arquetipo: ARQUETIPOS[sc.personalidad.arquetipo] ?? ARQUETIPOS.EQUILIBRADO,
      rasgos: Object.entries(FACTORS).map(([k, f]) => ({
        rasgo: f.label,
        puntaje: sc.personalidad.factores?.[k],
        referenciaDelCargo: perfil?.bigfive?.[k as keyof typeof perfil.bigfive] ?? null,
        facetas: f.facets.map((fa) => ({ faceta: fa.label, puntaje: sc.personalidad.facetas?.[fa.key] })),
      })),
      estilo: {
        patron: DISC_PATRONES[sc.disc?.patron]?.nombre ?? null,
        descripcionPatron: DISC_PATRONES[sc.disc?.patron]?.descripcion ?? null,
        natural: sc.disc?.natural,
        mascaraSocial: sc.disc?.mascara,
        bajoPresion: sc.disc?.presion,
        referenciaDelCargo: perfil?.disc ?? null,
        afinidadOtrosCargos: sc.disc?.afinidades?.slice(0, 4),
      },
      motivadores: Object.entries(sc.motivadores?.pct ?? {}).map(([k, v]) => ({
        motivador: MOTIVADORES[k]?.label ?? k, puntaje: v,
        loSostiene: MOTIVADORES[k]?.loSostiene, loHaceIrse: MOTIVADORES[k]?.loHaceIrse,
      })),
      razonamiento: {
        total: sc.razonamiento?.total,
        porAptitud: Object.entries(sc.razonamiento?.bySubdomain ?? {}).map(([k, v]: any) => ({
          aptitud: RAZONAMIENTO_LABEL[k] ?? k, ...v,
        })),
      },
      integridad: {
        global: sc.integridad?.permisividadGlobal,
        porDimension: Object.entries(sc.integridad?.byDimension ?? {}).map(([k, v]) => ({
          dimension: INTEGRIDAD_LABEL[k] ?? k, puntaje: v,
        })),
        nota: 'Más alto es mejor: menor permisividad ante la conducta descrita.',
      },
      match,
    };

    // Las dos mitades salen al tiempo. Antes era una sola llamada larga.
    const [pPerfil, pDecision] = await Promise.all([
      redactar(SISTEMA_PERFIL, insumo, 3200),
      redactar(SISTEMA_DECISION, insumo, 6000),
    ]);

    if (!pPerfil.ok || !pDecision.ok) {
      const fallas = [
        !pPerfil.ok ? `perfil: ${pPerfil.error}` : null,
        !pDecision.ok ? `decisión: ${pDecision.error}` : null,
      ].filter(Boolean).join(' · ');
      return NextResponse.json(
        { error: `El psicólogo no pudo terminar (${Math.round((Date.now() - t0) / 1000)} s). ${fallas}` },
        { status: 502 }
      );
    }

    const informe = { ...pPerfil.datos, ...pDecision.datos };

    const guardar = {
      informe_ia: { ...informe, modelo: MODEL, generado_at: new Date().toISOString() },
      match_data: match,
      perfil_cargo: perfilKey ?? null,
      updated_at: new Date().toISOString(),
    };
    const { data: filas, error: eUpd } = await supabaseAdmin
      .from('ts_bat_sessions').update(guardar).eq('id', sesion.id).select('id');
    if (eUpd || !filas?.length) {
      // El informe existe; lo devolvemos aunque no se haya podido guardar,
      // para que el trabajo del modelo no se pierda por un problema de tabla.
      return NextResponse.json(
        { informe: guardar.informe_ia, match, aviso: `Se generó pero NO se guardó: ${eUpd?.message ?? 'cero filas actualizadas'}. Falta correr el SQL del 10-sep.` },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { informe: guardar.informe_ia, match, ms: Date.now() - t0 },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    console.error('bateria/informe-ia', err);
    return NextResponse.json({ error: `${err?.message ?? 'Error interno'} · ${Math.round((Date.now() - t0) / 1000)} s` }, { status: 500 });
  }
}
