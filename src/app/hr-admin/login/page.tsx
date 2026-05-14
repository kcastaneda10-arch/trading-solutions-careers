"use client";

import React, { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";

const TS_HERO = "https://cdn.prod.website-files.com/68fb7b9474bf8f90808cd50f/691645b652c1e9091b25f59c_FotosWeb_TradingSolutions-14_4_11zon.webp";
const TS_LOGO_WHITE = "https://cdn.prod.website-files.com/68fb7b9474bf8f90808cd50f/6913594489519813fe9e620e_logo%20web-03.png";

export default function HRLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/hr-admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (r.ok) {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next") || "/hr-admin";
        window.location.href = next;
      } else {
        const j = await r.json().catch(() => ({}));
        setErr(j.error ?? "Clave incorrecta");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans" style={{ background: "#000" }}>
      {/* ── Lado izquierdo: hero TS full-bleed ── */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${TS_HERO})`,
            transform: "scale(1.05)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        {/* Contenido superpuesto — estilo hero del sitio TS */}
        <div className="relative z-10 flex flex-col justify-between p-10 text-white w-full">
          <div className="flex items-center gap-3">
            <img src={TS_LOGO_WHITE} alt="Trading Solutions" className="h-9 w-auto" />
          </div>

          <div>
            <div className="text-[10px] tracking-[3px] uppercase font-semibold opacity-70 mb-3">
              Talent Acquisition · Internal Tool
            </div>
            <h1 className="font-bold text-5xl lg:text-6xl tracking-[-0.03em] leading-[0.95]">
              Talent that<br />moves the world.
            </h1>
            <div className="flex items-center gap-3 mt-5 max-w-md">
              <div className="h-[1px] flex-1 bg-white/30" />
              <p className="text-sm font-medium opacity-80">
                Where vision meets execution.
              </p>
            </div>
          </div>

          <div className="text-[11px] opacity-60 font-medium">
            © Trading Solutions · 2026
          </div>
        </div>
      </div>

      {/* ── Lado derecho: form ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <form onSubmit={submit} className="w-full max-w-sm">
          {/* Logo móvil — solo visible en mobile */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <img src={TS_LOGO_WHITE} alt="Trading Solutions" className="h-10 w-auto invert" />
          </div>

          <div className="mb-7">
            <div className="text-[10px] tracking-[2.5px] uppercase font-semibold text-gray-500 mb-2">
              HR Admin
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.02em] leading-tight">
              Bienvenida.
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Acceso restringido · Equipo de Talent Acquisition.
            </p>
          </div>

          <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Clave de acceso
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              autoFocus
              className="w-full border border-gray-300 rounded-full px-10 py-3 text-sm focus:border-black focus:outline-none transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {err && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 mt-3">
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={!password || loading}
            className="w-full bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-full mt-5 py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Verificando…" : (
              <>
                Entrar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              ¿Sin acceso? Contacta a{" "}
              <a className="text-black hover:underline font-medium" href="mailto:jointheteam@tradingsolutions.com">
                jointheteam@tradingsolutions.com
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
