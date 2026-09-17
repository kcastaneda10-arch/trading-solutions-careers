"use client";

/**
 * REDACCIÓN DEL AVISO · desde la requisición, en tres idiomas
 *
 * Dos paneles: a la izquierda lo que se le da al agente, a la derecha lo que
 * devuelve. Al final, «Usar descripción» baja el resultado a los campos de la
 * requisición.
 *
 * POR QUÉ LLENA LOS CAMPOS Y NO SOLO MUESTRA TEXTO
 * Un panel que solo muestra el aviso deja el trabajo a medias: alguien tiene que
 * recortar un texto corrido y repartirlo a mano en seis casillas, que es
 * exactamente el rato que se quería ahorrar. Por eso el agente devuelve dos
 * cosas: el aviso listo para publicar y los campos sueltos para la requisición.
 *
 * LO QUE FALTA VIENE MARCADO
 * Si la requisición no trae un dato, sale entre corchetes en vez de inventarse.
 * Un aviso con [años de experiencia] a la vista se corrige en diez segundos; uno
 * con un dato inventado se publica sin que nadie lo note.
 *
 * Y SE CORRIGE ACÁ, NO AFUERA
 * El panel de la derecha era de solo lectura, con un botón de copiar. O sea que
 * para quitar un [Your Name] había que copiar el aviso a otro lado, arreglarlo
 * allá y pegarlo en el portal — y el corchete que la pantalla marcaba en amarillo
 * seguía marcado, porque el texto nunca cambiaba. Mostrar un problema sin dejar
 * arreglarlo en el mismo lugar es la mitad del trabajo.
 *
 * Ahora el aviso se edita en el sitio. El contador de «falta completar» baja solo
 * a medida que se llenan los corchetes, cada idioma guarda su propia corrección,
 * y siempre se puede volver a lo que escribió el agente.
 */

import { useState } from "react";

type Idioma = "es" | "en" | "zh";
type Tono = "formal" | "neutro" | "amigable";

export type CamposGenerados = Partial<{
  responsibilities: string;
  requirements: string;
  nice_to_have: string;
  title_en: string;
  hook_en: string;
  description_en: string;
  responsibilities_en: string;
  requirements_en: string;
  nice_to_have_en: string;
  palabras_clave: string;
  habilidades_tecnicas: string;
  habilidades_blandas: string;
  nivel_educacion: string;
  seniority: string;
}>;

const IDIOMAS: { id: Idioma; label: string; nota: string }[] = [
  { id: "es", label: "Español", nota: "Página de careers y portales locales" },
  { id: "en", label: "English", nota: "LinkedIn y aviso corporativo" },
  { id: "zh", label: "中文", nota: "Mercado chino" },
];

const TONOS: { id: Tono; label: string }[] = [
  { id: "formal", label: "Formal" },
  { id: "neutro", label: "Neutro" },
  { id: "amigable", label: "Amigable" },
];

export default function AvisoMultiIdioma({
  requisitionId,
  titulo,
  onUsar,
  onCerrar,
}: {
  requisitionId: string;
  titulo: string;
  onUsar: (campos: CamposGenerados) => void;
  onCerrar: () => void;
}) {
  const [extras, setExtras] = useState("");
  const [tono, setTono] = useState<Tono>("neutro");
  const [cargando, setCargando] = useState(false);
  const [posts, setPosts] = useState<Record<Idioma, string> | null>(null);
  /** Lo que devolvió el agente, intacto, para poder volver atrás. */
  const [original, setOriginal] = useState<Record<Idioma, string> | null>(null);
  const [campos, setCampos] = useState<CamposGenerados>({});
  const [activa, setActiva] = useState<Idioma>("es");
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function generar() {
    setCargando(true);
    setError(null);
    try {
      const r = await fetch("/api/agents/job-post-multilang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requisition_id: requisitionId, extras: extras.trim() || undefined, tono }),
      });
      const j = await r.json();
      if (!r.ok) {
        // Sin el detalle queda un "error" mudo y hay que ir a los logs.
        setError([j.error, j.detail].filter(Boolean).join(" · "));
        if (j.raw) { setPosts({ es: j.raw, en: j.raw, zh: j.raw }); setOriginal({ es: j.raw, en: j.raw, zh: j.raw }); }
        return;
      }
      setPosts(j.posts);
      setOriginal(j.posts);
      setCampos(j.campos || {});
    } catch (e: any) {
      setError(e?.message || "No se pudo generar");
    } finally {
      setCargando(false);
    }
  }

  async function copiar() {
    if (!posts) return;
    try {
      await navigator.clipboard.writeText(posts[activa]);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      setError("El navegador bloqueó el portapapeles. Seleccioná el texto y copialo a mano.");
    }
  }

  /** Corrige el aviso del idioma que está a la vista. Cada uno guarda el suyo. */
  function editar(texto: string) {
    setPosts((p) => (p ? { ...p, [activa]: texto } : p));
  }

  function volverAlGenerado() {
    if (!original) return;
    setPosts((p) => (p ? { ...p, [activa]: original[activa] } : p));
  }

  // Se recalcula con cada tecla: el contador de corchetes baja solo mientras
  // se llenan, que es la única forma de saber que ya no falta nada.
  const huecos = posts ? Array.from(new Set(posts[activa].match(/\[[^\]]+\]/g) || [])) : [];
  const editado = !!posts && !!original && posts[activa] !== original[activa];
  const hayCampos = Object.keys(campos).length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden">

        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-black flex items-center gap-2">
              ✦ Redacte el aviso con inteligencia artificial
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Toma lo que ya está en la requisición y arma el aviso completo en español, inglés y
              mandarín. Según el detalle que agregues, llena también los campos del perfil.
            </p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-black text-xl leading-none px-2" aria-label="Cerrar">×</button>
        </div>

        {/* Dos paneles */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-4 p-5">

            {/* Izquierda · insumos */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-4 self-start">
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-1.5">Cargo</div>
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900">
                  {titulo}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-700 mb-1.5">
                  Detalle adicional <span className="font-normal text-gray-400">(opcional)</span>
                </div>
                <textarea
                  value={extras}
                  onChange={(e) => setExtras(e.target.value.slice(0, 4000))}
                  rows={9}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
                  placeholder="Sistemas específicos, certificaciones, rutas comerciales, normativa aplicable, lo que pidió el líder y no quedó escrito en la requisición."
                />
                <div className="text-[11px] text-gray-400 text-right mt-1">{extras.length} / 4000</div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-gray-700 mb-2">Tono</div>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {TONOS.map((t) => (
                    <label key={t.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="tono"
                        checked={tono === t.id}
                        onChange={() => setTono(t.id)}
                        className="accent-black"
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={generar}
                disabled={cargando}
                className="w-full border border-gray-300 rounded-full py-2.5 text-sm font-semibold hover:border-black hover:bg-white disabled:opacity-50"
              >
                {cargando ? "Generando…" : posts ? "Generar de nuevo" : "Generar"}
              </button>
            </div>

            {/* Derecha · resultado */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="text-xs font-semibold text-gray-700">
                  Aviso sugerido
                  {posts && (
                    <span className="ml-1.5 font-normal text-gray-400">· se puede corregir acá</span>
                  )}
                </div>
                {posts && editado && (
                  <button
                    onClick={volverAlGenerado}
                    className="text-[11px] text-gray-500 underline hover:text-black mr-auto ml-2"
                  >
                    Volver al texto generado
                  </button>
                )}
                {posts && (
                  <button
                    onClick={copiar}
                    className="text-[11px] font-semibold uppercase tracking-[1px] px-2.5 py-1 border border-gray-300 rounded-full hover:border-black"
                  >
                    {copiado ? "Copiado ✓" : "Copiar"}
                  </button>
                )}
              </div>

              {posts && (
                <div className="flex gap-1 mb-2">
                  {IDIOMAS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setActiva(l.id)}
                      title={l.nota}
                      className={
                        "text-xs px-3 py-1.5 rounded-full font-medium " +
                        (activa === l.id
                          ? "bg-black text-white"
                          : "border border-gray-300 text-gray-500 hover:border-gray-500")
                      }
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}

              {huecos.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-2">
                  <div className="text-[10px] uppercase tracking-[1.5px] text-amber-700 font-bold mb-0.5">
                    Falta completar · {huecos.length}
                  </div>
                  <div className="text-[11px] text-amber-900 leading-relaxed">{huecos.join(" · ")}</div>
                </div>
              )}

              {/* Cerrar el círculo: si la pantalla avisó que faltaba algo, también
                  tiene que avisar cuando ya no falta. Si no, nunca se sabe si se
                  llenó bien o si el aviso simplemente dejó de aparecer. */}
              {posts && huecos.length === 0 && editado && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-2 mb-2">
                  <div className="text-[11px] text-emerald-800">
                    No quedan corchetes pendientes en esta versión.
                  </div>
                </div>
              )}

              <div className="flex-1 bg-gray-100 rounded-xl min-h-[380px] max-h-[52vh] overflow-y-auto">
                {!posts && !cargando && (
                  <div className="h-full flex items-center justify-center text-center px-8 py-16">
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Completá el detalle si querés y presioná <b>Generar</b>.<br />
                      Las tres versiones salen en una sola pasada para que digan lo mismo.
                    </p>
                  </div>
                )}
                {cargando && (
                  <div className="h-full flex items-center justify-center text-center px-8 py-16">
                    <p className="text-sm text-gray-500">
                      Un momento, estamos redactando el aviso…<br />
                      <span className="text-xs text-gray-400">Toma entre 30 y 60 segundos.</span>
                    </p>
                  </div>
                )}
                {posts && (
                  <textarea
                    value={posts[activa]}
                    onChange={(e) => editar(e.target.value)}
                    spellCheck
                    aria-label="Aviso sugerido · se puede corregir"
                    className="w-full h-full min-h-[380px] bg-transparent p-4 text-[13px] leading-relaxed
                               font-sans text-gray-900 resize-none outline-none
                               focus:bg-white focus:ring-2 focus:ring-gray-900 rounded-xl"
                  />
                )}
              </div>

              {/* Lo que piden los portales, aparte del cuerpo del aviso */}
              {posts && (campos.palabras_clave || campos.habilidades_tecnicas) && (
                <details className="mt-2 border border-gray-200 rounded-lg">
                  <summary className="cursor-pointer text-xs font-semibold text-gray-700 px-3 py-2">
                    Para los portales · palabras clave y habilidades
                  </summary>
                  <div className="px-3 pb-3 space-y-2.5 text-[12px]">
                    {([
                      ["Palabras clave", campos.palabras_clave],
                      ["Habilidades técnicas", campos.habilidades_tecnicas],
                      ["Habilidades interpersonales", campos.habilidades_blandas],
                      ["Nivel educativo", campos.nivel_educacion],
                      ["Nivel del cargo", campos.seniority],
                    ] as [string, string | undefined][])
                      .filter(([, v]) => !!v)
                      .map(([k, v]) => (
                        <div key={k}>
                          <div className="text-[10px] uppercase tracking-[1.2px] text-gray-400 font-bold">{k}</div>
                          <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">{v}</div>
                        </div>
                      ))}
                  </div>
                </details>
              )}

              <p className="text-[11px] text-gray-500 mt-2 flex items-start gap-1.5">
                <span aria-hidden="true">⚠</span>
                <span>
                  Revisá el resultado antes de publicar: la IA puede proponer requisitos que no
                  aplican. Lo que no estaba en la requisición sale entre corchetes.
                </span>
              </p>
            </div>
          </div>

          {error && (
            <div className="mx-5 mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onCerrar}
            className="text-sm px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50"
          >
            Continuar sin IA
          </button>
          <button
            onClick={() => { onUsar(campos); onCerrar(); }}
            disabled={!hayCampos}
            title={hayCampos ? "Baja el resultado a los campos de la requisición" : "Primero generá el aviso"}
            className="text-sm px-5 py-2 rounded-full font-medium bg-black text-white hover:bg-gray-800 disabled:opacity-40"
          >
            Usar descripción →
          </button>
        </div>
      </div>
    </div>
  );
}
