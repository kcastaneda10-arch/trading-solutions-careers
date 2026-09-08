"use client";

import { useCallback, useEffect, useState } from "react";

const BLACK = "#0A0A0A";
const BLUE = "#2C64ED";
const GRAY = "#6B7280";
const BORDER = "#E5E7EB";

type Sess = {
  id: string; token: string; purpose: string; candidate_name: string | null;
  vacancy_title: string | null; status: string; battery_version: string;
  started_at: string | null; finished_at: string | null; duration_seconds: number | null;
  scores: any; validity: any; created_at: string;
  respuestas?: number; capturas?: number; alertas?: number;
};

const STATUS_LABEL: Record<string, string> = {
  created: "Sin abrir", consented: "Aceptó habeas data", in_progress: "En curso",
  completed: "Terminada", invalidated: "Invalidada",
};

export default function BateriaAdmin() {
  const [sessions, setSessions] = useState<Sess[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [nuevo, setNuevo] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/bateria/list");
    const j = await r.json();
    setSessions(j.sessions || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function crear() {
    setCreating(true);
    const r = await fetch("/api/bateria/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "piloto", name: name || "Piloto interno", vacancy_title: "Especialista SIG-SST" }),
    });
    const j = await r.json();
    setCreating(false);
    if (j.url) { setNuevo(j.url); setName(""); load(); }
  }

  async function ver(token: string) {
    if (abierto === token) { setAbierto(null); setDetalle(null); return; }
    setAbierto(token); setDetalle(null);
    const r = await fetch(`/api/bateria/resultado/${token}`);
    setDetalle(await r.json());
  }

  const box: React.CSSProperties = { background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: 22, marginBottom: 18 };
  const btn: React.CSSProperties = { background: BLACK, color: "#fff", border: "none", borderRadius: 7, padding: "10px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" };
  const th: React.CSSProperties = { textAlign: "left", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: GRAY, fontWeight: 700, padding: "9px 10px", borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "10px", borderBottom: `1px solid #F3F4F6`, fontSize: 13.5, verticalAlign: "top" };

  return (
    <div style={{ padding: "28px 22px 90px", background: "#FAFAFA", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", color: BLACK }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: BLUE, fontWeight: 700, margin: "0 0 6px" }}>Trading Solutions · Selección</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>Batería SIG-SST</h1>
        <p style={{ color: GRAY, fontSize: 14, margin: "0 0 22px", maxWidth: 640, lineHeight: 1.6 }}>
          Genere un enlace, tómelo usted misma y revise aquí las respuestas, los tiempos, las alertas de proctoring y
          las capturas de cámara. El candidato nunca ve ningún resultado.
        </p>

        <div style={box}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Nuevo enlace</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de quien la va a presentar"
              style={{ flex: "1 1 260px", padding: "10px 12px", border: `1px solid ${BORDER}`, borderRadius: 7, fontSize: 14 }} />
            <button style={{ ...btn, opacity: creating ? 0.5 : 1 }} disabled={creating} onClick={crear}>
              {creating ? "Creando…" : "Crear enlace"}
            </button>
          </div>
          {nuevo && (
            <div style={{ marginTop: 14, padding: 14, background: "#EEF3FE", border: `1px solid #C7D9FB`, borderRadius: 8 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12.5, fontWeight: 700, color: BLUE, letterSpacing: "0.04em", textTransform: "uppercase" }}>Enlace listo</p>
              <a href={nuevo} target="_blank" rel="noreferrer" style={{ fontSize: 13.5, wordBreak: "break-all", color: BLACK }}>{nuevo}</a>
              <div style={{ marginTop: 10 }}>
                <button style={{ ...btn, background: "#fff", color: BLACK, border: `1px solid ${BORDER}`, padding: "7px 13px", fontSize: 12.5 }}
                  onClick={() => navigator.clipboard?.writeText(nuevo)}>Copiar</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ ...box, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px 12px" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Sesiones</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
              <thead><tr>
                <th style={th}>Persona</th><th style={th}>Estado</th><th style={th}>Resp.</th>
                <th style={th}>Capturas</th><th style={th}>Alertas</th><th style={th}>Min</th>
                <th style={th}>Versión</th><th style={th}></th>
              </tr></thead>
              <tbody>
                {loading && <tr><td style={td} colSpan={8}>Cargando…</td></tr>}
                {!loading && !sessions.length && <tr><td style={td} colSpan={8}>Todavía no hay sesiones.</td></tr>}
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td style={td}><b>{s.candidate_name || "(sin nombre)"}</b><br /><span style={{ color: GRAY, fontSize: 12 }}>{s.purpose}</span></td>
                    <td style={td}>{STATUS_LABEL[s.status] || s.status}</td>
                    <td style={td}>{s.respuestas ?? 0}</td>
                    <td style={td}>{s.capturas ?? 0}</td>
                    <td style={{ ...td, color: (s.alertas ?? 0) > 0 ? "#B45309" : GRAY, fontWeight: (s.alertas ?? 0) > 0 ? 700 : 400 }}>{s.alertas ?? 0}</td>
                    <td style={td}>{s.duration_seconds ? Math.round(s.duration_seconds / 60) : "—"}</td>
                    <td style={{ ...td, fontSize: 12, color: GRAY }}>{s.battery_version}</td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 7 }}>
                        <a href={`/prueba/${s.token}`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: BLUE }}>Abrir</a>
                        <button onClick={() => ver(s.token)} style={{ background: "none", border: "none", color: BLUE, fontSize: 12.5, cursor: "pointer", padding: 0 }}>
                          {abierto === s.token ? "Cerrar" : "Ver informe"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {abierto && (
          <div style={box}>
            {!detalle && <p style={{ color: GRAY, margin: 0 }}>Cargando informe…</p>}
            {detalle?.error && <p style={{ color: "#C41818", margin: 0 }}>{detalle.error}</p>}
            {detalle?.session && <Informe d={detalle} />}
          </div>
        )}
      </div>
    </div>
  );
}

function Informe({ d }: { d: any }) {
  const s = d.session;
  const sc = s.scores;
  const v = s.validity;
  const GRAYc = GRAY;
  const h: React.CSSProperties = { fontSize: 11, letterSpacing: "0.11em", textTransform: "uppercase", color: BLUE, fontWeight: 700, margin: "24px 0 10px" };
  const bar = (label: string, val: number, extra?: string) => (
    <div key={label} style={{ display: "grid", gridTemplateColumns: "180px 1fr 92px", gap: 12, alignItems: "center", padding: "4px 0" }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <span style={{ height: 8, background: "#F3F4F6", borderRadius: 2, overflow: "hidden", display: "block" }}>
        <span style={{ display: "block", width: `${Math.max(0, Math.min(100, val))}%`, height: "100%", background: BLUE }} />
      </span>
      <span style={{ fontSize: 12, textAlign: "right", color: GRAYc, fontVariantNumeric: "tabular-nums" }}><b style={{ color: BLACK }}>{val}</b>{extra ? ` ${extra}` : ""}</span>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 4px" }}>{s.candidate_name || "(sin nombre)"}</h2>
      <p style={{ color: GRAYc, fontSize: 12.5, margin: "0 0 6px" }}>
        {s.vacancy_title} · batería {s.battery_version} · {s.duration_seconds ? `${Math.round(s.duration_seconds / 60)} min` : "en curso"} ·
        {" "}consentimiento {s.consent_data_at ? new Date(s.consent_data_at).toLocaleString("es-CO") : "—"} ({s.consent_text_ver})
      </p>
      <p style={{ color: GRAYc, fontSize: 12.5, margin: 0 }}>Cámara: {s.consent_cam_at ? "autorizada" : "no autorizada"} · IP {s.consent_ip || "—"}</p>

      {v && (
        <>
          <p style={h}>Validez · {v.veredicto === "sin_alertas" ? "sin alertas" : v.veredicto === "con_reservas" ? "leer con reservas" : "no interpretable"}</p>
          <ul style={{ fontSize: 13.5, lineHeight: 1.7, paddingLeft: 18, margin: 0, color: "#374151" }}>
            <li>Deseabilidad social: {v.deseabilidadSocial?.extremas}/{v.deseabilidadSocial?.of} {v.deseabilidadSocial?.alerta ? "· alerta" : ""}</li>
            <li>Consistencia: {v.consistencia?.concordantes}/{v.consistencia?.pares} pares concordantes</li>
            <li>Respuestas bajo 1,5 s: {v.latencia?.rapidos} {v.latencia?.itemCodes?.length ? `(${v.latencia.itemCodes.join(", ")})` : ""}</li>
            <li>Eventos de proctoring: {v.proctoring?.eventos} · capturas guardadas: {v.proctoring?.capturas}</li>
          </ul>
        </>
      )}

      {sc && (
        <>
          <p style={h}>Conocimiento técnico · {sc.conocimiento?.total}/100 ({sc.conocimiento?.correct} de {sc.conocimiento?.of})</p>
          {Object.entries(sc.conocimiento?.bySubdomain || {}).map(([k, x]: any) => bar(`Subdominio ${k}`, x.pct, `${x.correct}/${x.of}`))}

          <p style={h}>Razonamiento · {sc.razonamiento?.total}/100 ({sc.razonamiento?.correct} de {sc.razonamiento?.of})</p>
          {Object.entries(sc.razonamiento?.bySubdomain || {}).map(([k, x]: any) => bar(`Subdominio ${k}`, x.pct, `${x.correct}/${x.of}`))}

          <p style={h}>Estilo · ipsativo, no compara candidatos</p>
          {["D", "I", "S", "C"].map((k) => bar(`${k} natural`, sc.estilo?.natural?.[k] ?? 0, `adapt ${sc.estilo?.adaptado?.[k] ?? 0}`))}
          <p style={{ fontSize: 13, color: GRAYc, marginTop: 8 }}>
            Tensión de rol: <b style={{ color: BLACK }}>{sc.estilo?.tensionRol ?? "—"}</b> · más de 20 es alerta de rotación temprana.
          </p>
          {Object.keys(sc.estilo?.motivadores || {}).length > 0 && (
            <>
              <p style={h}>Motivadores</p>
              {Object.entries(sc.estilo.motivadores).map(([k, x]: any) => bar(k, x))}
            </>
          )}
          {Object.keys(sc.estilo?.procesamiento || {}).length > 0 && (
            <>
              <p style={h}>Preferencia de procesamiento</p>
              {Object.entries(sc.estilo.procesamiento).map(([k, x]: any) => bar(k, x))}
            </>
          )}

          <p style={h}>Integridad · permisividad global {sc.integridad?.permisividadGlobal ?? "—"}</p>
          {Object.entries(sc.integridad?.byDimension || {}).map(([k, x]: any) => bar(`Dimensión ${k}`, x))}

          {sc.criterio?.total != null && <><p style={h}>Criterio situacional</p>{bar("Efectividad", sc.criterio.total)}</>}

          {sc.muestraAbierta?.map((m: any, i: number) => m.texto && (
            <div key={i}>
              <p style={h}>Muestra de trabajo · {m.palabras} palabras · pendiente de rúbrica</p>
              <p style={{ fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap", borderLeft: `2px solid ${BLUE}`, paddingLeft: 14, margin: 0, color: "#374151" }}>{m.texto}</p>
            </div>
          ))}

          <p style={{ fontSize: 12.5, color: GRAYc, marginTop: 22, borderTop: `1px solid ${BORDER}`, paddingTop: 14, lineHeight: 1.6 }}>
            Este informe no reporta cociente intelectual: no hay normas locales de la batería. Los puntajes de estilo no
            ordenan candidatos, solo miden distancia al perfil del cargo. La muestra abierta queda pendiente de
            calificación por rúbrica con dos evaluadores.
          </p>
        </>
      )}

      <p style={h}>Revisión ítem por ítem</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 760 }}>
          <thead><tr>
            {["Ítem", "Qué mide", "Respondió", "Clave", "", "ms", "Fuente"].map((x, i) => (
              <th key={i} style={{ textAlign: "left", padding: "8px 9px", borderBottom: `1px solid ${BORDER}`, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", color: GRAY }}>{x}</th>
            ))}
          </tr></thead>
          <tbody>
            {d.revision?.map((r: any) => (
              <tr key={r.item_code}>
                <td style={{ padding: "8px 9px", borderBottom: "1px solid #F3F4F6", fontFamily: "monospace", color: BLUE }}>{r.item_code}</td>
                <td style={{ padding: "8px 9px", borderBottom: "1px solid #F3F4F6" }}>{r.etiqueta}</td>
                <td style={{ padding: "8px 9px", borderBottom: "1px solid #F3F4F6" }}>
                  {r.respuesta?.choice ?? (r.respuesta?.value != null ? `escala ${r.respuesta.value}` : r.respuesta?.most ? `+${r.respuesta.most} / −${r.respuesta.least}` : r.respuesta?.text ? `${r.respuesta.text.length} caracteres` : "—")}
                </td>
                <td style={{ padding: "8px 9px", borderBottom: "1px solid #F3F4F6" }}>{r.correcta ?? "—"}</td>
                <td style={{ padding: "8px 9px", borderBottom: "1px solid #F3F4F6", color: r.acerto === true ? "#1A7D3E" : r.acerto === false ? "#C41818" : GRAY, fontWeight: 700 }}>
                  {r.acerto === true ? "✓" : r.acerto === false ? "✗" : ""}
                </td>
                <td style={{ padding: "8px 9px", borderBottom: "1px solid #F3F4F6", color: r.latency_ms != null && r.latency_ms < 1500 ? "#B45309" : GRAY, fontVariantNumeric: "tabular-nums" }}>{r.latency_ms ?? "—"}</td>
                <td style={{ padding: "8px 9px", borderBottom: "1px solid #F3F4F6", color: GRAY, fontSize: 11.5 }}>{r.fuente ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {d.eventos?.length > 0 && (
        <>
          <p style={h}>Eventos de la sesión</p>
          <ul style={{ fontSize: 12.5, lineHeight: 1.7, paddingLeft: 18, margin: 0, color: "#374151" }}>
            {d.eventos.map((e: any) => (
              <li key={e.id}>{new Date(e.at).toLocaleTimeString("es-CO")} · <b>{e.kind}</b>{e.detail ? ` · ${e.detail}` : ""}</li>
            ))}
          </ul>
        </>
      )}

      <p style={h}>Capturas de cámara · {d.capturas?.length ?? 0}</p>
      {!d.capturas?.length && <p style={{ fontSize: 13, color: GRAY, margin: 0 }}>No hay capturas guardadas para esta sesión.</p>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {d.capturas?.map((c: any) => (
          <figure key={c.path} style={{ margin: 0, width: 150 }}>
            {c.url ? <img src={c.url} alt="Captura de la sesión" style={{ width: "100%", borderRadius: 6, border: `1px solid ${BORDER}`, display: "block" }} /> : <div style={{ height: 110, background: "#F3F4F6", borderRadius: 6 }} />}
            <figcaption style={{ fontSize: 10.5, color: GRAY, marginTop: 4 }}>
              parte {c.block} · {new Date(c.captured_at).toLocaleTimeString("es-CO")}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
