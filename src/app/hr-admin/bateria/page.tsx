"use client";

import { useCallback, useEffect, useState } from "react";

const BLACK = "#0A0A0A";
const BLUE = "#2C64ED";
const GRAY = "#6B7280";
const BORDER = "#E5E7EB";
const SOFT = "#F3F4F6";
const GREEN = "#1A7D3E";
const AMBER = "#B45309";
const RED = "#C41818";
const PLUM = "#7C3AED";

const DISC_COLOR: Record<string, string> = { D: "#D64545", I: "#E3B341", S: "#4A9E6B", C: "#3E6CB5" };

type Sess = {
  id: string; token: string; purpose: string; candidate_name: string | null;
  vacancy_title: string | null; status: string; battery_version: string;
  started_at: string | null; finished_at: string | null; duration_seconds: number | null;
  scores: any; validity: any; created_at: string; consent_cam_at: string | null; calculada?: boolean;
  respuestas?: number; capturas?: number; alertas?: number;
};

const STATUS_LABEL: Record<string, string> = {
  created: "Sin abrir", consented: "Aceptó habeas data", in_progress: "En curso",
  completed: "Terminada", invalidated: "Invalidada",
};

const VEREDICTO: Record<string, { txt: string; color: string }> = {
  sin_alertas: { txt: "Validez · sin alertas", color: GREEN },
  con_reservas: { txt: "Validez · leer con reservas", color: AMBER },
  no_interpretable: { txt: "Validez · no interpretable", color: RED },
};

export default function BateriaAdmin() {
  const [sessions, setSessions] = useState<Sess[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [nuevo, setNuevo] = useState<string | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<any>(null);
  const [recalculando, setRecalculando] = useState<string | null>(null);

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
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purpose: "piloto", name: name || "Piloto interno", vacancy_title: "Prueba de selección" }),
    });
    const j = await r.json();
    setCreating(false);
    if (j.url) { setNuevo(j.url); setName(""); load(); }
  }

  async function ver(token: string) {
    if (abierto === token) { setAbierto(null); setDetalle(null); return; }
    setAbierto(token); setDetalle(null);
    // La tabla se pinta al cargar la página; si la prueba se tomó en otra
    // pestaña, esos conteos ya están viejos. Se refrescan al abrir el informe.
    load();
    const r = await fetch(`/api/bateria/resultado/${token}`);
    setDetalle(await r.json());
  }

  /** Recalcula desde las respuestas guardadas. Sirve para una sesión que quedó
   *  a medias o para volver a puntuar tras un cambio en el motor. */
  async function recalcular(token: string) {
    setRecalculando(token);
    const r = await fetch("/api/bateria/recalcular", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const j = await r.json();
    setRecalculando(null);
    await load();
    if (abierto === token) {
      setDetalle(null);
      const rr = await fetch(`/api/bateria/resultado/${token}`);
      setDetalle(await rr.json());
    } else if (j.error) {
      alert(j.error);
    }
  }

  const box: React.CSSProperties = { background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: 22, marginBottom: 18 };
  const btn: React.CSSProperties = { background: BLACK, color: "#fff", border: "none", borderRadius: 7, padding: "10px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" };
  const th: React.CSSProperties = { textAlign: "left", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: GRAY, fontWeight: 700, padding: "9px 10px", borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "10px", borderBottom: `1px solid ${SOFT}`, fontSize: 13.5, verticalAlign: "top" };

  return (
    <div style={{ padding: "28px 22px 90px", background: "#FAFAFA", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", color: BLACK }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: BLUE, fontWeight: 700, margin: "0 0 6px" }}>Trading Solutions · Selección</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>Batería de selección</h1>
        <p style={{ color: GRAY, fontSize: 14, margin: "0 0 22px", maxWidth: 660, lineHeight: 1.6 }}>
          Aplica a cualquier cargo. Genere un enlace, tómelo usted misma y revise aquí el informe completo: personalidad,
          estilo, motivadores, razonamiento, integridad, proctoring y capturas. El candidato nunca ve ningún resultado.
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
            <div style={{ marginTop: 14, padding: 14, background: "#EEF3FE", border: "1px solid #C7D9FB", borderRadius: 8 }}>
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
          <div style={{ padding: "18px 22px 12px" }}><h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Sesiones</h2></div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
              <thead><tr>
                <th style={th}>Persona</th><th style={th}>Estado</th><th style={th}>Resp.</th>
                <th style={th}>Cámara</th><th style={th}>Capturas</th><th style={th}>Alertas</th><th style={th}>Min</th>
                <th style={th}>Versión</th><th style={th}></th>
              </tr></thead>
              <tbody>
                {loading && <tr><td style={td} colSpan={9}>Cargando…</td></tr>}
                {!loading && !sessions.length && <tr><td style={td} colSpan={9}>Todavía no hay sesiones.</td></tr>}
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td style={td}><b>{s.candidate_name || "(sin nombre)"}</b><br /><span style={{ color: GRAY, fontSize: 12 }}>{s.purpose}</span></td>
                    <td style={td}>{STATUS_LABEL[s.status] || s.status}</td>
                    <td style={td}>{s.respuestas ?? 0}</td>
                    <td style={{ ...td, color: s.consent_cam_at ? GREEN : AMBER, fontWeight: 600, fontSize: 12.5 }}>
                      {s.consent_cam_at ? "autorizada" : "no autorizada"}
                    </td>
                    <td style={td}>{s.capturas ?? 0}</td>
                    <td style={{ ...td, color: (s.alertas ?? 0) > 0 ? AMBER : GRAY, fontWeight: (s.alertas ?? 0) > 0 ? 700 : 400 }}>{s.alertas ?? 0}</td>
                    <td style={td}>{s.duration_seconds ? Math.round(s.duration_seconds / 60) : "—"}</td>
                    <td style={{ ...td, fontSize: 12, color: GRAY }}>
                      {s.battery_version}
                      {!s.calculada && (s.respuestas ?? 0) > 0 && (
                        <span style={{ display: "block", color: AMBER, fontWeight: 600 }}>sin calcular</span>
                      )}
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 9 }}>
                        <a href={`/prueba/${s.token}`} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: BLUE }}>Abrir</a>
                        <button onClick={() => ver(s.token)} style={{ background: "none", border: "none", color: BLUE, fontSize: 12.5, cursor: "pointer", padding: 0 }}>
                          {abierto === s.token ? "Cerrar" : "Ver informe"}
                        </button>
                        <button onClick={() => recalcular(s.token)} disabled={recalculando === s.token}
                          style={{ background: "none", border: "none", color: recalculando === s.token ? GRAY : BLUE, fontSize: 12.5, cursor: "pointer", padding: 0 }}>
                          {recalculando === s.token ? "Calculando…" : "Recalcular"}
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
            {detalle?.error && <p style={{ color: RED, margin: 0 }}>{detalle.error}</p>}
            {detalle?.session && <Informe d={detalle} onRecalcular={() => recalcular(abierto)} recalculandoAqui={recalculando === abierto} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// INFORME
// ═══════════════════════════════════════════════════════════
const H: React.CSSProperties = { fontSize: 11, letterSpacing: "0.11em", textTransform: "uppercase", color: BLUE, fontWeight: 700, margin: "30px 0 12px" };
const P: React.CSSProperties = { fontSize: 14.5, lineHeight: 1.65, color: "#374151", maxWidth: "68ch", margin: "0 0 12px" };

function Bar({ label, pct, right, color = BLUE, sub }: { label: string; pct: number; right?: string; color?: string; sub?: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "190px 1fr 110px", gap: 12, alignItems: "center", padding: "5px 0" }}>
      <span style={{ fontSize: 13.5 }}>{label}{sub && <span style={{ display: "block", fontSize: 11, color: GRAY }}>{sub}</span>}</span>
      <span style={{ height: 9, background: SOFT, borderRadius: 2, overflow: "hidden", display: "block" }}>
        <span style={{ display: "block", width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", background: color }} />
      </span>
      <span style={{ fontSize: 12, textAlign: "right", color: GRAY, fontVariantNumeric: "tabular-nums" }}>
        <b style={{ color: BLACK }}>{pct}</b>{right ? ` ${right}` : ""}
      </span>
    </div>
  );
}

/** Barra bipolar: los dos polos a los lados, el marcador donde cayó la persona. */
function Bipolar({ polos, pct }: { polos: [string, string]; pct: number }) {
  return (
    <div>
      <div style={{ position: "relative", height: 12, background: SOFT, borderRadius: 6, margin: "6px 0 5px" }}>
        <div style={{ position: "absolute", left: "50%", top: -3, bottom: -3, width: 1, background: BORDER }} />
        <div style={{ position: "absolute", left: `calc(${Math.max(2, Math.min(98, pct))}% - 7px)`, top: -2, width: 14, height: 16, borderRadius: 4, background: BLUE, border: "2px solid #fff", boxShadow: "0 0 0 1px rgba(0,0,0,.12)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: GRAY }}>
        <span>{polos[0]}</span><span>{polos[1]}</span>
      </div>
    </div>
  );
}

/** Gráfica DISC de tres perfiles: barras natural, línea de máscara social y línea bajo presión. */
function DiscChart({ natural, mascara, presion }: { natural: any; mascara: any; presion: any }) {
  const AX = ["D", "I", "S", "C"];
  const W = 380, Hh = 260, ml = 34, mb = 34, mt = 12;
  const plotW = W - ml - 12, plotH = Hh - mt - mb;
  const colX = (i: number) => ml + plotW * ((i + 0.5) / 4);
  const segY = (s: number) => mt + plotH - (s / 7) * plotH;
  const line = (g: any) => AX.map((k, i) => `${colX(i)},${segY(g?.[k]?.seg ?? 0)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${Hh}`} width="100%" style={{ maxWidth: W, display: "block" }} role="img" aria-label="Gráfica DISC de tres perfiles">
      {[1, 2, 3, 4, 5, 6, 7].map((s) => (
        <g key={s}>
          <line x1={ml} y1={segY(s)} x2={W - 12} y2={segY(s)} stroke={s === 4 ? "#9CA3AF" : BORDER} strokeWidth={s === 4 ? 1.2 : 1} strokeDasharray={s === 4 ? "4 3" : undefined} />
          <text x={ml - 8} y={segY(s) + 4} textAnchor="end" fontSize="10" fill={GRAY}>{s}</text>
        </g>
      ))}
      {AX.map((k, i) => {
        const seg = natural?.[k]?.seg ?? 0;
        const y = segY(seg);
        return (
          <g key={k}>
            <rect x={colX(i) - 22} y={y} width={44} height={mt + plotH - y} fill={DISC_COLOR[k]} opacity={0.75} />
            <text x={colX(i)} y={Hh - 12} textAnchor="middle" fontSize="13" fontWeight="700" fill={BLACK}>{k}</text>
          </g>
        );
      })}
      <polyline points={line(mascara)} fill="none" stroke="#1F3A93" strokeWidth="1.8" />
      {AX.map((k, i) => (
        <rect key={`m${k}`} x={colX(i) - 5} y={segY(mascara?.[k]?.seg ?? 0) - 5} width={10} height={10} fill="#fff" stroke="#1F3A93" strokeWidth="1.8" transform={`rotate(45 ${colX(i)} ${segY(mascara?.[k]?.seg ?? 0)})`} />
      ))}
      <polyline points={line(presion)} fill="none" stroke={PLUM} strokeWidth="1.8" />
      {AX.map((k, i) => (
        <circle key={`p${k}`} cx={colX(i)} cy={segY(presion?.[k]?.seg ?? 0)} r="4.5" fill={PLUM} />
      ))}
    </svg>
  );
}

function Informe({ d, onRecalcular, recalculandoAqui }: { d: any; onRecalcular: () => void; recalculandoAqui: boolean }) {
  const s = d.session;
  const sc = s.scores;
  const v = s.validity;
  const it = d.interpretacion;
  const ver = VEREDICTO[v?.veredicto] ?? VEREDICTO.sin_alertas;

  // Sesiones de versiones anteriores tienen otra forma de `scores`: no se
  // renderizan con este informe ni se comparan con las nuevas.
  const esV2 = !!sc?.personalidad && !!sc?.disc && !!it;
  if (!esV2) {
    return (
      <div>
        <h2 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 6px" }}>{s.candidate_name || "(sin nombre)"}</h2>
        <p style={P}>
          {sc
            ? `Esta sesión se presentó con la batería ${s.battery_version}, una versión anterior con otra estructura. Sus resultados no se muestran en este informe ni se comparan con los de la versión actual.`
            : `Esta sesión tiene ${d.revision?.length ?? 0} respuestas de ${d.total_items} y todavía no tiene puntajes calculados.`}
        </p>
        {!sc && (d.revision?.length ?? 0) > 0 && (
          <>
            <p style={P}>
              Las respuestas están guardadas con sus tiempos: no se perdió nada. Genere el informe
              {(d.revision?.length ?? 0) < d.total_items ? " con lo que alcanzó a responder" : ""}.
            </p>
            <button onClick={onRecalcular} disabled={recalculandoAqui}
              style={{ background: BLACK, color: "#fff", border: "none", borderRadius: 7, padding: "11px 20px", fontSize: 13.5, fontWeight: 600, cursor: recalculandoAqui ? "wait" : "pointer" }}>
              {recalculandoAqui ? "Calculando…" : "Calcular el informe"}
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* ── Cabecera ── */}
      <h2 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 5px" }}>{s.candidate_name || "(sin nombre)"}</h2>
      <p style={{ color: GRAY, fontSize: 12.5, margin: "0 0 4px" }}>
        {s.vacancy_title} · batería {s.battery_version} · {s.duration_seconds ? `${Math.round(s.duration_seconds / 60)} min` : "en curso"} ·
        {" "}{d.revision?.length ?? 0} de {d.total_items} respuestas
      </p>
      <p style={{ color: GRAY, fontSize: 12.5, margin: "0 0 10px" }}>
        Consentimiento {s.consent_data_at ? new Date(s.consent_data_at).toLocaleString("es-CO") : "—"} ({s.consent_text_ver}) ·
        {" "}cámara {s.consent_cam_at ? "autorizada" : "no autorizada"} · IP {s.consent_ip || "—"}
      </p>
      <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 5, color: ver.color, border: `1px solid ${ver.color}`, background: "#fff" }}>{ver.txt}</span>

      {/* ── Arquetipo ── */}
      <p style={H}>Perfil general</p>
      <div style={{ border: `1px solid ${BORDER}`, borderLeft: `3px solid ${BLUE}`, borderRadius: 8, padding: "20px 22px", background: "#FCFCFD" }}>
        <h3 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 3px", letterSpacing: "-0.01em" }}>{it.arquetipo.nombre}</h3>
        <p style={{ fontSize: 14, color: BLUE, fontWeight: 600, margin: "0 0 16px" }}>{it.arquetipo.lema}</p>
        <p style={P}><b>Cómo trabaja.</b> {it.arquetipo.comoTrabaja}</p>
        <p style={P}><b>Dónde brilla.</b> {it.arquetipo.dondeBrilla}</p>
        <p style={P}><b>Dónde se le complica.</b> {it.arquetipo.dondeSeComplica}</p>
        <p style={{ ...P, marginBottom: 0 }}><b>Qué necesita del jefe.</b> {it.arquetipo.queNecesitaDelJefe}</p>
        {it.arquetipoAlterno && (
          <p style={{ fontSize: 12.5, color: GRAY, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
            El segundo y el tercer factor quedaron muy parejos: este perfil está entre <b>{it.arquetipo.nombre}</b> y{" "}
            <b>{it.arquetipoAlterno.nombre}</b>. Vale leer los dos y confirmar en entrevista cuál se parece más.
          </p>
        )}
      </div>

      {/* ── Cinco rasgos ── */}
      <p style={H}>Los cinco rasgos</p>
      {it.factores.map((f: any) => (
        <div key={f.key} style={{ padding: "14px 0", borderBottom: `1px solid ${SOFT}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <b style={{ fontSize: 15 }}>{f.label}</b>
            <span style={{ fontSize: 13, color: GRAY, fontVariantNumeric: "tabular-nums" }}>
              <b style={{ color: BLACK }}>{f.pct}</b> · {f.franja}
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: GRAY, margin: "3px 0 0" }}>{f.queSignifica}</p>
          <Bipolar polos={f.polos} pct={f.pct} />
          <p style={{ ...P, margin: "10px 0 0" }}>{f.lectura}</p>
        </div>
      ))}

      {/* ── Facetas ── */}
      <p style={H}>Las quince facetas</p>
      <p style={{ ...P, marginBottom: 16 }}>
        El promedio de un rasgo puede esconder dos facetas opuestas. Aquí es donde se ve, por ejemplo, alguien muy
        ordenado pero poco constante — dos cosas que en el rasgo aparecen como un solo número medio.
      </p>
      {it.factores.map((f: any) => (
        <div key={f.key} style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: GRAY, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</p>
          {f.facetas.map((fa: any) => (
            <Bar key={fa.key} label={fa.label} pct={fa.pct} sub={fa.lectura} color={fa.franja === "alto" ? BLUE : fa.franja === "bajo" ? "#9CA3AF" : "#60A5FA"} />
          ))}
        </div>
      ))}

      {/* ── DISC ── */}
      <p style={H}>Estilo de comportamiento</p>
      <div style={{ display: "flex", gap: 26, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 340px", minWidth: 300 }}>
          <DiscChart natural={sc.disc.natural} mascara={sc.disc.mascara} presion={sc.disc.presion} />
        </div>
        <div style={{ flex: "1 1 280px", minWidth: 260 }}>
          <p style={{ fontSize: 12.5, margin: "0 0 8px" }}><span style={{ display: "inline-block", width: 14, height: 9, background: "#D64545", opacity: .75, marginRight: 7, verticalAlign: "middle" }} /><b>Barras · perfil natural.</b> Cómo se comporta cuando no está actuando ni bajo presión. Es el que se usa para el ajuste al cargo.</p>
          <p style={{ fontSize: 12.5, margin: "0 0 8px" }}><span style={{ display: "inline-block", width: 14, height: 2, background: "#1F3A93", marginRight: 7, verticalAlign: "middle" }} /><b>Línea azul · máscara social.</b> Lo que eligió como &ldquo;más&rdquo;: el comportamiento que muestra en público y el que cree que se espera de él.</p>
          <p style={{ fontSize: 12.5, margin: "0 0 14px" }}><span style={{ display: "inline-block", width: 14, height: 2, background: PLUM, marginRight: 7, verticalAlign: "middle" }} /><b>Línea morada · bajo presión.</b> Lo que casi nunca descarta: a lo que recurre cuando se le acaba el margen.</p>
          <p style={{ fontSize: 12.5, color: GRAY, margin: 0 }}>Cuanto más separadas van las líneas, más está ajustando su estilo natural para responder al entorno. Una separación grande y sostenida es una fuente de desgaste.</p>
        </div>
      </div>
      <div style={{ marginTop: 18, padding: "16px 18px", background: "#FCFCFD", border: `1px solid ${BORDER}`, borderRadius: 8 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase", color: GRAY, fontWeight: 700, margin: "0 0 5px" }}>Patrón comportamental</p>
        <h4 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{it.patron.nombre}</h4>
        <p style={{ ...P, marginBottom: 0 }}>{it.patron.descripcion}</p>
      </div>

      <p style={{ ...H, marginTop: 24 }}>Afinidad con cargos tipo</p>
      <p style={{ ...P, marginBottom: 14 }}>
        Distancia entre el perfil natural y el perfil de referencia de cada cargo. Es afinidad de <b>estilo</b>, no de
        competencia: dice dónde se va a sentir cómodo, no si sabe hacer el trabajo.
      </p>
      {sc.disc.afinidades.map((c: any) => (
        <Bar key={c.key} label={c.nombre} pct={c.pct} right="%" sub={c.nota} color={c.pct >= 75 ? GREEN : c.pct >= 55 ? BLUE : "#9CA3AF"} />
      ))}

      {/* ── Motivadores ── */}
      <p style={H}>Qué lo mueve</p>
      {it.motivadores.map((m: any) => <Bar key={m.key} label={m.label} pct={m.pct} />)}
      {it.motivadores.slice(0, 2).map((m: any) => (
        <p key={m.key} style={{ ...P, margin: "12px 0 0" }}>
          <b>{m.label} ({m.pct}).</b> Lo sostiene: {m.loSostiene.toLowerCase()}. Lo hace irse: {m.loHaceIrse.toLowerCase()}.
        </p>
      ))}
      {it.motivadores.length > 0 && (
        <p style={{ ...P, marginTop: 12 }}>
          El motivador más bajo es <b>{it.motivadores[it.motivadores.length - 1].label}</b> ({it.motivadores[it.motivadores.length - 1].pct}):
          {" "}ofrecerle eso como incentivo no le va a mover la aguja.
        </p>
      )}

      {/* ── Razonamiento ── */}
      <p style={H}>Razonamiento · {sc.razonamiento.total}/100 ({sc.razonamiento.correct} de {sc.razonamiento.of})</p>
      {it.razonamiento.map((r: any) => <Bar key={r.key} label={r.label} pct={r.pct} right={`${r.correct}/${r.of}`} />)}
      <p style={{ ...P, marginTop: 12 }}>
        Se reporta como porcentaje de aciertos y como posición frente a las sesiones ya completadas con esta versión.
        No se convierte en cociente intelectual: para eso harían falta normas locales que esta batería todavía no tiene.
      </p>

      {/* ── Integridad ── */}
      <p style={H}>Integridad y criterio · permisividad global {sc.integridad.permisividadGlobal ?? "—"}</p>
      <p style={{ ...P, marginBottom: 14 }}>
        Más alto es mejor: significa menor permisividad ante la conducta descrita. Ninguna pregunta indagó conducta
        propia pasada; lo que se midió es qué tan aceptable le parece una conducta cuando se la presentan justificada.
      </p>
      {it.integridad.map((x: any) => (
        <Bar key={x.key} label={x.label} pct={x.pct} color={x.pct >= 80 ? GREEN : x.pct >= 60 ? BLUE : AMBER} />
      ))}

      {/* ── Validez ── */}
      <p style={H}>Validación técnica de esta aplicación</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 520 }}>
          <tbody>
            {[
              ["Deseabilidad social", `${v?.deseabilidadSocial?.extremas} de ${v?.deseabilidadSocial?.of}`, v?.deseabilidadSocial?.alerta ? "Perfil posiblemente construido: leer estilo e integridad con reserva" : "En rango"],
              ["Pares de consistencia", `${v?.consistencia?.concordantes} de ${v?.consistencia?.pares}`, v?.consistencia?.alerta ? "Respondió distinto a ítems equivalentes" : "Responde igual a lo equivalente"],
              ["Respuestas bajo 1,5 s", `${v?.latencia?.rapidos}`, v?.latencia?.itemCodes?.length ? v.latencia.itemCodes.join(", ") : "—"],
              ["Patrón plano", v?.patronPlano?.alerta ? "Sí" : "No", v?.patronPlano?.detalle ?? "Varianza normal en las escalas"],
              ["Completitud", `${v?.completitud?.respondidos} de ${v?.completitud?.total}`, v?.completitud?.alerta ? "Faltan respuestas para interpretar el perfil" : "Completa"],
              ["Eventos de proctoring", `${v?.proctoring?.eventos}`, "Cambios de pestaña, pegado, atajos, pérdida de video"],
              ["Capturas guardadas", `${v?.proctoring?.capturas}`, "Una cada 45 segundos mientras la cámara estuvo activa"],
            ].map(([a, b, c], i) => (
              <tr key={i}>
                <td style={{ padding: "8px 10px", borderBottom: `1px solid ${SOFT}`, fontWeight: 600 }}>{a}</td>
                <td style={{ padding: "8px 10px", borderBottom: `1px solid ${SOFT}`, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{b}</td>
                <td style={{ padding: "8px 10px", borderBottom: `1px solid ${SOFT}`, color: GRAY }}>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Limites ── */}
      <div style={{ marginTop: 22, padding: "16px 18px", background: "#FDF6F5", border: "1px solid #F3D6D2", borderRadius: 8 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase", color: RED, fontWeight: 700, margin: "0 0 8px" }}>Lo que este informe no afirma</p>
        <p style={{ ...P, marginBottom: 8 }}>
          No reporta cociente intelectual: no hay normas locales de esta batería y publicar un CI sin ellas sería falso.
          No diagnostica nada ni mide personalidad clínica — &ldquo;estabilidad emocional&rdquo; es el nombre de una escala de
          personalidad laboral, no una condición de salud.
        </p>
        <p style={{ ...P, marginBottom: 8 }}>
          Los puntajes DISC son ipsativos: dicen qué eje pesa más <i>dentro de esta persona</i>, no si es más dominante
          que otro candidato. Por eso solo se usan como afinidad de estilo, nunca para ordenar candidatos.
        </p>
        <p style={{ ...P, marginBottom: 0 }}>
          La integridad mide permisividad ante conductas descritas, no conducta futura. Y el proctoring detecta
          condiciones de la sesión, no intención: una sesión con alertas es una sesión no interpretable, no una acusación.
        </p>
      </div>

      {/* ── Capturas ── */}
      <p style={H}>Capturas de cámara · {d.capturas?.length ?? 0}</p>
      {!d.capturas?.length && <p style={{ ...P, marginBottom: 0 }}>No hay capturas guardadas para esta sesión.</p>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {d.capturas?.map((c: any) => (
          <figure key={c.path} style={{ margin: 0, width: 140 }}>
            {c.url ? <img src={c.url} alt="Captura de la sesión" style={{ width: "100%", borderRadius: 6, border: `1px solid ${BORDER}`, display: "block" }} /> : <div style={{ height: 105, background: SOFT, borderRadius: 6 }} />}
            <figcaption style={{ fontSize: 10.5, color: GRAY, marginTop: 4 }}>parte {c.block} · {new Date(c.captured_at).toLocaleTimeString("es-CO")}</figcaption>
          </figure>
        ))}
      </div>

      {/* ── Eventos ── */}
      {d.eventos?.length > 0 && (
        <>
          <p style={H}>Eventos de la sesión</p>
          <ul style={{ fontSize: 12.5, lineHeight: 1.7, paddingLeft: 18, margin: 0, color: "#374151" }}>
            {d.eventos.map((e: any) => (
              <li key={e.id}>{new Date(e.at).toLocaleTimeString("es-CO")} · <b>{e.kind}</b>{e.detail ? ` · ${e.detail}` : ""}</li>
            ))}
          </ul>
        </>
      )}

      {/* ── Revision ── */}
      <p style={H}>Revisión ítem por ítem</p>
      <div style={{ overflowX: "auto", maxHeight: 460, overflowY: "auto", border: `1px solid ${BORDER}`, borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 720 }}>
          <thead style={{ position: "sticky", top: 0, background: "#fff" }}><tr>
            {["Ítem", "Qué mide", "Respondió", "Clave", "", "ms"].map((x, i) => (
              <th key={i} style={{ textAlign: "left", padding: "8px 9px", borderBottom: `1px solid ${BORDER}`, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", color: GRAY }}>{x}</th>
            ))}
          </tr></thead>
          <tbody>
            {d.revision?.map((r: any) => (
              <tr key={r.item_code}>
                <td style={{ padding: "7px 9px", borderBottom: `1px solid ${SOFT}`, fontFamily: "monospace", color: BLUE }}>{r.item_code}</td>
                <td style={{ padding: "7px 9px", borderBottom: `1px solid ${SOFT}` }}>{r.etiqueta}</td>
                <td style={{ padding: "7px 9px", borderBottom: `1px solid ${SOFT}` }}>
                  {r.respuesta?.choice ?? (r.respuesta?.value != null ? `escala ${r.respuesta.value}` : r.respuesta?.most ? `+${r.respuesta.most} / −${r.respuesta.least}` : "—")}
                  {r.efectividad != null ? ` · efectividad ${r.efectividad}/3` : ""}
                </td>
                <td style={{ padding: "7px 9px", borderBottom: `1px solid ${SOFT}` }}>{r.correcta ?? "—"}</td>
                <td style={{ padding: "7px 9px", borderBottom: `1px solid ${SOFT}`, color: r.acerto === true ? GREEN : r.acerto === false ? RED : GRAY, fontWeight: 700 }}>
                  {r.acerto === true ? "✓" : r.acerto === false ? "✗" : ""}
                </td>
                <td style={{ padding: "7px 9px", borderBottom: `1px solid ${SOFT}`, color: r.latency_ms != null && r.latency_ms < 1500 ? AMBER : GRAY, fontVariantNumeric: "tabular-nums" }}>{r.latency_ms ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
