"use client";

import React, { useState } from "react";
import { Lock } from "lucide-react";

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
        // Volver al /hr-admin o al url original si vino con ?next=
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
    <div className="min-h-screen bg-[#EBEBEB] flex items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center font-extrabold mb-3">
            TS
          </div>
          <h1 className="text-xl font-bold tracking-tight">HR Admin</h1>
          <p className="text-xs text-gray-500 mt-1">Trading Solutions · Acceso restringido</p>
        </div>

        <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 mb-1">
          <Lock className="w-3 h-3" />
          Clave de acceso
        </label>
        <input
          type="password"
          autoFocus
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-black outline-none"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {err && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800 mt-3">
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={!password || loading}
          className="w-full pill-btn pill-btn-primary text-sm mt-5 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ padding: "12px 18px" }}
        >
          {loading ? "Verificando…" : "Entrar"}
        </button>

        <p className="text-[11px] text-gray-400 text-center mt-5">
          Si no tienes la clave, contacta a{" "}
          <a className="underline" href="mailto:kcastaneda@tradingsolutions.com">
            kcastaneda@tradingsolutions.com
          </a>
        </p>
      </form>
    </div>
  );
}
