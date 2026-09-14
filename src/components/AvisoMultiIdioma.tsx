"use client";

/**
 * AVISO EN TRES IDIOMAS · redacción desde la requisición
 *
 * Toma lo que Wellness y el líder ya escribieron en la requisición y devuelve
 * el aviso listo para publicar en español, inglés y mandarín, con el formato
 * real de Trading Solutions.
 *
 * POR QUÉ LAS TRES JUNTAS
 * Publicar en China exige el aviso en chino, y traducir después produce textos
 * que se leen importados. Pedirlas en una sola pasada mantiene la misma
 * sustancia en las tres y evita que se desincronicen cuando alguien corrige una
 * sola versión.
 *
 * LO QUE FALTA VIENE MARCADO
 * Si la requisición no trae un dato, el agente lo deja entre corchetes en vez de
 * inventarlo. Un aviso con [años de experiencia] visible se corrige en diez
 * segundos; uno con un dato inventado se publica sin que nadie lo note.
 */

import { useState } from "react";

type Idioma = "es" | "en" | "zh";

const PESTANAS: { id: Idioma; label: string; nota: string }[] = [
  { id: "es", label: "Español", nota: "Para la página de careers y portales locales" },
  { id: "en", label: "English", nota: "Versión de referencia · LinkedIn y aviso corporativo" },
  { id: "zh", label: "中文", nota: "Para búsquedas en el mercado chino" },
];

export default function AvisoMultiIdioma({
  requisitionId,
  titulo,
  onCerrar,
}: {
  requisitionId: string;
  titulo: string;
  onCerrar: () => void;
}) {
  const [cargando, setCargando] = useState(false);
  const [posts, setPosts] = useState<Record<Idioma, string> | null>(null);
  const [activa, setActiva] = useState<Idioma>("es");
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<Idioma | null>(null);
  const [extras, setExtras] = useState("");

  async function redactar() {
    setCargando(true);
    setError(null);
    try {
      const r = await fetch("/api/agents/job-post-multilang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requisition_id: requisitionId, extras: extras.trim() || undefined }),
      });
      const j = await r.json();
      if (!r.ok) {
        // El detalle es lo único que dice qué pasó; sin él queda un "error" mudo.
        setError([j.error, j.detail].filter(Boolean).join(" · "));
        if (j.raw) setPosts({ es: j.raw, en: j.raw, zh: j.raw });
        return;
      }
      setPosts(j.posts);
    } catch (e: any) {
      setError(e?.message || "No se pudo redactar");
    } finally {
      setCargando(false);
    }
  }

  async function copiar(idioma: Idioma) {
    if (!posts) return;
    try {
      await navigator.clipboard.writeText(posts[idioma]);
      setCopiado(idioma);
      setTimeout(() => setCopiado(null), 1800);
    } catch {
      setError("El navegador bloqueó el portapapeles. Seleccioná el texto y copialo a mano.");
    }
  }

  const huecos = posts ? (posts[activa].match(/\[[^\]]+\]/g) || []) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden">

        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[2px] text-gray-400 font-semibold">
              Aviso de vacante
            </div>
            <h3 className="text-lg font-bold text-black mt-0.5">{titulo}</h3>
          </div>
          <button
            onClick={onCerrar}
            className="text-gray-400 hover:text-black text-xl leading-none px-2"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto">
          {!posts && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Redacta el aviso completo en <b>español, inglés y mandarín</b> a partir de lo
                que ya está en la requisición: responsabilidades, requisitos, deseables,
                ubicación y salario. Sale con el formato que publicamos — titular, párrafo de
                compañía, las tres secciones, correo de postulación y hashtags.
              </p>

              <label className="block">
                <span className="text-xs font-medium text-gray-700">
                  Algo más que deba tener en cuenta (opcional)
                </span>
                <textarea
                  value={extras}
                  onChange={(e) => setExtras(e.target.value)}
                  rows={3}
                  className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Sistemas específicos, certificaciones, rutas comerciales, lo que pidió el líder y no quedó escrito."
                />
              </label>

              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 leading-relaxed">
                Lo que no esté en la requisición va a salir <b>entre corchetes</b> para que lo
                completes — no se inventa. Revisá siempre antes de publicar.
              </div>

              <button
                onClick={redactar}
                disabled={cargando}
                className="w-full bg-black text-white text-sm font-medium py-2.5 rounded-full hover:bg-gray-800 disabled:opacity-50"
              >
                {cargando ? "Redactando las tres versiones…" : "✦ Redactar aviso"}
              </button>

              {cargando && (
                <p className="text-xs text-gray-400 text-center">
                  Toma entre 30 y 60 segundos. Las tres salen en una sola pasada para que digan lo mismo.
                </p>
              )}
            </div>
          )}

          {posts && (
            <div>
              {/* Pestañas */}
              <div className="flex border-b border-gray-200 px-6 pt-4 gap-1">
                {PESTANAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiva(p.id)}
                    className={
                      "text-sm px-4 py-2 rounded-t-lg font-medium border-b-2 -mb-px " +
                      (activa === p.id
                        ? "border-black text-black"
                        : "border-transparent text-gray-400 hover:text-gray-700")
                    }
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="px-6 pt-3 pb-2 flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500">
                  {PESTANAS.find((p) => p.id === activa)?.nota}
                </span>
                <button
                  onClick={() => copiar(activa)}
                  className="text-xs font-semibold uppercase tracking-[1px] px-3 py-1.5 border border-gray-300 rounded-full hover:border-black"
                >
                  {copiado === activa ? "Copiado ✓" : "Copiar"}
                </button>
              </div>

              {huecos.length > 0 && (
                <div className="mx-6 mb-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-[10px] uppercase tracking-[1.5px] text-amber-700 font-bold mb-1">
                    Falta completar · {huecos.length}
                  </div>
                  <div className="text-xs text-amber-900 leading-relaxed">
                    {Array.from(new Set(huecos)).join(" · ")}
                  </div>
                </div>
              )}

              <pre className="mx-6 mb-6 p-4 bg-gray-50 rounded-lg text-[13px] leading-relaxed whitespace-pre-wrap font-sans text-gray-900">
                {posts[activa]}
              </pre>
            </div>
          )}

          {error && (
            <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Pie */}
        {posts && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between gap-3">
            <button
              onClick={() => { setPosts(null); setError(null); }}
              className="text-sm text-gray-500 hover:text-black"
            >
              Volver a redactar
            </button>
            <button
              onClick={onCerrar}
              className="text-sm px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
