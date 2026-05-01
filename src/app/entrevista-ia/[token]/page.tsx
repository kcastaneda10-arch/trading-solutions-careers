"use client";

/**
 * /entrevista-ia/[token]
 *
 * Página candidate-facing de la entrevista por voz con IA.
 * Embebe el widget de ElevenLabs Conversational AI.
 *
 * Flujo:
 *   1. Valida el token con GET /api/headhunting/ai-interview/[token]
 *   2. Muestra pantalla de bienvenida + reglas
 *   3. Candidato presiona "Iniciar entrevista" — pide permiso de micrófono
 *   4. Se conecta al agente de ElevenLabs vía SDK
 *   5. Conversación en tiempo real (15-20 min)
 *   6. Al terminar, llama a /finalize con conversation_id → Claude scoring
 *   7. Pantalla de "Gracias, te contactaremos en 2-3 días"
 */
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

type Phase = "loading" | "ready" | "in_progress" | "ended" | "error";

type Config = {
  interview_id: string;
  candidate: { id: string; name: string; email: string };
  vacancy: { title: string; area: string } | null;
  client: { name: string };
  agent_id: string | null;
  signed_url: string | null;
  dynamic_variables: Record<string, string>;
};

declare global {
  interface Window {
    Conversation?: {
      startSession: (opts: {
        signedUrl?: string;
        agentId?: string;
        dynamicVariables?: Record<string, string>;
        onConnect?: () => void;
        onDisconnect?: () => void;
        onError?: (e: unknown) => void;
        onMessage?: (m: { source: string; message: string }) => void;
        onModeChange?: (m: { mode: string }) => void;
      }) => Promise<{
        endSession: () => Promise<void>;
        getId: () => string;
      }>;
    };
  }
}

export default function AiInterviewPage() {
  const params = useParams();
  const token = String(params?.token || "");
  const [phase, setPhase] = useState<Phase>("loading");
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{ source: string; message: string }[]>([]);
  const [agentMode, setAgentMode] = useState<string>("idle");
  const conversationRef = useRef<{ endSession: () => Promise<void>; getId: () => string } | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load ElevenLabs SDK
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Conversation) {
      setScriptLoaded(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://unpkg.com/@11labs/client@0.1.4/dist/lib.umd.js";
    s.async = true;
    s.onload = () => {
      // The SDK exposes itself as `ElevenLabsConvai` or similar global
      // Try a few common globals
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (w.ElevenLabsConvai?.Conversation) window.Conversation = w.ElevenLabsConvai.Conversation;
      else if (w.Conversation) window.Conversation = w.Conversation;
      else if (w["@11labs/client"]?.Conversation) window.Conversation = w["@11labs/client"].Conversation;
      setScriptLoaded(true);
    };
    s.onerror = () => setError("No se pudo cargar el SDK de voz. Recarga la página.");
    document.body.appendChild(s);
    return () => {
      try { document.body.removeChild(s); } catch {}
    };
  }, []);

  // Validate token
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/headhunting/ai-interview/${token}`, { cache: "no-store" });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          if (!cancelled) {
            setError(
              j.error === "expired_token" ? "Este enlace expiró. Contacta a kcastaneda@tradingsolutions.com" :
              j.error === "already_completed" ? "Ya completaste esta entrevista. Te contactaremos pronto." :
              j.error === "invalid_token" ? "Enlace inválido. Verifica que copiaste la URL completa." :
              "Error: " + (j.error || r.status)
            );
            setPhase("error");
          }
          return;
        }
        const j = await r.json();
        if (!cancelled) {
          setConfig(j);
          if (!j.agent_id || !j.signed_url) {
            setError("Configuración del agente incompleta. Contacta a kcastaneda@tradingsolutions.com");
            setPhase("error");
          } else {
            setPhase("ready");
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setPhase("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  async function startInterview() {
    if (!config || !window.Conversation) return;
    try {
      // Request mic permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const conv = await window.Conversation.startSession({
        signedUrl: config.signed_url || undefined,
        agentId: config.signed_url ? undefined : (config.agent_id || undefined),
        dynamicVariables: config.dynamic_variables,
        onConnect: () => setPhase("in_progress"),
        onDisconnect: () => finalizeInterview(conv?.getId() || null),
        onError: (e) => {
          console.error("Conversation error:", e);
          setError("Error en la conversación: " + String(e));
        },
        onMessage: (m) => {
          setTranscript((prev) => [...prev, m]);
        },
        onModeChange: (m) => setAgentMode(m.mode),
      });
      conversationRef.current = conv;
    } catch (e) {
      console.error("startSession error:", e);
      setError("No se pudo iniciar la entrevista: " + (e as Error).message + ". Verifica que diste permiso al micrófono.");
    }
  }

  async function finalizeInterview(conversationId: string | null) {
    setPhase("ended");
    try {
      await fetch(`/api/headhunting/ai-interview/${token}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          transcript: transcript.length > 0 ? transcript : null,
        }),
      });
    } catch (e) {
      console.error("finalize failed:", e);
    }
  }

  async function endManually() {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
      } catch (e) {
        console.error("endSession error:", e);
      }
    }
  }

  // ─── Render ────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div style={shell}>
        <div style={card}>
          <p style={{ textAlign: "center", color: "#6b7280" }}>Cargando entrevista…</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div style={shell}>
        <div style={card}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#dc2626" }}>No se puede continuar</h1>
          <p style={{ marginTop: 12, color: "#374151" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (phase === "ended") {
    return (
      <div style={shell}>
        <div style={card}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>¡Entrevista completada!</h1>
          <p style={{ color: "#374151", lineHeight: 1.6 }}>
            Gracias por tu tiempo, <strong>{config?.candidate.name?.split(" ")[0]}</strong>. Estamos analizando tu entrevista.
          </p>
          <p style={{ marginTop: 12, color: "#374151", lineHeight: 1.6 }}>
            Kelly Castañeda te contactará en los próximos <strong>2-3 días hábiles</strong> con la siguiente etapa del proceso.
          </p>
          <p style={{ marginTop: 24, fontSize: 12, color: "#9ca3af", textAlign: "center" }}>
            Puedes cerrar esta ventana.
          </p>
        </div>
      </div>
    );
  }

  if (phase === "ready") {
    return (
      <div style={shell}>
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={logoBox}>TS</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>TRADING SOLUTIONS</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Entrevista por voz con IA</div>
            </div>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            Hola, {config?.candidate.name?.split(" ")[0]}
          </h1>
          <p style={{ color: "#374151", lineHeight: 1.6 }}>
            Vas a tener una conversación con nuestra recruiter virtual sobre la posición de{" "}
            <strong>{config?.vacancy?.title}</strong>.
          </p>

          <h3 style={{ marginTop: 24, marginBottom: 8, fontSize: 13, textTransform: "uppercase", color: "#6b7280", letterSpacing: 0.5 }}>
            Antes de empezar
          </h3>
          <ul style={{ paddingLeft: 20, color: "#374151", lineHeight: 1.7 }}>
            <li>Ponte audífonos si tienes</li>
            <li>Busca un espacio tranquilo, sin interrupciones</li>
            <li>Habla con naturalidad — la IA escucha en tiempo real</li>
            <li>Responde con ejemplos concretos (situaciones reales)</li>
            <li>Habrá una sección corta en inglés al final</li>
            <li>Duración total: <strong>15-20 minutos</strong></li>
            <li>Una sola oportunidad — termina la entrevista de un tirón</li>
          </ul>

          <button
            onClick={startInterview}
            disabled={!scriptLoaded}
            style={primaryBtn(!scriptLoaded)}
          >
            {scriptLoaded ? "🎤 Iniciar entrevista" : "Cargando…"}
          </button>
          <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 12 }}>
            Al hacer click, autorizas el uso de tu micrófono para esta sesión únicamente.
          </p>
        </div>
      </div>
    );
  }

  // in_progress
  return (
    <div style={shell}>
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ ...logoBox, animation: agentMode === "speaking" ? "pulse 1.4s infinite" : undefined }}>TS</div>
          <div>
            <div style={{ fontWeight: 700 }}>Entrevista en curso</div>
            <div style={{ fontSize: 11, color: "#10b981" }}>
              {agentMode === "speaking" ? "● IA hablando…" : agentMode === "listening" ? "● Escuchando…" : "● Conectado"}
            </div>
          </div>
        </div>

        {/* Live transcript preview */}
        <div style={{
          maxHeight: 320, overflowY: "auto", background: "#f9fafb",
          borderRadius: 8, padding: 16, fontSize: 13, lineHeight: 1.6,
          border: "1px solid #e5e7eb",
        }}>
          {transcript.length === 0 ? (
            <p style={{ color: "#9ca3af", fontStyle: "italic" }}>La transcripción aparecerá aquí mientras hablan…</p>
          ) : (
            transcript.map((m, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <strong style={{ color: m.source === "user" ? "#2C64ED" : "#1a1a1a" }}>
                  {m.source === "user" ? "Tú" : "Recruiter"}:
                </strong>{" "}
                <span>{m.message}</span>
              </div>
            ))
          )}
        </div>

        <button onClick={endManually} style={{
          marginTop: 20, width: "100%", padding: "12px", borderRadius: 8,
          border: "1.5px solid #dc2626", color: "#dc2626", background: "transparent",
          fontWeight: 600, cursor: "pointer", fontSize: 13,
        }}>
          Terminar entrevista
        </button>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(44,100,237,0.5); }
          50% { box-shadow: 0 0 0 12px rgba(44,100,237,0); }
        }
      `}</style>
    </div>
  );
}

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #f5f5f5 0%, #ebebeb 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
};

const card: React.CSSProperties = {
  background: "white",
  borderRadius: 16,
  padding: 36,
  maxWidth: 560,
  width: "100%",
  boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
};

const logoBox: React.CSSProperties = {
  width: 40,
  height: 40,
  background: "#1a1a1a",
  color: "white",
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: 13,
};

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    marginTop: 24,
    padding: 16,
    background: disabled ? "#9ca3af" : "#1a1a1a",
    color: "white",
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}
