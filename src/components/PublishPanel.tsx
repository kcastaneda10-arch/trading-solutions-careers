"use client";

/**
 * PANEL DE PUBLICACIÓN · dónde está montada una vacante
 *
 * Arma el texto listo para pegar en cada portal y registra dónde se publicó.
 *
 * POR QUÉ NO PUBLICA SOLO
 * LinkedIn tiene API pero exige el producto Job Posting de Talent Solutions,
 * que se aprueba comercialmente. Turpial y Magneto no tienen integración. Un
 * botón que dijera "Publicar" sin publicar sería peor que no tenerlo: alguien
 * confiaría y la vacante no quedaría en ningún lado. Así que esto hace lo que
 * sí puede hacer bien — quitar el trabajo de redactar y dejar registro — y
 * dice con todas las letras qué falta hacer a mano.
 */

import { useEffect, useState, useCallback } from "react";
import { construirAviso, type DatosDelAviso } from "@/lib/job-post";

type Fuente = {
  key: string;
  label: string;
  automatico: boolean;
  publicada: boolean;
};

type Publicacion = {
  source: string;
  posted_at: string;
  external_url: string | null;
};

export default function PublishPanel({
  vacancyId,
  requisicionId,
  datos,
  urlAplicacion,
  onCerrar,
}: {
  vacancyId: string;
  /** Para publicar en careers hace falta la requisición, no la vacante. */
  requisicionId?: string | null;
  datos: DatosDelAviso;
  urlAplicacion?: string | null;
  onCerrar: () => void;
}) {
  const titulo = datos.title;
  const [fuentes, setFuentes] = useState<Fuente[]>([]);
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const r = await fetch(`/api/vacancies/${vacancyId}/postings`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo cargar");
      setFuentes(j.fuentes || []);
      setPublicaciones(j.publicaciones || []);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Error de red");
    } finally {
      setCargando(false);
    }
  }, [vacancyId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const enlace = urlAplicacion || "";

  // El aviso sale con el formato estándar de la compañía. Antes se armaba a
  // mano y cada vacante quedaba distinta según quién la escribiera.
  const texto = construirAviso(datos, enlace || null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError("El navegador no dejó copiar. Seleccioná el texto y copialo a mano.");
    }
  }

  const [publicandoWeb, setPublicandoWeb] = useState(false);

  /** La página de empleo sí se puede publicar desde acá: escribe en Neon. */
  async function publicarEnCareers() {
    if (!requisicionId) {
      setError("Esta vacante no viene de una requisición, así que se publica desde la pestaña Vacantes.");
      return;
    }
    setPublicandoWeb(true);
    setError(null);
    try {
      const r = await fetch(`/api/requisitions/${requisicionId}/publish-web`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) {
        setError([j.error, j.detail].filter(Boolean).join(" · "));
        return;
      }
      window.alert(`Publicada en la página de empleo.\n\n${j.url}`);
      cargar();
    } catch (e: any) {
      setError(e?.message || "Error de red");
    } finally {
      setPublicandoWeb(false);
    }
  }

  async function marcar(source: string, ya: boolean) {
    // La página de empleo no se "marca": se publica.
    if (source === "careers" && !ya) return publicarEnCareers();
    try {
      if (ya) {
        await fetch(`/api/vacancies/${vacancyId}/postings?source=${source}`, { method: "DELETE" });
      } else {
        const url = window.prompt(
          `Enlace de la publicación en ${source} (opcional, podés dejarlo vacío):`,
          "",
        );
        // Cancelar el prompt no debe marcarla: es la forma de arrepentirse.
        if (url === null) return;
        await fetch(`/api/vacancies/${vacancyId}/postings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ source, external_url: url || null }),
        });
      }
      cargar();
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar");
    }
  }

  const faltan = fuentes.filter((f) => !f.publicada);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8">
        <div className="flex items-start gap-4 px-7 pt-6 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold">Publicar la vacante</h3>
            <p className="text-sm text-gray-500 mt-0.5">{titulo}</p>
          </div>
          <button
            onClick={onCerrar}
            className="ml-auto w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="px-7 py-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {!enlace && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
              Todavía no está en la página de empleo, así que el aviso no tiene enlace
              donde aplicar. Publicala primero acá arriba, en <strong>Página de empleo</strong>:
              sin enlace, quien la vea en LinkedIn tiene que mandar la hoja de vida por
              correo y no entra al funnel.
            </div>
          )}

          {/* ── Dónde está publicada ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Dónde está publicada
            </p>
            {cargando ? (
              <p className="text-sm text-gray-400">Cargando…</p>
            ) : (
              <div className="space-y-2">
                {fuentes.map((f) => {
                  const pub = publicaciones.find((p) => p.source === f.key);
                  return (
                    <div
                      key={f.key}
                      className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{f.label}</p>
                        <p className="text-xs text-gray-500">
                          {f.publicada && pub ? (
                            <>
                              Publicada el {new Date(pub.posted_at).toLocaleDateString("es-CO")}
                              {pub.external_url && (
                                <>
                                  {" · "}
                                  <a
                                    href={pub.external_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                  >
                                    ver
                                  </a>
                                </>
                              )}
                            </>
                          ) : f.automatico ? (
                            "Se publica desde acá, con lo que armaste en la requisición"
                          ) : (
                            "Hay que montarla a mano en el portal"
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => marcar(f.key, f.publicada)}
                        className={
                          "ml-auto text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap " +
                          (f.publicada
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "border border-gray-300 text-gray-700 hover:bg-gray-50")
                        }
                      >
                        {f.publicada
                          ? "Publicada ✓"
                          : f.key === "careers"
                            ? publicandoWeb ? "Publicando…" : "Publicar ahora"
                            : "Marcar publicada"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {faltan.length > 0 && !cargando && (
              <p className="text-xs text-gray-400 mt-3">
                Faltan {faltan.length}: {faltan.map((f) => f.label).join(", ")}.
              </p>
            )}
          </div>

          {/* ── El texto listo ── */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Texto para el portal
              </p>
              <button
                onClick={copiar}
                className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-full bg-black text-white hover:bg-gray-800"
              >
                {copiado ? "Copiado ✓" : "Copiar"}
              </button>
            </div>
            <textarea
              readOnly
              value={texto}
              rows={12}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 font-mono bg-gray-50"
            />
            <p className="text-xs text-gray-400 mt-2">
              Sale del perfil que armaste en la requisición. Si querés cambiarlo para un
              portal en particular, editalo después de pegarlo.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 leading-relaxed">
            <strong className="text-gray-900">Por qué esto no publica solo.</strong>{" "}
            LinkedIn permite publicar por API, pero exige el producto Job Posting de
            Talent Solutions, que se aprueba comercialmente — hay que pedírselo al
            account manager. Turpial y Magneto no tienen integración construida. Un
            botón que dijera «Publicar» sin publicar sería peor que no tenerlo.
          </div>
        </div>
      </div>
    </div>
  );
}
