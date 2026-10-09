"use client";

/**
 * PRUEBAS EXTERNAS · quién presentó qué, en una sola tabla
 *
 * Trading Solutions aplica pruebas en seis plataformas distintas, cada una con
 * su cuenta y su portal. Hasta hoy, saber si a un candidato le faltaba Betesa
 * significaba entrar a Bluesite, buscarlo y acordarse. Con seis proveedores y
 * cuarenta candidatos eso no se hace: se deja de hacer.
 *
 * Esta pantalla no baja los resultados sola —ningún proveedor lo permite
 * todavía— pero sí deja la constancia en un solo lugar: a quién se le aplicó
 * qué, cómo le fue y dónde está el soporte. El portal queda a un clic en cada
 * casilla, para que bajar el resultado no cueste buscar la pestaña.
 *
 * El Excel existe porque el seguimiento se trabaja con el líder de área y con
 * la psicóloga, que no entran al ATS.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Proveedor = {
  id: string;
  key: string;
  nombre: string;
  categoria: string | null;
  portal_url: string | null;
  via: "manual" | "candidato" | "api";
  campos: string[];
  notas: string | null;
};

type Celda = {
  provider_id: string;
  provider_key: string;
  estado: "pendiente" | "enviada" | "presentada" | "cargada" | "no_aplica";
  resumen: string | null;
  archivo_url: string | null;
  presentada_at: string | null;
  resultado_id: string | null;
};

type Candidato = {
  id: string;
  nombre: string | null;
  email: string | null;
  stage: string | null;
  status: string | null;
  pruebas: Celda[];
};

type Vacante = { id: string; title: string; status: string | null };

const COLOR: Record<Celda["estado"], { bg: string; fg: string; txt: string }> = {
  pendiente: { bg: "#F3F4F6", fg: "#6B7280", txt: "—" },
  enviada: { bg: "#FFF4E5", fg: "#A4530B", txt: "enviada" },
  presentada: { bg: "#EEF3FE", fg: "#1B3A8C", txt: "presentada" },
  cargada: { bg: "#E8F6EE", fg: "#1E7A43", txt: "lista" },
  no_aplica: { bg: "#FAFAFA", fg: "#C0C4CC", txt: "n/a" },
};

const ESTADOS: Celda["estado"][] = [
  "pendiente",
  "enviada",
  "presentada",
  "cargada",
  "no_aplica",
];

/** `useSearchParams` obliga a un límite de Suspense para que Next pueda
 *  prerenderizar la ruta. Sin esto el build falla. */
export default function Pagina() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "#646B7A" }}>Cargando…</div>}>
      <PruebasExternas />
    </Suspense>
  );
}

function PruebasExternas() {
  // La vacante puede venir en la URL, porque a esta pantalla se entra desde el
  // funnel de un cargo. Llegar y tener que volver a escoger el cargo que ya se
  // estaba mirando es el tipo de paso que hace que la gente no vuelva.
  const params = useSearchParams();
  const desdeUrl = params?.get("vacancy") ?? "";

  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [vacanteId, setVacanteId] = useState(desdeUrl);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [abierta, setAbierta] = useState<{ cand: Candidato; prov: Proveedor } | null>(null);

  useEffect(() => {
    fetch("/api/headhunting/vacancies")
      .then((r) => r.json())
      .then((j) => {
        const vs: Vacante[] = (j.vacancies ?? j ?? []).filter(
          (v: any) => v.status == null || v.status === "open",
        );
        setVacantes(vs);
        // Si la URL trae una vacante que sigue abierta, manda esa. Si no,
        // la primera: entrar a una pantalla vacía no le sirve a nadie.
        const valida = desdeUrl && vs.some((v) => v.id === desdeUrl);
        if (!valida && vs.length && !vacanteId) setVacanteId(vs[0].id);
      })
      .catch(() => setError("No se pudieron leer las vacantes"));
    // Solo al montar: después el usuario elige.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargar = useCallback(async () => {
    if (!vacanteId) return;
    setCargando(true);
    setError("");
    try {
      const r = await fetch(
        `/api/admin/pruebas-externas?vacancy_id=${encodeURIComponent(vacanteId)}`,
      );
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo leer");
      setProveedores(j.proveedores ?? []);
      setCandidatos(j.candidatos ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [vacanteId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const resumen = useMemo(() => {
    const total = candidatos.length * (proveedores.length || 1);
    const listas = candidatos.reduce(
      (a, c) => a + c.pruebas.filter((p) => p.estado === "cargada").length,
      0,
    );
    const enCurso = candidatos.reduce(
      (a, c) =>
        a + c.pruebas.filter((p) => p.estado === "enviada" || p.estado === "presentada").length,
      0,
    );
    return { total, listas, enCurso, sinEmpezar: total - listas - enCurso };
  }, [candidatos, proveedores]);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 650, margin: "0 0 4px" }}>Pruebas externas</h1>
      <p style={{ color: "#646B7A", fontSize: 14, margin: "0 0 20px", maxWidth: "72ch" }}>
        Quién presentó qué, en los seis proveedores. Click en una casilla para registrar el
        resultado o abrir el portal. Esto no reemplaza la batería propia: es para lo que se
        mide afuera.
      </p>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
        <select
          value={vacanteId}
          onChange={(e) => setVacanteId(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E3E6EC", fontSize: 14, minWidth: 320 }}
        >
          {vacantes.map((v) => (
            <option key={v.id} value={v.id}>{v.title}</option>
          ))}
        </select>

        <a
          href={`/api/admin/pruebas-externas/excel?vacancy_id=${encodeURIComponent(vacanteId)}`}
          style={{
            padding: "8px 14px", borderRadius: 8, border: "1px solid #E3E6EC",
            background: "#fff", fontSize: 13.5, fontWeight: 600, textDecoration: "none", color: "#101113",
          }}
        >
          Bajar Excel de esta vacante
        </a>
        <a
          href="/api/admin/pruebas-externas/excel"
          style={{
            padding: "8px 14px", borderRadius: 8, border: "1px solid #E3E6EC",
            background: "#fff", fontSize: 13.5, fontWeight: 600, textDecoration: "none", color: "#101113",
          }}
        >
          Excel de todas las abiertas
        </a>

        {!cargando && candidatos.length > 0 && (
          <span style={{ color: "#646B7A", fontSize: 13 }}>
            {resumen.listas} con resultado · {resumen.enCurso} en curso · {resumen.sinEmpezar} sin empezar
          </span>
        )}
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FBD5D5", color: "#B4232A", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      {cargando ? (
        <p style={{ color: "#646B7A" }}>Leyendo…</p>
      ) : candidatos.length === 0 ? (
        <p style={{ color: "#646B7A" }}>Esta vacante no tiene candidatos todavía.</p>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid #E3E6EC", borderRadius: 11, background: "#fff" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
            <thead>
              <tr>
                <th style={th()}>Candidato</th>
                {proveedores.map((p) => (
                  <th key={p.id} style={{ ...th(), textAlign: "center" }} title={p.notas ?? ""}>
                    {p.nombre}
                    {p.via === "candidato" && (
                      <div style={{ fontWeight: 400, color: "#9AA1AE", fontSize: 10, textTransform: "none", letterSpacing: 0 }}>
                        la manda el candidato
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidatos.map((c) => (
                <tr key={c.id}>
                  <td style={{ ...td(), minWidth: 230 }}>
                    <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                    <div style={{ color: "#9AA1AE", fontSize: 11.5 }}>{c.email}</div>
                  </td>
                  {c.pruebas.map((celda) => {
                    const prov = proveedores.find((p) => p.id === celda.provider_id)!;
                    const col = COLOR[celda.estado];
                    return (
                      <td key={celda.provider_id} style={{ ...td(), textAlign: "center", padding: 6 }}>
                        <button
                          onClick={() => setAbierta({ cand: c, prov })}
                          title={celda.resumen ?? ""}
                          style={{
                            width: "100%", padding: "7px 6px", borderRadius: 7, cursor: "pointer",
                            border: "1px solid transparent", background: col.bg, color: col.fg,
                            fontSize: 12, fontWeight: 600,
                          }}
                        >
                          {col.txt}
                          {celda.resumen && (
                            <div style={{ fontWeight: 400, fontSize: 10.5, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>
                              {celda.resumen}
                            </div>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {abierta && (
        <Registro
          candidato={abierta.cand}
          proveedor={abierta.prov}
          vacanteId={vacanteId}
          onCerrar={() => setAbierta(null)}
          onGuardado={() => {
            setAbierta(null);
            cargar();
          }}
        />
      )}
    </div>
  );
}

function th(): React.CSSProperties {
  return {
    textAlign: "left", fontSize: 10.5, letterSpacing: "0.07em", textTransform: "uppercase",
    color: "#646B7A", padding: "10px 12px", background: "#FBFCFD", borderBottom: "1px solid #E3E6EC",
    position: "sticky", top: 0,
  };
}

function td(): React.CSSProperties {
  return { padding: "10px 12px", borderBottom: "1px solid #F0F2F5", verticalAlign: "middle" };
}

/** El formulario de una casilla. Lo mínimo para que la matriz diga la verdad. */
function Registro({
  candidato, proveedor, vacanteId, onCerrar, onGuardado,
}: {
  candidato: Candidato;
  proveedor: Proveedor;
  vacanteId: string;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const actual = candidato.pruebas.find((p) => p.provider_id === proveedor.id);
  const [estado, setEstado] = useState<Celda["estado"]>(actual?.estado ?? "pendiente");
  const [resumen, setResumen] = useState(actual?.resumen ?? "");
  const [archivo, setArchivo] = useState(actual?.archivo_url ?? "");
  const [presentada, setPresentada] = useState((actual?.presentada_at ?? "").slice(0, 10));
  const [puntajes, setPuntajes] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [err, setErr] = useState("");

  async function guardar() {
    setGuardando(true);
    setErr("");
    try {
      const limpios = Object.fromEntries(
        Object.entries(puntajes).filter(([, v]) => String(v).trim() !== ""),
      );
      const r = await fetch("/api/admin/pruebas-externas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidato.id,
          provider_id: proveedor.id,
          vacancy_id: vacanteId,
          estado,
          resumen: resumen || null,
          archivo_url: archivo || null,
          presentada_at: presentada ? new Date(presentada).toISOString() : null,
          puntajes: Object.keys(limpios).length ? limpios : null,
          portal_url: proveedor.portal_url,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo guardar");
      onGuardado();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      onClick={onCerrar}
      style={{ position: "fixed", inset: 0, background: "rgba(16,17,19,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 12, padding: 22, width: "100%", maxWidth: 520, maxHeight: "86vh", overflowY: "auto" }}
      >
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#646B7A", fontWeight: 700 }}>
          {proveedor.nombre}
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 650, margin: "4px 0 2px" }}>{candidato.nombre}</h2>
        <p style={{ color: "#9AA1AE", fontSize: 12.5, margin: "0 0 16px" }}>{candidato.email}</p>

        {proveedor.portal_url && (
          <a
            href={proveedor.portal_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-block", marginBottom: 16, fontSize: 13, color: "#1B3A8C" }}
          >
            Abrir el portal de {proveedor.nombre} →
          </a>
        )}

        <label style={lbl()}>Estado</label>
        <select value={estado} onChange={(e) => setEstado(e.target.value as Celda["estado"])} style={inp()}>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{COLOR[e].txt === "—" ? "pendiente" : COLOR[e].txt}</option>
          ))}
        </select>

        <label style={lbl()}>Fecha en que la presentó</label>
        <input type="date" value={presentada} onChange={(e) => setPresentada(e.target.value)} style={inp()} />

        {proveedor.campos.length > 0 && (
          <>
            <label style={lbl()}>Puntajes</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 8, marginBottom: 14 }}>
              {proveedor.campos.map((campo) => (
                <input
                  key={campo}
                  placeholder={campo}
                  value={puntajes[campo] ?? ""}
                  onChange={(e) => setPuntajes({ ...puntajes, [campo]: e.target.value })}
                  style={{ ...inp(), marginBottom: 0 }}
                />
              ))}
            </div>
          </>
        )}

        <label style={lbl()}>Resumen · una línea, lo que se ve en la tabla</label>
        <input value={resumen} onChange={(e) => setResumen(e.target.value)} style={inp()} placeholder="Perfil CS alto · sin alertas" />

        <label style={lbl()}>Enlace al soporte · PDF o informe en el portal</label>
        <input value={archivo} onChange={(e) => setArchivo(e.target.value)} style={inp()} placeholder="https://…" />

        {err && <p style={{ color: "#B4232A", fontSize: 13 }}>{err}</p>}

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={guardar} disabled={guardando} style={btn(true)}>
            {guardando ? "Guardando…" : "Guardar"}
          </button>
          <button onClick={onCerrar} style={btn(false)}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

function lbl(): React.CSSProperties {
  return { display: "block", fontSize: 12, fontWeight: 600, color: "#646B7A", margin: "0 0 5px" };
}
function inp(): React.CSSProperties {
  return { width: "100%", padding: "8px 11px", borderRadius: 8, border: "1px solid #E3E6EC", fontSize: 14, marginBottom: 14 };
}
function btn(primario: boolean): React.CSSProperties {
  return {
    padding: "9px 16px", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
    border: primario ? "1px solid #1B3A8C" : "1px solid #E3E6EC",
    background: primario ? "#1B3A8C" : "#fff",
    color: primario ? "#fff" : "#101113",
  };
}
