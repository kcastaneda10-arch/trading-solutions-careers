"use client";

/**
 * INFORME DE VACANTE · la pantalla para prepararlo
 *
 * Se abre desde el funnel («📄 Informe»). Arma el informe con los datos del
 * momento, deja editar la frase y los próximos pasos, y desde acá se descarga
 * el PDF o se deja en Borradores de Gmail listo para enviar al líder.
 *
 * Antes de enviar conviene que los 10 primeros tengan su informe
 * interpretativo: sin él, su ficha breve solo muestra la fortaleza principal.
 * Se generan desde acá, uno por uno.
 */

import { useCallback, useEffect, useRef, useState } from "react";

type Top = { token: string; nombre: string; match: number; informe: unknown | null };
type Datos = {
  vacante: { titulo: string; dias: number; etapa: string };
  kpis: { aplicaron: number; presentaron: number; invitados: number; bandaSuperior: number };
  top10: Top[];
  fraseSugerida: string;
  pasosSugeridos: string[];
};

export default function InformeVacante({ params }: { params: { vacancyId: string } }) {
  const { vacancyId } = params;
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState("");
  const [frase, setFrase] = useState("");
  const [pasos, setPasos] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState<"" | "vista" | "descarga" | "borrador" | "ia">("");
  const [avance, setAvance] = useState("");
  const [borrador, setBorrador] = useState<{ abrir: string; buzon: string } | null>(null);
  const urlAnterior = useRef<string | null>(null);

  const cargar = useCallback(
    async (conservarTextos: boolean) => {
      setError("");
      const r = await fetch(`/api/admin/informe-vacante/${vacancyId}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo cargar");
      setDatos(j);
      if (!conservarTextos) {
        setFrase(j.fraseSugerida);
        setPasos((j.pasosSugeridos as string[]).join("\n"));
      }
      return j as Datos;
    },
    [vacancyId],
  );

  const cuerpo = () => ({ frase, pasos: pasos.split("\n").map((p) => p.trim()).filter(Boolean) });

  async function pedirPdf(): Promise<Blob> {
    const r = await fetch(`/api/admin/informe-vacante/${vacancyId}/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo()),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error(j.error || "No se pudo generar el PDF");
    }
    return r.blob();
  }

  async function verVista() {
    setTrabajando("vista");
    setError("");
    try {
      const b = await pedirPdf();
      const u = URL.createObjectURL(b);
      if (urlAnterior.current) URL.revokeObjectURL(urlAnterior.current);
      urlAnterior.current = u;
      setPdfUrl(u);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTrabajando("");
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await cargar(false);
      } catch (e: any) {
        setError(e.message);
      }
    })();
    return () => {
      if (urlAnterior.current) URL.revokeObjectURL(urlAnterior.current);
    };
  }, [cargar]);

  // La vista previa sale sola la primera vez que hay textos.
  useEffect(() => {
    if (datos && frase && !pdfUrl && !trabajando) void verVista();
  }, [datos]); // eslint-disable-line react-hooks/exhaustive-deps

  async function descargar() {
    setTrabajando("descarga");
    setError("");
    try {
      const b = await pedirPdf();
      const u = URL.createObjectURL(b);
      const a = document.createElement("a");
      const fecha = new Date().toLocaleDateString("en-CA");
      a.href = u;
      a.download = `Informe_${(datos?.vacante.titulo || "vacante").replace(/[^A-Za-z0-9]+/g, "_")}_${fecha}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(u), 4000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTrabajando("");
    }
  }

  async function crearBorrador() {
    setTrabajando("borrador");
    setError("");
    setBorrador(null);
    try {
      const r = await fetch(`/api/admin/informe-vacante/${vacancyId}/borrador`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo()),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo crear el borrador");
      setBorrador({ abrir: j.abrir, buzon: j.buzon });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTrabajando("");
    }
  }

  // Informe interpretativo de los 10 primeros que todavía no lo tienen. Uno
  // por uno: cada uno tarda entre medio minuto y dos.
  async function generarFaltantes() {
    if (!datos) return;
    const faltan = datos.top10.filter((t) => !t.informe);
    setTrabajando("ia");
    setError("");
    let hechos = 0;
    const fallas: string[] = [];
    for (const t of faltan) {
      setAvance(`Preparando el informe de ${t.nombre} · ${hechos + 1} de ${faltan.length}`);
      try {
        const r = await fetch(`/api/bateria/informe-ia/${t.token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          fallas.push(`${t.nombre}: ${j.error || r.status}`);
        }
      } catch (e: any) {
        fallas.push(`${t.nombre}: ${e.message}`);
      }
      hechos++;
    }
    setAvance("");
    if (fallas.length) setError(`No se pudieron preparar ${fallas.length}: ${fallas.join(" · ")}`);
    try {
      await cargar(true);
      await verVista();
    } finally {
      setTrabajando("");
    }
  }

  const conInforme = datos?.top10.filter((t) => t.informe).length ?? 0;
  const totalTop = datos?.top10.length ?? 0;

  return (
    <div className="max-w-[1400px] mx-auto px-5 py-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[2px] text-gray-500">Informe de vacante</div>
          <h1 className="text-2xl font-extrabold tracking-tight">{datos?.vacante.titulo || "…"}</h1>
          {datos && (
            <p className="text-sm text-gray-500">
              {datos.vacante.dias} días abierta · {datos.vacante.etapa} · {datos.kpis.presentaron} de {datos.kpis.invitados} presentaron las pruebas
            </p>
          )}
        </div>
        <a href="/hr-admin#funnel" className="ml-auto text-sm underline text-gray-600">
          ← Volver al funnel
        </a>
      </div>

      {error && <p className="mt-4 text-sm bg-red-50 border border-red-200 text-red-800 px-3 py-2">{error}</p>}

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
        {/* Controles */}
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[1.5px] text-gray-500">En una frase</label>
            <textarea
              value={frase}
              onChange={(e) => setFrase(e.target.value)}
              rows={5}
              className="mt-1 w-full border border-gray-300 px-2.5 py-2 text-[13px] leading-snug"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[1.5px] text-gray-500">Próximos pasos · uno por línea</label>
            <textarea
              value={pasos}
              onChange={(e) => setPasos(e.target.value)}
              rows={5}
              className="mt-1 w-full border border-gray-300 px-2.5 py-2 text-[13px] leading-snug"
            />
          </div>

          {totalTop > 0 && (
            <div className="border border-gray-200 p-3 bg-white">
              <div className="text-[10px] uppercase tracking-[1.5px] text-gray-500">Perfil breve de los {totalTop} primeros</div>
              <p className="text-[13px] mt-1">
                <b>{conInforme} de {totalTop}</b> tienen informe interpretativo.
                {conInforme < totalTop && " A los demás su ficha solo les muestra la fortaleza principal."}
              </p>
              {conInforme < totalTop && (
                <button
                  onClick={generarFaltantes}
                  disabled={Boolean(trabajando)}
                  className="mt-2 text-[12px] font-semibold px-3 py-1.5 border border-gray-900 disabled:opacity-40"
                >
                  {trabajando === "ia" ? "Preparando…" : `Preparar los ${totalTop - conInforme} que faltan`}
                </button>
              )}
              {avance && <p className="text-[12px] text-gray-500 mt-2">{avance}</p>}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={verVista}
              disabled={Boolean(trabajando)}
              className="text-[13px] font-semibold px-3 py-2 border border-gray-300 hover:border-gray-900 disabled:opacity-40"
            >
              {trabajando === "vista" ? "Actualizando…" : "Actualizar vista previa"}
            </button>
            <button
              onClick={descargar}
              disabled={Boolean(trabajando)}
              className="text-[13px] font-semibold px-3 py-2 border border-gray-900 disabled:opacity-40"
            >
              {trabajando === "descarga" ? "Generando…" : "Descargar PDF"}
            </button>
            <button
              onClick={crearBorrador}
              disabled={Boolean(trabajando)}
              className="text-[13px] font-semibold px-3 py-2 bg-black text-white disabled:opacity-40"
            >
              {trabajando === "borrador" ? "Creando borrador…" : "Crear borrador en Gmail"}
            </button>
          </div>

          {borrador && (
            <div className="text-[13px] bg-green-50 border border-green-200 text-green-900 px-3 py-2">
              Listo: el borrador con el PDF adjunto quedó en {borrador.buzon}, sin destinatario. Escribe el correo del líder
              y envíalo desde Gmail.{" "}
              <a href={borrador.abrir} target="_blank" rel="noreferrer" className="underline font-semibold">
                Abrir Borradores
              </a>
            </div>
          )}
          <p className="text-[11.5px] text-gray-400 leading-relaxed">
            El informe no incluye la validez de las pruebas, el razonamiento suelto ni nada del control de la sesión: son
            lecturas internas del equipo de Talent.
          </p>
        </div>

        {/* Vista previa */}
        <div className="border border-gray-200 bg-gray-100 min-h-[80vh]">
          {pdfUrl ? (
            <iframe src={pdfUrl} className="w-full h-[85vh]" title="Vista previa del informe" />
          ) : (
            <div className="p-6 text-sm text-gray-500">{trabajando ? "Generando la vista previa…" : "Cargando…"}</div>
          )}
        </div>
      </div>
    </div>
  );
}
