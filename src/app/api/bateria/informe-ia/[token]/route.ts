import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/bateria/auth';
import { getAnthropic } from '@/lib/anthropic';
import { calcularMatch } from '@/lib/bateria/match';
import { perfilDe, perfilPorTitulo } from '@/lib/bateria/perfiles-cargo';
import { FACTORS, MOTIVADORES, INTEGRIDAD_LABEL, RAZONAMIENTO_LABEL, DISC_PATRONES, ARQUETIPOS } from '@/lib/bateria/interpretacion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Sonnet redactando un informe completo tarda 30-90 s. Sin esto la funcion
 *  corre con el limite por defecto (~15 s), se corta a mitad y el boton se
 *  queda pensando sin decir nada. Mismo valor que usan los otros agentes. */
export const maxDuration = 300;

const MODEL = 'claude-sonnet-4-5';

/**
 * Agente psicologo: redacta el informe narrativo a partir de puntajes YA
 * calculados. No puntua, no infiere numeros y no diagnostica.
 *
 * El prompt lleva tres candados que no son adorno:
 *  1. Recibe los puntajes hechos. Si inventa un numero, el informe deja de ser
 *     auditable, que es lo unico que lo hace defendible.
 *  2. Si la validez de la sesion es dudosa, no caracteriza a la persona.
 *     Un perfil de alguien que respondio sin leer no es un perfil.
 *  3. Nada de lenguaje clinico. Es una bateria laboral, no un diagnostico.
 */
const SISTEMA = `Eres psicólogo organizacional con tarjeta profesional, redactando el informe de una batería de selección propia de Trading Solutions (freight forwarder, Barranquilla).

REGLAS QUE NO PUEDES ROMPER:

1. Los puntajes te llegan calculados. NUNCA inventes, estimes ni corrijas un número. Si necesitas citar una cifra, usa exactamente la que recibiste.
2. NO diagnostiques. "Estabilidad emocional" es el nombre de una escala laboral, no una condición de salud. Prohibido: ansiedad, depresión, trastorno, patología, terapia, y cualquier inferencia clínica.
3. Los puntajes DISC son ipsativos: dicen qué eje pesa más DENTRO de la persona. Nunca digas que es "más dominante que otros candidatos".
4. Si la validez de la sesión viene marcada como no interpretable o con reservas por deseabilidad social alta o respuestas demasiado rápidas, DILO PRIMERO y no caracterices a la persona como si el perfil fuera confiable.
5. Escribe en español colombiano, directo y concreto. Nada de "el candidato demuestra una notable capacidad". Frases cortas. Ejemplos observables de trabajo.
6. Cada afirmación se apoya en un dato que recibiste. Si no tienes evidencia para algo, no lo digas.
7. Nunca menciones características protegidas: edad, sexo, origen, religión, salud, situación familiar.

Responde ÚNICAMENTE con JSON válido, sin texto antes ni después, con esta forma exacta:
{
  "resumen": "2 o 3 párrafos sobre cómo trabaja esta persona",
  "fortalezas": [{"titulo":"","detalle":"","evidencia":""}],
  "oportunidades": [{"titulo":"","detalle":"","evidencia":""}],
  "compatibilidad": {"lectura":"", "aFavor":[""], "riesgos":[""]},
  "preguntasEntrevista": [{"pregunta":"","porque":"","queEscuchar":""}],
  "planEntrada": [{"periodo":"","foco":"","porque":""}],
  "conclusion": {"recomendacion":"avanzar|entrevistar_con_reservas|no_avanzar","texto":""},
  "loQueNoAfirma": ""
}
3 a 5 fortalezas, 2 a 4 oportunidades, 4 a 6 preguntas, 3 o 4 periodos de plan.`;

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { data: sesion, error } = await supabaseAdmin
      .from('ts_bat_sessions').select('*').eq('token', params.token).single();
    if (error || !sesion) return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });

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

    const client = getAnthropic();
    const r = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system: SISTEMA,
      messages: [{ role: 'user', content: `Redacta el informe con estos datos:\n\n${JSON.stringify(insumo, null, 2)}` }],
    });

    const texto = r.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
    const limpio = texto.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');

    let informe: any;
    try {
      informe = JSON.parse(limpio);
    } catch {
      return NextResponse.json({ error: 'El agente no devolvió JSON válido', crudo: limpio.slice(0, 600) }, { status: 502 });
    }

    const guardar = {
      informe_ia: { ...informe, modelo: MODEL, generado_at: new Date().toISOString() },
      match_data: match,
      perfil_cargo: perfilKey ?? null,
      updated_at: new Date().toISOString(),
    };
    const { data: filas, error: eUpd } = await supabaseAdmin
      .from('ts_bat_sessions').update(guardar).eq('id', sesion.id).select('id');
    if (eUpd || !filas?.length) {
      return NextResponse.json({ error: `No se pudo guardar el informe: ${eUpd?.message ?? 'cero filas'}` }, { status: 500 });
    }

    return NextResponse.json({ informe: guardar.informe_ia, match }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    console.error('bateria/informe-ia', err);
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 });
  }
}
