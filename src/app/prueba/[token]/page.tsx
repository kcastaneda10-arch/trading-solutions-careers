"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

const TS_BLACK = "#0A0A0A";
const TS_BLUE = "#2C64ED";
const TS_GRAY = "#6B7280";
const TS_BORDER = "#E5E7EB";
const TS_BG = "#FAFAFA";

const SNAPSHOT_EVERY_MS = 45_000;

type Phase = "loading" | "error" | "habeas" | "intro" | "test" | "sending" | "done";

type Opt = { key: string; text?: string; svg?: string; alt?: string };
type CItem = {
  code: string;
  block: string;
  type: "mc" | "figure" | "forced" | "likert" | "situational" | "open";
  stem?: string;
  prompt?: string;
  prompt2?: string;
  bullets?: string[];
  minWords?: number;
  matrixSvg?: string;
  options?: Opt[];
  statements?: { key: string; text: string }[];
};
type CBlock = { key: string; label: string; intro: string; timedSeconds: number | null; items: CItem[] };

const LIKERT = [
  { v: 1, label: "Muy en desacuerdo" },
  { v: 2, label: "En desacuerdo" },
  { v: 3, label: "Neutral" },
  { v: 4, label: "De acuerdo" },
  { v: 5, label: "Muy de acuerdo" },
];

function mmss(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export default function PruebaPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token as string;

  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [session, setSession] = useState<any>(null);
  const [blocks, setBlocks] = useState<CBlock[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const [bi, setBi] = useState(0);
  const [ii, setIi] = useState(0);
  const [left, setLeft] = useState<number | null>(null);

  const [okData, setOkData] = useState(false);
  const [okCam, setOkCam] = useState(false);
  const [name, setName] = useState("");
  const [camState, setCamState] = useState<"off" | "on" | "denied">("off");

  const shownAt = useRef<number>(Date.now());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const blockRef = useRef<string>("A");

  // ── Telemetría ────────────────────────────────────────────
  const logEvent = useCallback(
    (kind: string, detail?: string, item_code?: string) => {
      if (!token) return;
      fetch("/api/bateria/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, kind, detail, item_code }),
        keepalive: true,
      }).catch(() => {});
    },
    [token]
  );

  // ── Carga ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await fetch(`/api/bateria/session/${token}`);
        const j = await r.json();
        if (!r.ok) {
          setErrorMsg(j.error || "No pudimos abrir la prueba.");
          setPhase("error");
          return;
        }
        setSession(j.session);
        setBlocks(j.blocks);
        setAnswers(j.existing || {});
        setName(j.session.candidate_name || "");
        setPhase(j.session.consent_data_at ? "intro" : "habeas");
      } catch {
        setErrorMsg("No pudimos conectar. Revise su conexión e intente de nuevo.");
        setPhase("error");
      }
    })();
  }, [token]);

  // ── Proctoring: eventos del navegador ─────────────────────
  useEffect(() => {
    if (phase !== "test") return;
    const onBlur = () => logEvent("tab_blur", document.hidden ? "pestaña oculta" : "ventana sin foco");
    const onFocus = () => logEvent("tab_focus");
    const onPaste = (e: ClipboardEvent) => {
      logEvent("paste", `${(e.clipboardData?.getData("text") || "").length} caracteres`);
    };
    const onCopy = () => logEvent("copy");
    const onCtx = (e: MouseEvent) => {
      e.preventDefault();
      logEvent("contextmenu");
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const combo = (e.ctrlKey || e.metaKey) && ["c", "v", "p", "s", "f", "u"].includes(k);
      const print = e.key === "PrintScreen";
      if (combo || print) logEvent("shortcut", print ? "PrintScreen" : `${e.metaKey ? "Cmd" : "Ctrl"}+${k}`);
    };
    document.addEventListener("visibilitychange", onBlur);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("paste", onPaste);
    document.addEventListener("copy", onCopy);
    document.addEventListener("contextmenu", onCtx);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("visibilitychange", onBlur);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("contextmenu", onCtx);
      document.removeEventListener("keydown", onKey);
    };
  }, [phase, logEvent]);

  // ── Cámara ────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCamState("on");
      logEvent("cam_ok");
      return true;
    } catch {
      setCamState("denied");
      logEvent("cam_denied");
      return false;
    }
  }, [logEvent]);

  const capture = useCallback(() => {
    const v = videoRef.current;
    if (!v || v.readyState < 2) return;
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 240;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const image = c.toDataURL("image/jpeg", 0.6);
    fetch("/api/bateria/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, image, block: blockRef.current }),
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (phase !== "test" || camState !== "on") return;
    capture();
    const id = setInterval(() => {
      const track = streamRef.current?.getVideoTracks()?.[0];
      if (!track || track.readyState !== "live") {
        logEvent("cam_lost");
        setCamState("denied");
        return;
      }
      capture();
    }, SNAPSHOT_EVERY_MS);
    return () => clearInterval(id);
  }, [phase, camState, capture, logEvent]);

  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  // ── Cronómetro por bloque ─────────────────────────────────
  const block = blocks[bi];
  useEffect(() => {
    if (phase !== "test" || !block) return;
    blockRef.current = block.key;
    setLeft(block.timedSeconds);
  }, [phase, bi, block]);

  useEffect(() => {
    if (phase !== "test" || left == null) return;
    if (left <= 0) {
      nextBlock();
      return;
    }
    const id = setTimeout(() => setLeft((l) => (l == null ? l : l - 1)), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, phase]);

  // ── Guardado ──────────────────────────────────────────────
  const saveAnswer = useCallback(
    (code: string, answer: any) => {
      setAnswers((a) => ({ ...a, [code]: answer }));
      fetch("/api/bateria/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, item_code: code, answer, latency_ms: Date.now() - shownAt.current }),
        keepalive: true,
      }).catch(() => {});
    },
    [token]
  );

  function nextBlock() {
    logEvent("block_end", block?.key);
    if (bi + 1 < blocks.length) {
      setBi(bi + 1);
      setIi(0);
      shownAt.current = Date.now();
      window.scrollTo({ top: 0 });
    } else {
      finish();
    }
  }

  function next() {
    if (!block) return;
    if (ii + 1 < block.items.length) {
      setIi(ii + 1);
      shownAt.current = Date.now();
      window.scrollTo({ top: 0 });
    } else {
      nextBlock();
    }
  }

  async function finish() {
    setPhase("sending");
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      await fetch("/api/bateria/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    } catch {}
    setPhase("done");
  }

  async function acceptConsent() {
    const camOk = okCam ? await startCamera() : false;
    await fetch("/api/bateria/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, camera: okCam && camOk, name }),
    });
    setPhase("intro");
  }

  // ── UI ────────────────────────────────────────────────────
  const shell: React.CSSProperties = {
    minHeight: "100vh",
    background: TS_BG,
    color: TS_BLACK,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    padding: "32px 20px 80px",
  };
  const card: React.CSSProperties = {
    maxWidth: 720,
    margin: "0 auto",
    background: "#fff",
    border: `1px solid ${TS_BORDER}`,
    borderRadius: 10,
    padding: "28px 28px 32px",
  };
  const h1: React.CSSProperties = { fontSize: 22, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.01em" };
  const sub: React.CSSProperties = { color: TS_GRAY, fontSize: 14, margin: "0 0 22px", lineHeight: 1.6 };
  const btn: React.CSSProperties = {
    background: TS_BLACK,
    color: "#fff",
    border: "none",
    borderRadius: 7,
    padding: "12px 22px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  };
  const btnGhost: React.CSSProperties = { ...btn, background: "#fff", color: TS_BLACK, border: `1px solid ${TS_BORDER}` };

  if (phase === "loading") {
    return (
      <div style={shell}>
        <div style={card}>
          <p style={{ color: TS_GRAY, margin: 0 }}>Cargando…</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div style={shell}>
        <div style={card}>
          <h1 style={h1}>No pudimos abrir la prueba</h1>
          <p style={sub}>{errorMsg}</p>
          <p style={{ ...sub, marginBottom: 0 }}>
            Si el problema sigue, responda el correo con el que recibió este enlace y lo revisamos.
          </p>
        </div>
      </div>
    );
  }

  if (phase === "habeas") {
    return (
      <div style={shell}>
        <div style={card}>
          <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: TS_BLUE, fontWeight: 700, margin: "0 0 10px" }}>
            Trading Solutions
          </p>
          <h1 style={h1}>Autorización de tratamiento de datos personales</h1>
          <p style={sub}>
            Trading Solutions S.A.S. tratará los datos que usted suministre en esta prueba con la única finalidad de
            evaluar su candidatura al cargo al que aplicó. Se recogen sus respuestas, los tiempos de respuesta y las
            capturas de cámara durante la sesión.
          </p>
          <ul style={{ ...sub, paddingLeft: 18, marginBottom: 22 }}>
            <li style={{ marginBottom: 7 }}>Los resultados se conservan <b>dos años</b> y luego se eliminan.</li>
            <li style={{ marginBottom: 7 }}>No se comparten con terceros distintos al equipo de selección.</li>
            <li style={{ marginBottom: 7 }}>
              Sus derechos como titular y los canales para ejercerlos están descritos en la <b>Política de Tratamiento
              de Datos Personales</b> de Trading Solutions S.A.S., publicada en nuestro sitio de empleo.
            </li>
            <li>
              La presentación <b>remota exige cámara activa</b> durante toda la sesión. Si prefiere no habilitarla,
              puede presentar la prueba de forma <b>presencial</b> en nuestras instalaciones: responda el correo con el
              que recibió este enlace y le agendamos.
            </li>
          </ul>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Nombre completo</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como aparece en su documento"
              style={{ width: "100%", padding: "11px 12px", border: `1px solid ${TS_BORDER}`, borderRadius: 7, fontSize: 14 }}
            />
          </div>

          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={okData} onChange={(e) => setOkData(e.target.checked)} style={{ marginTop: 3 }} />
            <span><b>Autorizo</b> el tratamiento de mis datos en los términos descritos.</span>
          </label>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 20, fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={okCam} onChange={(e) => setOkCam(e.target.checked)} style={{ marginTop: 3 }} />
            <span><b>Autorizo la captura de imagen</b> durante la sesión y entiendo que es condición de la modalidad remota.</span>
          </label>

          <button
            style={{ ...btn, opacity: okData && okCam && name.trim().length > 2 ? 1 : 0.4, cursor: okData && okCam ? "pointer" : "not-allowed" }}
            disabled={!okData || !okCam || name.trim().length < 3}
            onClick={acceptConsent}
          >
            Acepto y continúo
          </button>
          {camState === "denied" && (
            <p style={{ color: "#B45309", fontSize: 13, marginTop: 14 }}>
              El navegador bloqueó la cámara. Habilite el permiso y vuelva a intentar, o escríbanos para presentar la
              prueba de forma presencial.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div style={shell}>
        <div style={card}>
          <h1 style={h1}>{session?.vacancy_title || "Prueba de selección"}</h1>
          <p style={sub}>
            La prueba tiene <b>cinco partes</b> y toma alrededor de 40 minutos. Las dos primeras están cronometradas;
            las demás no. No se puede volver atrás una vez avanza de pregunta, así que responda con calma.
          </p>
          <p style={sub}>
            Sus respuestas se guardan a medida que avanza. Si se le cierra el navegador, vuelva a abrir este mismo
            enlace y continúa donde quedó.
          </p>
          <p style={{ ...sub, marginBottom: 24 }}>
            Al terminar no verá un resultado en pantalla: el informe lo revisa el equipo de selección y nos comunicamos
            con usted por correo.
          </p>
          <button
            style={btn}
            onClick={async () => {
              if (camState !== "on") await startCamera();
              shownAt.current = Date.now();
              setPhase("test");
              logEvent("block_start", "A");
            }}
          >
            Comenzar
          </button>
        </div>
      </div>
    );
  }

  if (phase === "sending" || phase === "done") {
    return (
      <div style={shell}>
        <div style={card}>
          <h1 style={h1}>{phase === "sending" ? "Enviando sus respuestas…" : "Listo, recibimos su prueba"}</h1>
          <p style={{ ...sub, marginBottom: 0 }}>
            {phase === "sending"
              ? "No cierre esta ventana."
              : "Gracias por el tiempo que dedicó. El equipo de selección revisa los resultados y se comunica con usted por correo. Ya puede cerrar esta ventana."}
          </p>
        </div>
      </div>
    );
  }

  // ── phase === "test" ──────────────────────────────────────
  const item = block?.items[ii];
  if (!block || !item) return null;
  const a = answers[item.code];
  const totalItems = blocks.reduce((n, b) => n + b.items.length, 0);
  const doneItems = blocks.slice(0, bi).reduce((n, b) => n + b.items.length, 0) + ii;
  const answered =
    item.type === "forced"
      ? !!a?.most && !!a?.least && a.most !== a.least
      : item.type === "likert"
      ? !!a?.value
      : item.type === "open"
      ? (a?.text || "").trim().split(/\s+/).filter(Boolean).length >= (item.minWords || 0)
      : !!a?.choice;

  return (
    <div style={shell}>
      <video ref={videoRef} muted playsInline style={{ position: "fixed", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />

      <div style={{ maxWidth: 720, margin: "0 auto 14px", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: TS_GRAY, fontWeight: 700 }}>
          {block.label}
        </span>
        <div style={{ flex: 1, height: 4, background: TS_BORDER, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${(doneItems / totalItems) * 100}%`, height: "100%", background: TS_BLUE }} />
        </div>
        {left != null && (
          <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 13, fontWeight: 600, color: left < 60 ? "#C41818" : TS_GRAY }}>
            {mmss(left)}
          </span>
        )}
        <span style={{ fontSize: 11, color: camState === "on" ? "#1A7D3E" : "#B45309", fontWeight: 600 }}>
          {camState === "on" ? "● cámara activa" : "● sin cámara"}
        </span>
      </div>

      <div style={card}>
        {ii === 0 && <p style={{ ...sub, marginBottom: 20 }}>{block.intro}</p>}

        {item.type === "forced" ? (
          <>
            <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px" }}>{item.prompt}</p>
            <div style={{ border: `1px solid ${TS_BORDER}`, borderRadius: 7, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 62px 62px", background: "#F5F5F5", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: TS_GRAY }}>
                <div style={{ padding: "9px 12px" }}>Frase</div>
                <div style={{ padding: "9px 6px", textAlign: "center", borderLeft: `1px solid ${TS_BORDER}` }}>Más</div>
                <div style={{ padding: "9px 6px", textAlign: "center", borderLeft: `1px solid ${TS_BORDER}` }}>Menos</div>
              </div>
              {item.statements?.map((s) => (
                <div key={s.key} style={{ display: "grid", gridTemplateColumns: "1fr 62px 62px", borderTop: `1px solid ${TS_BORDER}`, alignItems: "center" }}>
                  <div style={{ padding: "12px", fontSize: 14, lineHeight: 1.45 }}>{s.text}</div>
                  <div style={{ textAlign: "center", borderLeft: `1px solid ${TS_BORDER}`, padding: "12px 0" }}>
                    <input
                      type="radio"
                      name={`${item.code}-most`}
                      checked={a?.most === s.key}
                      onChange={() => saveAnswer(item.code, { ...(a || {}), most: s.key, least: a?.least === s.key ? undefined : a?.least })}
                    />
                  </div>
                  <div style={{ textAlign: "center", borderLeft: `1px solid ${TS_BORDER}`, padding: "12px 0" }}>
                    <input
                      type="radio"
                      name={`${item.code}-least`}
                      checked={a?.least === s.key}
                      onChange={() => saveAnswer(item.code, { ...(a || {}), least: s.key, most: a?.most === s.key ? undefined : a?.most })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : item.type === "likert" ? (
          <>
            <p style={{ fontSize: 16, lineHeight: 1.6, margin: "0 0 18px" }}>{item.stem}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {LIKERT.map((l) => (
                <button
                  key={l.v}
                  onClick={() => saveAnswer(item.code, { value: l.v })}
                  style={{
                    flex: "1 1 120px",
                    padding: "13px 8px",
                    fontSize: 12.5,
                    borderRadius: 7,
                    cursor: "pointer",
                    border: `1px solid ${a?.value === l.v ? TS_BLUE : TS_BORDER}`,
                    background: a?.value === l.v ? "#EEF3FE" : "#fff",
                    color: a?.value === l.v ? TS_BLUE : TS_BLACK,
                    fontWeight: a?.value === l.v ? 700 : 400,
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </>
        ) : item.type === "open" ? (
          <>
            <p style={{ fontSize: 16, lineHeight: 1.6, margin: "0 0 12px" }}>{item.stem}</p>
            {item.bullets && (
              <ul style={{ fontSize: 14.5, lineHeight: 1.6, color: TS_BLACK, paddingLeft: 18, margin: "0 0 16px" }}>
                {item.bullets.map((b, k) => (
                  <li key={k} style={{ marginBottom: 6 }}>{b}</li>
                ))}
              </ul>
            )}
            {item.prompt2 && (
              <p style={{ fontSize: 14.5, lineHeight: 1.6, margin: "0 0 14px", whiteSpace: "pre-line", fontWeight: 500 }}>{item.prompt2}</p>
            )}
            <textarea
              value={a?.text || ""}
              onChange={(e) => saveAnswer(item.code, { text: e.target.value })}
              rows={12}
              placeholder="Escriba aquí su respuesta."
              style={{ width: "100%", padding: 14, border: `1px solid ${TS_BORDER}`, borderRadius: 7, fontSize: 14.5, lineHeight: 1.6, fontFamily: "inherit", resize: "vertical" }}
            />
            <p style={{ fontSize: 12.5, color: TS_GRAY, marginTop: 8 }}>
              {(a?.text || "").trim().split(/\s+/).filter(Boolean).length} de {item.minWords} palabras mínimas
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 16, lineHeight: 1.6, margin: "0 0 16px", whiteSpace: "pre-line" }}>{item.stem}</p>
            {item.matrixSvg ? (
              <div
                style={{ maxWidth: 330, margin: "0 0 20px", color: TS_BLACK }}
                dangerouslySetInnerHTML={{ __html: item.matrixSvg }}
              />
            ) : null}
            {item.type === "figure" ? (
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {item.options?.map((o) => (
                  <button
                    key={o.key}
                    onClick={() => saveAnswer(item.code, { choice: o.key })}
                    aria-label={o.alt}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      padding: 12,
                      borderRadius: 8,
                      cursor: "pointer",
                      border: `1px solid ${a?.choice === o.key ? TS_BLUE : TS_BORDER}`,
                      background: a?.choice === o.key ? "#EEF3FE" : "#fff",
                      color: TS_BLACK,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: a?.choice === o.key ? TS_BLUE : TS_GRAY }}>{o.key}</span>
                    <span style={{ width: 70, height: 70, display: "block" }} dangerouslySetInnerHTML={{ __html: o.svg || "" }} />
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {item.options?.map((o) => (
                  <button
                    key={o.key}
                    onClick={() => saveAnswer(item.code, { choice: o.key })}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      textAlign: "left",
                      padding: "13px 15px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 14.5,
                      lineHeight: 1.5,
                      border: `1px solid ${a?.choice === o.key ? TS_BLUE : TS_BORDER}`,
                      background: a?.choice === o.key ? "#EEF3FE" : "#fff",
                      color: TS_BLACK,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: a?.choice === o.key ? TS_BLUE : TS_GRAY, minWidth: 14 }}>{o.key}</span>
                    <span>{o.text}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26, paddingTop: 20, borderTop: `1px solid ${TS_BORDER}` }}>
          <span style={{ fontSize: 12.5, color: TS_GRAY }}>
            Pregunta {ii + 1} de {block.items.length}
          </span>
          <button style={{ ...btn, opacity: answered ? 1 : 0.4, cursor: answered ? "pointer" : "not-allowed" }} disabled={!answered} onClick={next}>
            {ii + 1 === block.items.length && bi + 1 === blocks.length ? "Terminar y enviar" : "Siguiente"}
          </button>
        </div>
      </div>

      <p style={{ maxWidth: 720, margin: "16px auto 0", fontSize: 12, color: TS_GRAY, textAlign: "center" }}>
        Sus respuestas se guardan automáticamente.
      </p>
    </div>
  );
}
