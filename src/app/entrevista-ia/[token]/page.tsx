"use client";

/**
 * /entrevista-ia/[token]
 *
 * Página candidate-facing de la entrevista por voz con IA.
 * Embebe el widget oficial de ElevenLabs Conversational AI.
 *
 * Flujo:
 *   1. Valida el token con GET /api/headhunting/ai-interview/[token]
 *   2. Pantalla de bienvenida + reglas
 *   3. Pantalla de Habeas Data + consentimiento de grabación
 *   4. Candidato acepta → carga widget de ElevenLabs
 *   5. Widget hace la conversación (15-20 min)
 *   6. Al terminar, llama a /finalize → Claude scoring
 *   7. Pantalla de "Gracias"
 */
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Script from "next/script";

type Phase = "loading" | "welcome" | "consent" | "live" | "ended" | "error";

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
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "agent-id"?: string;
          "signed-url"?: string;
          "dynamic-variables"?: string;
          variant?: string;
        },
        HTMLElement
      >;
    }
  }
}

export default function AiInterviewPage() {
  const params = useParams();
  const token = String(params?.token || "");
  const [phase, setPhase] = useState<Phase>("loading");
  const [config, setConfig] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [habeasChecked, setHabeasChecked] = useState(false);

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
          if (!j.agent_id) {
            setError("Configuración del agente incompleta. Contacta a kcastaneda@tradingsolutions.com");
            setPhase("error");
          } else {
            setPhase("welcome");
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

  // Listen for the widget's "Call ended" event so we can finalize
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      // ElevenLabs widget posts events to window
      const data = e.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "convai-call-ended" || data.event === "call_ended" || data.type === "call.ended") {
        finalizeInterview(data.conversation_id || data.conversationId || null);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function finalizeInterview(conversationId: string | null) {
    setPhase("ended");
    try {
      await fetch(`/api/headhunting/ai-interview/${token}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId }),
      });
    } catch (e) {
      console.error("finalize failed:", e);
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

  if (phase === "welcome") {
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
            onClick={() => setPhase("consent")}
            style={primaryBtn(false)}
          >
            Continuar →
          </button>
        </div>
      </div>
    );
  }

  if (phase === "consent") {
    const allChecked = consentChecked && habeasChecked;
    return (
      <div style={shell}>
        <div style={card}>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Antes de iniciar — autorización
          </h1>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
            Por favor lee y acepta para continuar.
          </p>

          {/* Habeas Data */}
          <div style={consentBox}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#1a1a1a" }}>
              📋 Tratamiento de datos personales (Habeas Data)
            </h3>
            <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
              Conforme a la <strong>Ley 1581 de 2012</strong> de Colombia y demás normas concordantes, autorizo a{" "}
              <strong>Trading Solutions S.A.S.</strong> al tratamiento de mis datos personales (incluida mi voz, transcripción y respuestas)
              con la finalidad de evaluar mi candidatura para la posición de{" "}
              <strong>{config?.vacancy?.title}</strong>. Los datos serán almacenados de forma segura, no se compartirán con terceros sin mi consentimiento expreso, y podré ejercer mis derechos de
              acceso, rectificación, actualización y supresión escribiendo a{" "}
              <a href="mailto:kcastaneda@tradingsolutions.com" style={{ color: "#2C64ED" }}>
                kcastaneda@tradingsolutions.com
              </a>.
            </p>
            <label style={checkboxLabel}>
              <input
                type="checkbox"
                checked={habeasChecked}
                onChange={(e) => setHabeasChecked(e.target.checked)}
                style={{ marginRight: 8, width: 18, height: 18, cursor: "pointer" }}
              />
              <span>Acepto el tratamiento de mis datos personales según los términos arriba descritos.</span>
            </label>
          </div>

          {/* Grabación */}
          <div style={consentBox}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#1a1a1a" }}>
              🎤 Consentimiento de grabación y procesamiento por IA
            </h3>
            <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
              Esta entrevista será <strong>grabada en audio</strong> y la conversación será procesada por sistemas de inteligencia artificial
              (ElevenLabs Conversational AI para la voz, y Anthropic Claude para el análisis posterior). La transcripción y el audio se usarán
              <strong> únicamente para el proceso de selección de Trading Solutions</strong> y serán evaluados por personal humano antes de cualquier decisión.
              No se utilizará la grabación para ningún otro propósito sin mi autorización adicional.
            </p>
            <label style={checkboxLabel}>
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                style={{ marginRight: 8, width: 18, height: 18, cursor: "pointer" }}
              />
              <span>Autorizo la grabación y el procesamiento por IA de esta entrevista.</span>
            </label>
          </div>

          <button
            onClick={() => allChecked && setPhase("live")}
            disabled={!allChecked}
            style={primaryBtn(!allChecked)}
          >
            🎤 Iniciar entrevista
          </button>
          <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 12 }}>
            Al iniciar, tu navegador te pedirá permiso para usar el micrófono.
          </p>
        </div>
      </div>
    );
  }

  // phase === "live" — render the ElevenLabs widget
  return (
    <div style={shell}>
      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
        type="text/javascript"
      />
      <div style={{ ...card, maxWidth: 600 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={logoBox}>TS</div>
          <div>
            <div style={{ fontWeight: 700 }}>Entrevista en curso</div>
            <div style={{ fontSize: 11, color: "#10b981" }}>● Conectado con Valeria</div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16 }}>
          Habla con naturalidad. La IA está escuchando. Para terminar, presiona el botón rojo dentro del widget.
        </p>

        {/* ElevenLabs widget */}
        <div style={{ minHeight: 400 }}>
          {config?.signed_url ? (
            <elevenlabs-convai
              signed-url={config.signed_url}
              dynamic-variables={JSON.stringify(config.dynamic_variables)}
            />
          ) : (
            <elevenlabs-convai
              agent-id={config?.agent_id || ""}
              dynamic-variables={JSON.stringify(config?.dynamic_variables || {})}
            />
          )}
        </div>

        <button
          onClick={() => finalizeInterview(null)}
          style={{
            marginTop: 20,
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            border: "1.5px solid #dc2626",
            color: "#dc2626",
            background: "transparent",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          He terminado la entrevista
        </button>
      </div>
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

const consentBox: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 16,
  marginBottom: 14,
};

const checkboxLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  marginTop: 10,
  cursor: "pointer",
  fontSize: 12,
  color: "#1a1a1a",
  fontWeight: 600,
  lineHeight: 1.4,
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
