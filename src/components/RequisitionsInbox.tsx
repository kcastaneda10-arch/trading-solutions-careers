"use client";

/**
 * BANDEJA DE REQUISICIONES · Wellness y el CWO
 *
 * Acá cae lo que los líderes piden desde WXM. Wellness arma el perfil o lo
 * devuelve; el CWO aprueba o rechaza. Al aprobar nace la vacante.
 *
 * ORDEN DE LA PANTALLA
 * Primero lo que espera acción, después lo cerrado. Una bandeja ordenada por
 * fecha entierra lo urgente entre lo resuelto: la requisición que lleva nueve
 * días esperando al CWO queda debajo de tres aprobadas de ayer.
 */

import { useEffect, useState, useCallback } from "react";
import {
  RequisitionStatus,
  STATUS_LABEL,
  STATUS_HINT,
  TYPE_LABEL,
  accionesDisponibles,
  TRANSICIONES,
  type AccionRequisicion,
} from "@/lib/requisitions";
import { PREFILTER_TEMPLATES } from "@/lib/prefilter-templates";
import PublishPanel from "@/components/PublishPanel";

type Requisicion = {
  id: string;
  lead_email: string;
  lead_name: string | null;
  area: string | null;
  title: string;
  requisition_type: "reemplazo" | "incremental";
  reason: string | null;
  needed_by: string | null;
  lead_responsibilities: string | null;
  lead_must_haves: string | null;
  responsibilities: string | null;
  nice_to_have: string | null;
  location: string | null;
  work_mode: string | null;
  salary_public: string | null;
  hook_en: string | null;
  title_en: string | null;
  description_en: string | null;
  requirements_en: string | null;
  responsibilities_en: string | null;
  nice_to_have_en: string | null;
  web_vacancy_id: number | null;
  job_description: string | null;
  requirements: string | null;
  salary_cap_cop: number | null;
  form_template_key: string | null;
  english_required: boolean | null;
  status: RequisitionStatus;
  decision_note: string | null;
  approved_at: string | null;
  vacancy_id: string | null;
  created_at: string;
  updated_at: string;
  dias_en_estado: number | null;
};

/** Grupos de la bandeja, en orden de urgencia. */
const GRUPOS: { estados: RequisitionStatus[]; titulo: string; nota: string }[] = [
  { estados: ["pedida"], titulo: "Para armar el perfil", nota: "Las pidió un líder y todavía nadie las tocó." },
  { estados: ["con_perfil"], titulo: "Esperando al CWO", nota: "Ya tienen perfil. Falta la decisión." },
  { estados: ["devuelta"], titulo: "Devueltas al líder", nota: "La pelota está del otro lado." },
  { estados: ["aprobada"], titulo: "Aprobadas, sin publicar", nota: "La vacante existe. Falta montarla en las fuentes." },
  { estados: ["publicada", "rechazada"], titulo: "Cerradas", nota: "" },
];

const COLOR: Record<RequisitionStatus, string> = {
  pedida: "bg-gray-100 text-gray-700",
  con_perfil: "bg-amber-100 text-amber-800",
  devuelta: "bg-orange-100 text-orange-800",
  aprobada: "bg-emerald-100 text-emerald-800",
  rechazada: "bg-red-100 text-red-800",
  publicada: "bg-blue-100 text-blue-800",
};

function Alerta({ dias, estado }: { dias: number | null; estado: RequisitionStatus }) {
  // Una requisición parada más de 3 días en un estado que espera acción
  // nuestra es un proceso que todavía no arrancó y nadie está mirando.
  if (dias == null || dias < 3) return null;
  if (estado === "publicada" || estado === "rechazada" || estado === "devuelta") return null;
  return (
    <span className="text-xs font-semibold text-red-600">
      {dias} días parada
    </span>
  );
}

export default function RequisitionsInbox() {
  const [items, setItems] = useState<Requisicion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const r = await fetch("/api/requisitions");
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo cargar la bandeja");
      setItems(j.requisiciones || []);
    } catch (e: any) {
      setError(e?.message || "Error de red");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando) {
    return <div className="py-16 text-center text-sm text-gray-400">Cargando requisiciones…</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
        <strong>No se pudo cargar:</strong> {error}
        <button onClick={cargar} className="ml-3 underline">Reintentar</button>
      </div>
    );
  }

  const pendientes = items.filter((r) => r.status === "pedida" || r.status === "con_perfil").length;

  return (
    <div>
      <div className="flex items-end gap-4 mb-1">
        <div>
          <h2 className="text-xl font-bold">Requisiciones</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Lo que los líderes pidieron desde WXM.
            {pendientes > 0 && (
              <> <strong className="text-gray-900">{pendientes}</strong> {pendientes === 1 ? "espera" : "esperan"} una decisión.</>
            )}
          </p>
        </div>
        <button
          onClick={cargar}
          className="ml-auto text-sm text-gray-500 hover:text-gray-900 underline"
        >
          Actualizar
        </button>
      </div>

      {items.length === 0 && (
        <div className="mt-8 border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="font-medium text-gray-900">Todavía no hay requisiciones</p>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Van a aparecer acá cuando un líder pida una vacante desde WXM. Si esperabas
            alguna, revisá que la persona tenga el rol de líder asignado.
          </p>
        </div>
      )}

      {GRUPOS.map((g) => {
        const delGrupo = items.filter((r) => g.estados.includes(r.status));
        if (delGrupo.length === 0) return null;
        return (
          <section key={g.titulo} className="mt-8">
            <div className="flex items-baseline gap-3 mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
                {g.titulo}
              </h3>
              <span className="text-sm text-gray-400">{delGrupo.length}</span>
              {g.nota && <span className="text-xs text-gray-400 ml-auto">{g.nota}</span>}
            </div>
            <div className="space-y-3">
              {delGrupo.map((r) => (
                <Tarjeta
                  key={r.id}
                  req={r}
                  abierta={abierta === r.id}
                  onToggle={() => setAbierta(abierta === r.id ? null : r.id)}
                  onCambio={cargar}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Tarjeta({
  req,
  abierta,
  onToggle,
  onCambio,
}: {
  req: Requisicion;
  abierta: boolean;
  onToggle: () => void;
  onCambio: () => void;
}) {
  const [perfil, setPerfil] = useState({
    job_description: req.job_description || "",
    responsibilities: req.responsibilities || "",
    requirements: req.requirements || "",
    nice_to_have: req.nice_to_have || "",
    salary_cap_cop: req.salary_cap_cop ? String(req.salary_cap_cop) : "",
    form_template_key: req.form_template_key || "",
    english_required: !!req.english_required,
    // Lo que hace falta para publicar. Sin esto la vacante vive en el ATS y
    // no tiene dónde aplicar.
    location: req.location || "",
    work_mode: req.work_mode || "Presencial",
    salary_public: req.salary_public || "",
    // El aviso de la compañía sale en inglés.
    title_en: req.title_en || "",
    hook_en: req.hook_en || "",
    description_en: req.description_en || "",
    responsibilities_en: req.responsibilities_en || "",
    requirements_en: req.requirements_en || "",
    nice_to_have_en: req.nice_to_have_en || "",
  });
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState<string | null>(null);
  const [problema, setProblema] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);
  const [urlAplicacion, setUrlAplicacion] = useState<string | null>(null);

  /**
   * El enlace donde la gente aplica vive en Neon, con id numérico; la vacante
   * del ATS tiene uuid. No hay una llave que los una, así que se busca por
   * título. Si no aparece, es que todavía no se publicó en la web — y el panel
   * lo dice en vez de mostrar un enlace roto.
   */
  async function abrirPublicacion() {
    setUrlAplicacion(null);
    try {
      const r = await fetch("/api/vacancies?status=open", { cache: "no-store" });
      const filas = await r.json();
      if (Array.isArray(filas)) {
        const t = req.title.trim().toLowerCase();
        const match = filas.find(
          (v: any) =>
            String(v.title || "").trim().toLowerCase() === t ||
            String(v.title_es || "").trim().toLowerCase() === t,
        );
        if (match?.id) {
          const base =
            process.env.NEXT_PUBLIC_APP_URL || "https://trading-solutions-careers.vercel.app";
          setUrlAplicacion(`${base}/vacantes/${match.id}`);
        }
      }
    } catch {
      // Sin enlace el panel sigue sirviendo: arma el texto igual.
    }
    setPublicando(true);
  }

  const acciones = accionesDisponibles(req.status);

  async function mover(accion: AccionRequisicion | "") {
    setEnviando(accion || "guardar");
    setProblema(null);
    try {
      const r = await fetch(`/api/requisitions/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: accion || undefined,
          nota: nota || undefined,
          ...perfil,
          salary_cap_cop: perfil.salary_cap_cop ? Number(perfil.salary_cap_cop) : null,
          form_template_key: perfil.form_template_key || null,
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setProblema([j.error, j.detail].filter(Boolean).join(" · "));
        return;
      }
      if (j.vacante) {
        alert(
          `Aprobada. Se creó la vacante "${j.vacante.title}" en el ATS con ${req.lead_email} ` +
            `como líder.\n\nDesde ahora corren los 22 días hasta la oferta.\n\n` +
            `Falta publicarla en las fuentes.`,
        );
      }
      setNota("");
      onCambio();
    } catch (e: any) {
      setProblema(e?.message || "Error de red");
    } finally {
      setEnviando(null);
    }
  }

  // El perfil es lo que el CWO aprueba: después de la aprobación se congela.
  const editable = req.status === "pedida" || req.status === "con_perfil" || req.status === "devuelta";
  // Los datos de publicación no son parte de lo aprobado, y encima se
  // necesitan DESPUÉS de aprobar. Bloquearlos junto con el perfil dejaba la
  // vacante aprobada sin poder publicarse nunca.
  const editablePublicacion = editable || req.status === "aprobada" || req.status === "publicada";

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{req.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {req.lead_name || req.lead_email}
              {req.area && <> · {req.area}</>}
              {" · "}
              {req.requisition_type === "incremental" ? "Incremental" : "Reemplazo"}
              {req.needed_by && <> · la necesita el {req.needed_by}</>}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Alerta dias={req.dias_en_estado} estado={req.status} />
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${COLOR[req.status]}`}>
              {STATUS_LABEL[req.status]}
            </span>
          </div>
        </div>
        {STATUS_HINT[req.status] && (
          <p className="text-xs text-gray-400 mt-2">{STATUS_HINT[req.status]}</p>
        )}
      </button>

      {abierta && (
        <div className="border-t border-gray-200 px-5 py-5 space-y-5">
          {/* Lo que escribió el líder */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
              Por qué la pide
            </p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {req.reason || <span className="text-gray-400">No escribió un motivo.</span>}
            </p>
            <p className="text-xs text-gray-400 mt-2">{TYPE_LABEL[req.requisition_type]}</p>
          </div>

          {req.status === "devuelta" && req.decision_note && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-900">
              <strong>Se la devolviste al líder:</strong> {req.decision_note}
            </div>
          )}

          {/* Lo que aportó el líder, al lado de los campos que hay que llenar.
              No se copia solo: se ofrece como base para que Wellness lo
              traduzca en vez de publicar el lenguaje interno del área. */}
          {editable && (req.lead_responsibilities || req.lead_must_haves) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">
                  Lo que escribió {req.lead_name || "el líder"}
                </p>
                <button
                  onClick={() => setPerfil({
                    ...perfil,
                    job_description: perfil.job_description || req.lead_responsibilities || "",
                    requirements: perfil.requirements || req.lead_must_haves || "",
                  })}
                  className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-blue-300 text-blue-900 hover:bg-blue-100"
                >
                  Usar como base
                </button>
              </div>
              {req.lead_responsibilities && (
                <div>
                  <p className="text-[11px] font-semibold text-blue-900/70 uppercase tracking-wide">Qué va a hacer</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap mt-0.5">{req.lead_responsibilities}</p>
                </div>
              )}
              {req.lead_must_haves && (
                <div>
                  <p className="text-[11px] font-semibold text-blue-900/70 uppercase tracking-wide">Qué no puede faltar</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap mt-0.5">{req.lead_must_haves}</p>
                </div>
              )}
              <p className="text-[11px] text-blue-900/60 leading-relaxed">
                Está en el lenguaje del área. Antes de publicarlo, revisá que no
                pida nada que no se pueda pedir: edad, estado civil, apariencia.
              </p>
            </div>
          )}

          {/* El perfil */}
          {editable && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Perfil del cargo · como se va a publicar
              </p>

              <label className="block">
                <span className="text-xs font-medium text-gray-700">Descripción</span>
                <textarea
                  value={perfil.job_description}
                  onChange={(e) => setPerfil({ ...perfil, job_description: e.target.value })}
                  rows={4}
                  className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Qué hace la persona en este cargo y por qué existe el puesto."
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-gray-700">Requisitos</span>
                <textarea
                  value={perfil.requirements}
                  onChange={(e) => setPerfil({ ...perfil, requirements: e.target.value })}
                  rows={4}
                  className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Uno por línea. Los que descartan de entrada, primero."
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-gray-700">Qué va a hacer · una por línea</span>
                <textarea
                  value={perfil.responsibilities}
                  onChange={(e) => setPerfil({ ...perfil, responsibilities: e.target.value })}
                  rows={5}
                  className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Cada línea es una viñeta del aviso."
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-gray-700">Nice to have · una por línea</span>
                <textarea
                  value={perfil.nice_to_have}
                  onChange={(e) => setPerfil({ ...perfil, nice_to_have: e.target.value })}
                  rows={3}
                  className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Lo que suma pero no descarta."
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Tope salarial (COP)</span>
                  <input
                    type="number"
                    value={perfil.salary_cap_cop}
                    onChange={(e) => setPerfil({ ...perfil, salary_cap_cop: e.target.value })}
                    className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Ej: 4500000"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    El prefiltro marca a quien pida por encima. No lo rechaza solo.
                  </span>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Cuestionario de prefiltro</span>
                  <select
                    value={perfil.form_template_key}
                    onChange={(e) => setPerfil({ ...perfil, form_template_key: e.target.value })}
                    className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option value="">Elegir…</option>
                    {Object.values(PREFILTER_TEMPLATES).map((t) => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Sin esto, a un psicólogo se le pregunta por Incoterms.
                  </span>
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={perfil.english_required}
                  onChange={(e) => setPerfil({ ...perfil, english_required: e.target.checked })}
                />
                El cargo exige inglés B2 o superior
              </label>
            </div>
          )}

          {/* Datos de publicación · siguen editables después de aprobar */}
          {editablePublicacion && (
            <div className="space-y-4 border-t border-gray-200 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Para publicar
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Ubicación</span>
                  <input
                    type="text"
                    value={perfil.location}
                    onChange={(e) => setPerfil({ ...perfil, location: e.target.value })}
                    className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Barranquilla, Colombia"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Modalidad</span>
                  <select
                    value={perfil.work_mode}
                    onChange={(e) => setPerfil({ ...perfil, work_mode: e.target.value })}
                    className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
                  >
                    <option>Presencial</option>
                    <option>Híbrido</option>
                    <option>Remoto</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-gray-700">Salario en el aviso</span>
                  <input
                    type="text"
                    value={perfil.salary_public}
                    onChange={(e) => setPerfil({ ...perfil, salary_public: e.target.value })}
                    className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="A convenir"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Esto lo ve el candidato. No es el tope.
                  </span>
                </label>
              </div>

              <details className="border border-gray-200 rounded-lg">
                <summary className="text-xs font-medium text-gray-700 px-3 py-2 cursor-pointer">
                  Versión en inglés · es la que se publica en LinkedIn
                </summary>
                <div className="px-3 pb-3 space-y-3">
                  <label className="block">
                    <span className="text-xs text-gray-600">Título</span>
                    <input type="text" value={perfil.title_en}
                      onChange={(e) => setPerfil({ ...perfil, title_en: e.target.value })}
                      className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                      placeholder={req.title} />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-600">Gancho de la primera línea</span>
                    <input type="text" value={perfil.hook_en}
                      onChange={(e) => setPerfil({ ...perfil, hook_en: e.target.value })}
                      className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="to connect markets and build international agent networks" />
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      Completa la frase «We&apos;re looking for a [cargo] …!»
                    </span>
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-600">Descripción</span>
                    <textarea value={perfil.description_en} rows={4}
                      onChange={(e) => setPerfil({ ...perfil, description_en: e.target.value })}
                      className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-600">What You&apos;ll Do</span>
                    <textarea value={perfil.responsibilities_en} rows={5}
                      onChange={(e) => setPerfil({ ...perfil, responsibilities_en: e.target.value })}
                      className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-600">Requirements</span>
                    <textarea value={perfil.requirements_en} rows={4}
                      onChange={(e) => setPerfil({ ...perfil, requirements_en: e.target.value })}
                      className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-600">Nice to Have</span>
                    <textarea value={perfil.nice_to_have_en} rows={3}
                      onChange={(e) => setPerfil({ ...perfil, nice_to_have_en: e.target.value })}
                      className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
                  </label>
                  <p className="text-[11px] text-gray-400">
                    Lo que dejes vacío cae al español, así que la vacante nunca queda con un hueco.
                  </p>
                </div>
              </details>

            </div>
          )}

          {/* Motivo, cuando la acción lo pide */}
          {(acciones.includes("devolver") || acciones.includes("rechazar")) && (
            <label className="block">
              <span className="text-xs font-medium text-gray-700">
                Motivo (obligatorio para devolver o rechazar)
              </span>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={2}
                className="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Qué falta o por qué no procede. Esto es lo que va a leer el líder."
              />
            </label>
          )}

          {problema && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {problema}
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 pt-1">
            {editablePublicacion && (
              <button
                onClick={() => mover("")}
                disabled={!!enviando}
                className="text-sm px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                {enviando === "guardar" ? "Guardando…" : "Guardar sin enviar"}
              </button>
            )}
            {acciones.map((a) => {
              const t = TRANSICIONES[a];
              const destructiva = a === "rechazar" || a === "devolver";
              const principal = a === "aprobar" || a === "armar_perfil";
              if (a === "publicar") return null; // se publica desde Vacantes
              return (
                <button
                  key={a}
                  onClick={() => mover(a)}
                  disabled={!!enviando}
                  className={
                    "text-sm px-4 py-2 rounded-full font-medium disabled:opacity-50 " +
                    (principal
                      ? "bg-black text-white hover:bg-gray-800"
                      : destructiva
                        ? "border border-red-300 text-red-700 hover:bg-red-50"
                        : "border border-gray-300 hover:bg-gray-50")
                  }
                >
                  {enviando === a ? "…" : t.label}
                </button>
              );
            })}
          </div>

          {req.vacancy_id && (
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <p className="text-xs text-gray-400">
                Vacante creada en el ATS. El proceso corre en el Funnel.
              </p>
              <button
                onClick={abrirPublicacion}
                className="text-sm px-4 py-2 rounded-full bg-black text-white hover:bg-gray-800 font-medium"
              >
                Publicar en las fuentes
              </button>
            </div>
          )}

          {publicando && req.vacancy_id && (
            <PublishPanel
              vacancyId={req.vacancy_id}
              requisicionId={req.id}
              datos={{
                title: req.title,
                title_en: req.title_en,
                hook_en: req.hook_en,
                area: req.area,
                location: req.location,
                work_mode: req.work_mode,
                salary_public: req.salary_public,
                description: req.job_description,
                description_en: req.description_en,
                responsibilities: req.responsibilities,
                responsibilities_en: req.responsibilities_en,
                requirements: req.requirements,
                requirements_en: req.requirements_en,
                nice_to_have: req.nice_to_have,
                nice_to_have_en: req.nice_to_have_en,
              }}
              urlAplicacion={urlAplicacion}
              onCerrar={() => {
                setPublicando(false);
                onCambio();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
