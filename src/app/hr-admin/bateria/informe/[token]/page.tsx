"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LISTA_PERFILES } from "@/lib/bateria/perfiles-cargo";

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

const REC: Record<string, { txt: string; color: string }> = {
  avanzar: { txt: "Recomendado para avanzar", color: GREEN },
  entrevistar_con_reservas: { txt: "Entrevistar con reservas", color: AMBER },
  no_avanzar: { txt: "No recomendado para este cargo", color: RED },
};
const VER: Record<string, { txt: string; color: string }> = {
  sin_alertas: { txt: "Validez · sin alertas", color: GREEN },
  con_reservas: { txt: "Validez · leer con reservas", color: AMBER },
  no_interpretable: { txt: "Validez · no interpretable", color: RED },
};

export default function InformeImprimible() {
  const params = useParams<{ token: string }>();
  const token = params?.token as string;
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [seg, setSeg] = useState(0);
  const [perfilSel, setPerfilSel] = useState<string>("");

  const cargar = useCallback(async () => {
    try {
      const r = await fetch(`/api/bateria/resultado/${token}`, { cache: "no-store" });
      const txt = await r.text();
      let j: any = {};
      try { j = JSON.parse(txt); } catch { throw new Error(`Respuesta no válida (${r.status})`); }
      if (j.error) setErr(j.error); else setD(j);
    } catch (e: any) {
      setErr(e?.message ?? "No pudimos cargar el informe.");
    }
  }, [token]);

  useEffect(() => { if (token) cargar(); }, [token, cargar]);
  useEffect(() => { if (d?.session?.perfil_cargo) setPerfilSel(d.session.perfil_cargo); }, [d]);

  async function generarIA() {
    setGenerando(true); setErr(null); setSeg(0);
    // Corte duro del lado del navegador. Sin esto, si la funcion no responde
    // nunca, el boton se queda pensando para siempre y no dice por que.
    const ctrl = new AbortController();
    const corte = setTimeout(() => ctrl.abort(), 150_000);
    const reloj = setInterval(() => setSeg((n) => n + 1), 1000);
    try {
      const r = await fetch(`/api/bateria/informe-ia/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(perfilSel ? { perfil: perfilSel } : {}),
        signal: ctrl.signal,
        cache: "no-store",
      });
      // Un timeout de la función devuelve HTML, no JSON. Sin este manejo el
      // botón se quedaba pensando para siempre y no aparecía ningún error.
      const txt = await r.text();
      let j: any = {};
      try { j = JSON.parse(txt); } catch {
        throw new Error(
          r.status === 504
            ? "El análisis tardó más de lo permitido y se cortó. Vuelva a intentarlo."
            : `El servidor respondió ${r.status}. ${txt.slice(0, 160)}`
        );
      }
      if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
      await cargar();
      if (j.aviso) setErr(j.aviso);
    } catch (e: any) {
      setErr(
        e?.name === "AbortError"
          ? "El servidor no respondió en 2 minutos y medio. La función se quedó colgada: revise el log del deployment en Vercel para esta ruta."
          : e?.message ?? "No pudimos generar el análisis."
      );
    } finally {
      clearTimeout(corte); clearInterval(reloj);
      setGenerando(false);
    }
  }

  if (err && !d) return <Marco><p style={{ color: RED }}>{err}</p></Marco>;
  if (!d) return <Marco><p style={{ color: GRAY }}>Cargando…</p></Marco>;

  const s = d.session;
  const sc = s.scores;
  const it = d.interpretacion;
  const m = d.match;
  const ia = d.informeIA;
  const ver = VER[s.validity?.veredicto] ?? VER.sin_alertas;

  if (!sc?.personalidad) {
    return <Marco><p style={{ color: GRAY }}>Esta sesión todavía no tiene puntajes calculados.</p></Marco>;
  }

  return (
    <Marco>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .page-break { break-before: page; }
          body { background: #fff !important; }
          .sheet { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; max-width: none !important; }
        }
        @page { margin: 14mm; }
      `}</style>

      <div className="no-print" style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
        <button onClick={() => window.print()} style={btnN}>Descargar PDF</button>
        <select
          value={perfilSel}
          onChange={(e) => setPerfilSel(e.target.value)}
          style={{ ...btnN, background: "#fff", color: BLACK, border: `1px solid ${BORDER}`, cursor: "pointer" }}
          title="Contra qué perfil de cargo se compara este candidato"
        >
          <option value="">Sin perfil de cargo (no calcula match)</option>
          {LISTA_PERFILES.map((p) => (
            <option key={p.key} value={p.key}>{p.nombre}</option>
          ))}
        </select>
        <button onClick={generarIA} disabled={generando} style={{ ...btnN, background: "#fff", color: BLACK, border: `1px solid ${BORDER}` }}>
          {generando
            ? `El psicólogo está redactando… ${seg} s`
            : ia ? "Regenerar análisis" : "Generar análisis del psicólogo"}
        </button>
        <a href="/hr-admin/bateria" style={{ fontSize: 13, color: BLUE, marginLeft: 4 }}>← Volver</a>
      </div>

      {err && (
        <div className="no-print" style={{ padding: "14px 16px", background: "#FDF6F5", border: "1px solid #F3D6D2", borderRadius: 8, marginBottom: 20 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase", color: RED, fontWeight: 700, margin: "0 0 6px" }}>No se pudo generar el análisis</p>
          <p style={{ fontSize: 13.5, margin: 0, fontFamily: "ui-monospace, monospace", wordBreak: "break-word" }}>{err}</p>
        </div>
      )}

      {/* ── Portada ── */}
      <header style={{ borderBottom: `2px solid ${BLACK}`, paddingBottom: 18, marginBottom: 26 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: BLUE, fontWeight: 700, margin: "0 0 8px" }}>
          Trading Solutions · Informe de selección
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{s.candidate_name || "(sin nombre)"}</h1>
            <p style={{ margin: 0, color: GRAY, fontSize: 14 }}>
              {m?.perfil?.nombre ?? s.vacancy_title ?? "Sin perfil de cargo"}
              {m?.perfil?.version ? ` · perfil ${m.perfil.version}` : ""}
            </p>
            <p style={{ margin: "4px 0 0", color: GRAY, fontSize: 12.5 }}>
              Batería {s.battery_version} · {s.finished_at ? new Date(s.finished_at).toLocaleDateString("es-CO") : "—"} ·
              {" "}{s.duration_seconds ? `${Math.round(s.duration_seconds / 60)} min` : "—"}
            </p>
          </div>
          {m && (
            <div style={{ textAlign: "center", border: `2px solid ${m.global >= 75 ? GREEN : m.global >= 55 ? BLUE : AMBER}`, borderRadius: 12, padding: "14px 22px" }}>
              <div style={{ fontSize: 42, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums", color: m.global >= 75 ? GREEN : m.global >= 55 ? BLUE : AMBER }}>
                {m.global}<span style={{ fontSize: 20 }}>%</span>
              </div>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: GRAY, marginTop: 5 }}>Match con el cargo</div>
              <div style={{ fontSize: 10.5, color: GRAY, marginTop: 3 }}>± {m.banda} pts</div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <Chip color={ver.color}>{ver.txt}</Chip>
          {ia?.conclusion?.recomendacion && <Chip color={REC[ia.conclusion.recomendacion]?.color ?? GRAY}>{REC[ia.conclusion.recomendacion]?.txt}</Chip>}
          {m?.alertas?.length > 0 && <Chip color={RED}>{m.alertas.length} alerta{m.alertas.length > 1 ? "s" : ""} de perfil</Chip>}
        </div>
      </header>

      {!ia && (
        <div className="no-print" style={{ padding: 16, background: "#EEF3FE", border: "1px solid #C7D9FB", borderRadius: 8, marginBottom: 24 }}>
          <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>
            Este informe todavía no tiene el análisis del psicólogo. Los gráficos y los puntajes ya están; dale a
            <b> Generar análisis del psicólogo</b> para que redacte la lectura, las fortalezas, los riesgos del cargo y las preguntas de entrevista.
          </p>
        </div>
      )}

      {/* ── Análisis del agente ── */}
      {ia && (
        <>
          <H>Lectura del perfil</H>
          {String(ia.resumen || "").split("\n").filter(Boolean).map((p: string, i: number) => <P key={i}>{p}</P>)}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 22, marginTop: 18 }}>
            <div>
              <Sub color={GREEN}>Fortalezas</Sub>
              {(ia.fortalezas ?? []).map((f: any, i: number) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <b style={{ fontSize: 14 }}>{f.titulo}</b>
                  <p style={{ ...pStyle, margin: "3px 0 0" }}>{f.detalle}</p>
                  {f.evidencia && <p style={{ fontSize: 12, color: GRAY, margin: "3px 0 0" }}>{f.evidencia}</p>}
                </div>
              ))}
            </div>
            <div>
              <Sub color={AMBER}>Oportunidades de desarrollo</Sub>
              {(ia.oportunidades ?? []).map((f: any, i: number) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <b style={{ fontSize: 14 }}>{f.titulo}</b>
                  <p style={{ ...pStyle, margin: "3px 0 0" }}>{f.detalle}</p>
                  {f.evidencia && <p style={{ fontSize: 12, color: GRAY, margin: "3px 0 0" }}>{f.evidencia}</p>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Match ── */}
      {m && (
        <>
          <H className="page-break">Compatibilidad con el cargo</H>
          <P>{m.perfil.nombre} · perfil {m.perfil.version}</P>
          {m.componentes.map((c: any) => (
            <Bar key={c.key} label={c.label} pct={c.puntaje} right={`peso ${Math.round(c.peso * 100)}%`} />
          ))}
          <p style={{ fontSize: 12.5, color: GRAY, marginTop: 10 }}>
            El match global es la suma ponderada: {m.componentes.map((c: any) => `${c.label} ${c.puntaje}×${c.peso}`).join(" + ")} = <b style={{ color: BLACK }}>{m.global}</b>.
          </p>

          <Sub>Rasgo por rasgo, contra el perfil del cargo</Sub>
          {m.rasgos.map((r: any) => (
            <Bar key={r.key} label={r.label} pct={r.obtenido} ref2={r.referencia}
              right={`ref ${r.referencia} · dist ${r.distancia}`}
              color={r.distancia <= 12 ? GREEN : r.distancia <= 25 ? BLUE : AMBER} />
          ))}

          {!!m.alertas.length && (
            <div style={{ marginTop: 16, padding: "14px 16px", background: "#FDF6F5", border: "1px solid #F3D6D2", borderRadius: 8 }}>
              <Sub color={RED}>Alertas de perfil</Sub>
              {m.alertas.map((a: any, i: number) => (
                <p key={i} style={{ ...pStyle, margin: "0 0 8px" }}>
                  <b>{a.label}: {a.obtenido}</b> (mínimo {a.minimo}). {a.porque}
                </p>
              ))}
              <p style={{ fontSize: 12.5, color: GRAY, margin: 0 }}>
                Las alertas no bajan el puntaje: lo marcan. Un candidato bajo el piso no es "menos match", es un caso a revisar antes de avanzar.
              </p>
            </div>
          )}

          {ia?.compatibilidad && (
            <div style={{ marginTop: 18 }}>
              <P>{ia.compatibilidad.lectura}</P>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
                <div>
                  <Sub color={GREEN}>A favor para el puesto</Sub>
                  <Lista items={ia.compatibilidad.aFavor} />
                </div>
                <div>
                  <Sub color={AMBER}>Puntos de cuidado</Sub>
                  <Lista items={ia.compatibilidad.riesgos} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Perfil psicométrico ── */}
      <H className="page-break">Perfil psicométrico</H>
      <Sub>Los cinco rasgos</Sub>
      {it.factores.map((f: any) => (
        <div key={f.key} style={{ padding: "10px 0", borderBottom: `1px solid ${SOFT}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <b style={{ fontSize: 14 }}>{f.label}</b>
            <span style={{ fontSize: 12.5, color: GRAY }}><b style={{ color: BLACK }}>{f.pct}</b> · {f.franja}</span>
          </div>
          <p style={{ ...pStyle, margin: "5px 0 0" }}>{f.lectura}</p>
        </div>
      ))}

      <Sub>Las quince facetas</Sub>
      {it.factores.map((f: any) => (
        <div key={f.key} style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: GRAY, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</p>
          {f.facetas.map((fa: any) => <Bar key={fa.key} label={fa.label} pct={fa.pct} />)}
        </div>
      ))}

      <Sub>Estilo de comportamiento · {it.patron?.nombre}</Sub>
      <P>{it.patron?.descripcion}</P>
      <DiscChart natural={sc.disc.natural} mascara={sc.disc.mascara} presion={sc.disc.presion} referencia={m?.perfil ? (d.perfil?.disc ?? null) : null} />
      <p style={{ fontSize: 12.5, color: GRAY, marginTop: 8 }}>
        Barras: perfil natural. Línea azul: máscara social, lo que muestra. Línea morada: bajo presión, a lo que recurre.
        Cuanto más separadas, más está ajustando su estilo al entorno.
      </p>

      <Sub>Qué lo mueve</Sub>
      {it.motivadores.map((mo: any) => <Bar key={mo.key} label={mo.label} pct={mo.pct} />)}

      <Sub>Razonamiento · {sc.razonamiento.total}/100</Sub>
      {it.razonamiento.map((r: any) => <Bar key={r.key} label={r.label} pct={r.pct} right={`${r.correct}/${r.of}`} />)}

      <Sub>Integridad · {sc.integridad.permisividadGlobal}</Sub>
      {it.integridad.map((x: any) => (
        <Bar key={x.key} label={x.label} pct={x.pct} color={x.pct >= 80 ? GREEN : x.pct >= 60 ? BLUE : AMBER} />
      ))}

      {/* ── Entrevista y plan ── */}
      {ia?.preguntasEntrevista?.length > 0 && (
        <>
          <H className="page-break">Preguntas para la entrevista</H>
          <P>Salen de las brechas de este perfil. No son genéricas: cada una ataca algo que la prueba dejó abierto.</P>
          {ia.preguntasEntrevista.map((q: any, i: number) => (
            <div key={i} style={{ border: `1px solid ${BORDER}`, borderLeft: `2px solid ${PLUM}`, borderRadius: 6, padding: "12px 14px", marginBottom: 10 }}>
              <p style={{ margin: "0 0 5px", fontSize: 14.5, fontWeight: 500 }}>{q.pregunta}</p>
              <p style={{ margin: "0 0 3px", fontSize: 12.5, color: GRAY }}><b>Por qué:</b> {q.porque}</p>
              <p style={{ margin: 0, fontSize: 12.5, color: GRAY }}><b>Qué escuchar:</b> {q.queEscuchar}</p>
            </div>
          ))}
        </>
      )}

      {ia?.planEntrada?.length > 0 && (
        <>
          <Sub>Plan de entrada sugerido</Sub>
          {ia.planEntrada.map((x: any, i: number) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <b style={{ fontSize: 14 }}>{x.periodo}</b>
              <p style={{ ...pStyle, margin: "3px 0 0" }}>{x.foco}</p>
              <p style={{ fontSize: 12.5, color: GRAY, margin: "2px 0 0" }}>{x.porque}</p>
            </div>
          ))}
        </>
      )}

      {ia?.conclusion && (
        <>
          <H>Conclusión</H>
          <div style={{ padding: "16px 18px", border: `1px solid ${BORDER}`, borderLeft: `3px solid ${REC[ia.conclusion.recomendacion]?.color ?? BLUE}`, borderRadius: 8 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.09em", textTransform: "uppercase", fontWeight: 700, margin: "0 0 8px", color: REC[ia.conclusion.recomendacion]?.color ?? BLUE }}>
              {REC[ia.conclusion.recomendacion]?.txt ?? ia.conclusion.recomendacion}
            </p>
            <p style={{ ...pStyle, margin: 0, fontSize: 15 }}>{ia.conclusion.texto}</p>
          </div>
        </>
      )}

      {/* ── Límites ── */}
      <div style={{ marginTop: 26, padding: "16px 18px", background: "#FDF6F5", border: "1px solid #F3D6D2", borderRadius: 8 }}>
        <Sub color={RED}>Lo que este informe no afirma</Sub>
        <P>
          No reporta cociente intelectual: sin normas locales, un CI sería un número inventado. No diagnostica —
          &ldquo;estabilidad emocional&rdquo; es una escala de personalidad laboral, no una condición de salud. Los puntajes DISC
          son ipsativos: miden distancia al perfil del cargo, no ordenan candidatos entre sí. La integridad mide
          permisividad ante conductas descritas, no conducta futura. El proctoring detecta condiciones de la sesión,
          no intención.
        </P>
        {ia?.loQueNoAfirma && <P>{ia.loQueNoAfirma}</P>}
        <p style={{ fontSize: 12, color: GRAY, margin: "8px 0 0" }}>
          Análisis redactado por agente asistido con IA sobre puntajes ya calculados; el agente no puntúa ni infiere cifras.
          Requiere revisión de un profesional con tarjeta vigente antes de sustentar una decisión (Ley 1090 de 2006).
          {ia?.generado_at ? ` Generado el ${new Date(ia.generado_at).toLocaleString("es-CO")}.` : ""}
        </p>
      </div>
    </Marco>
  );
}

// ── piezas ──
const pStyle: React.CSSProperties = { fontSize: 14.5, lineHeight: 1.65, color: "#374151", maxWidth: "70ch" };
const btnN: React.CSSProperties = { background: BLACK, color: "#fff", border: "none", borderRadius: 7, padding: "10px 18px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" };

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh", padding: "28px 20px 80px", fontFamily: "system-ui, -apple-system, sans-serif", color: BLACK }}>
      <div className="sheet" style={{ maxWidth: 840, margin: "0 auto", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "34px 38px 44px" }}>
        {children}
      </div>
    </div>
  );
}
function H({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={className} style={{ fontSize: 20, fontWeight: 700, margin: "32px 0 10px", paddingTop: 6, borderTop: `1px solid ${BORDER}` }}>{children}</h2>;
}
function Sub({ children, color = BLUE }: { children: React.ReactNode; color?: string }) {
  return <p style={{ fontSize: 11, letterSpacing: "0.11em", textTransform: "uppercase", color, fontWeight: 700, margin: "22px 0 8px" }}>{children}</p>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ ...pStyle, margin: "0 0 11px" }}>{children}</p>;
}
function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 5, color, border: `1px solid ${color}` }}>{children}</span>;
}
function Lista({ items }: { items?: string[] }) {
  return <ul style={{ margin: 0, paddingLeft: 17 }}>{(items ?? []).map((x, i) => <li key={i} style={{ ...pStyle, marginBottom: 5 }}>{x}</li>)}</ul>;
}
function Bar({ label, pct, right, color = BLUE, ref2 }: { label: string; pct: number; right?: string; color?: string; ref2?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "165px 1fr 118px", gap: 11, alignItems: "center", padding: "4px 0" }}>
      <span style={{ fontSize: 13 }}>{label}</span>
      <span style={{ height: 9, background: SOFT, borderRadius: 2, position: "relative", display: "block" }}>
        <span style={{ display: "block", width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", background: color, borderRadius: 2 }} />
        {ref2 != null && <span style={{ position: "absolute", left: `${Math.max(0, Math.min(100, ref2))}%`, top: -3, bottom: -3, width: 2, background: RED }} />}
      </span>
      <span style={{ fontSize: 11.5, textAlign: "right", color: GRAY, fontVariantNumeric: "tabular-nums" }}>
        <b style={{ color: BLACK }}>{pct}</b>{right ? ` · ${right}` : ""}
      </span>
    </div>
  );
}
function DiscChart({ natural, mascara, presion, referencia }: any) {
  const AX = ["D", "I", "S", "C"];
  const W = 400, Hh = 250, ml = 32, mb = 32, mt = 10;
  const plotW = W - ml - 12, plotH = Hh - mt - mb;
  const colX = (i: number) => ml + plotW * ((i + 0.5) / 4);
  const segY = (s: number) => mt + plotH - (s / 7) * plotH;
  const line = (g: any) => AX.map((k, i) => `${colX(i)},${segY(g?.[k]?.seg ?? 0)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${Hh}`} width="100%" style={{ maxWidth: W, display: "block" }} role="img" aria-label="Gráfica DISC">
      {[1, 2, 3, 4, 5, 6, 7].map((s) => (
        <g key={s}>
          <line x1={ml} y1={segY(s)} x2={W - 12} y2={segY(s)} stroke={s === 4 ? "#9CA3AF" : BORDER} strokeWidth={s === 4 ? 1.2 : 1} strokeDasharray={s === 4 ? "4 3" : undefined} />
          <text x={ml - 7} y={segY(s) + 4} textAnchor="end" fontSize="10" fill={GRAY}>{s}</text>
        </g>
      ))}
      {AX.map((k, i) => {
        const seg = natural?.[k]?.seg ?? 0;
        return (
          <g key={k}>
            <rect x={colX(i) - 22} y={segY(seg)} width={44} height={mt + plotH - segY(seg)} fill={DISC_COLOR[k]} opacity={0.75} />
            {referencia?.[k] != null && (
              <line x1={colX(i) - 26} y1={segY(referencia[k])} x2={colX(i) + 26} y2={segY(referencia[k])} stroke={RED} strokeWidth="2" strokeDasharray="5 3" />
            )}
            <text x={colX(i)} y={Hh - 11} textAnchor="middle" fontSize="13" fontWeight="700" fill={BLACK}>{k}</text>
          </g>
        );
      })}
      <polyline points={line(mascara)} fill="none" stroke="#1F3A93" strokeWidth="1.8" />
      <polyline points={line(presion)} fill="none" stroke={PLUM} strokeWidth="1.8" />
      {AX.map((k, i) => <circle key={`p${k}`} cx={colX(i)} cy={segY(presion?.[k]?.seg ?? 0)} r="4" fill={PLUM} />)}
      {AX.map((k, i) => <rect key={`m${k}`} x={colX(i) - 4.5} y={segY(mascara?.[k]?.seg ?? 0) - 4.5} width={9} height={9} fill="#fff" stroke="#1F3A93" strokeWidth="1.8" transform={`rotate(45 ${colX(i)} ${segY(mascara?.[k]?.seg ?? 0)})`} />)}
    </svg>
  );
}
