"use client";

/**
 * INFORME DEL CANDIDATO · DESPUÉS DE LAS PRUEBAS
 *
 * Una persona, todas las pruebas que se le aplicaron —las propias y las de
 * los seis proveedores— y qué significan leídas juntas. El informe de
 * vacante que ya existe cuenta cómo va la búsqueda; este cuenta quién es el
 * candidato. Son dos y no se pisan.
 *
 * Tres cosas que conviene saber antes de tocar este archivo:
 *
 * 1. El % de match sale solo de la batería propia. Las externas se muestran
 *    completas pero no entran al número. La razón está escrita en
 *    src/lib/informe-candidato.ts y no es decorativa.
 * 2. El filtro por vista lo hace el servidor, no esta pantalla. Aquí no hay
 *    un `if (vista === 'lider') ocultar`: lo que no corresponde sencillamente
 *    no llega.
 * 3. Lo que falta también se imprime. Un informe que solo muestra lo que sí
 *    se midió se lee como si el expediente estuviera completo, y así es como
 *    se decide con media evidencia creyendo que es toda.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { VISTAS, type Vista } from "@/lib/informe-candidato";

type Externa = {
  key: string; nombre: string; categoria: string | null; via: string;
  estado: string; estadoLabel: string; presentadaEl: string | null;
  puntajes: Record<string, unknown> | null; resumen: string | null;
  soporte: string | null; cargadoPor: string | null; notas: string | null;
};
type Hallazgo = { senal: string; titulo: string; texto: string };
type Informe = any;

const CHIP: Record<string, string> = {
  cargada: "ok", sin_presentar: "bad", sin_verificar: "warn",
  pendiente: "mute", no_aplica: "mute",
};
const SENAL: Record<string, { txt: string; cls: string }> = {
  convergente: { txt: "Converge", cls: "ok" },
  contradictoria: { txt: "Contradice", cls: "warn" },
  alerta: { txt: "Punto de cuidado", cls: "bad" },
  hueco: { txt: "Falta evidencia", cls: "mute" },
};
const VALIDEZ: Record<string, { txt: string; cls: string }> = {
  sin_alertas: { txt: "Sin alertas", cls: "ok" },
  con_reservas: { txt: "Con reservas", cls: "warn" },
  no_interpretable: { txt: "No interpretable", cls: "bad" },
};
/** La vista del CEO abre con la decisión que se le está pidiendo, no con una
 *  descripción. Un informe que describe y no pide nada se lee y no se
 *  responde. */
const PIDE: Record<string, { txt: string }> = {
  avanzar: { txt: "Se pide avanzar con este candidato." },
  entrevistar_con_reservas: { txt: "Se pide entrevistarlo, con reservas." },
  no_avanzar: { txt: "Se pide cerrar su proceso." },
  no_concluyente: { txt: "No hay con qué concluir todavía." },
};

const VEREDICTO_ENTREVISTA: Record<string, { txt: string; cls: string }> = {
  pass: { txt: "Pasa", cls: "ok" },
  partial: { txt: "Parcial", cls: "warn" },
  fail: { txt: "No pasa", cls: "bad" },
};

const PRINCIPIO: Record<string, string> = {
  pass: "ok", partial: "warn", fail: "bad", data: "mute", not_probed: "mute",
};

const SUFICIENCIA: Record<string, { txt: string; cls: string }> = {
  para_decidir: { txt: "Alcanza para decidir", cls: "ok" },
  para_entrevistar: { txt: "Alcanza para entrevistar", cls: "warn" },
  insuficiente: { txt: "Insuficiente", cls: "bad" },
};

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** La fecha se lee del texto, no se convierte a hora local.
 *  Una prueba guardada como 2026-10-08 sale de la base a medianoche UTC, y en
 *  Colombia eso es el 7 a las 7 p. m.: el informe mostraba un día menos. Aquí
 *  no interesa la hora, interesa el día que alguien escribió. */
function fecha(iso: string | null | undefined) {
  if (!iso) return "—";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "—";
  return `${Number(m[3])} de ${MESES[Number(m[2]) - 1]}`;
}

/** Barras con marca de referencia. La marca es la referencia del cargo; la
 *  distancia a ella es lo que mueve el match, no el valor absoluto. */
function Barras({ filas, max = 100, sufijo = "" }: {
  filas: { label: string; valor: number | null; referencia?: number | null }[];
  max?: number; sufijo?: string;
}) {
  return (
    <div className="bh">
      {filas.map((f) => {
        const pct = f.valor == null ? 0 : Math.max(0, Math.min(100, (f.valor / max) * 100));
        const ref = f.referencia == null ? null : Math.max(0, Math.min(100, (f.referencia / max) * 100));
        return (
          <div className="bh-row" key={f.label}>
            <div className="bh-lab">{f.label}</div>
            <div className="bh-track" role="img"
              aria-label={`${f.label}: ${f.valor ?? "sin dato"}${f.referencia != null ? `, referencia ${f.referencia}` : ""}`}>
              <div className="bh-fill" style={{ width: `${pct}%` }} />
              {ref != null && <div className="bh-ref" style={{ left: `${ref}%` }} />}
            </div>
            <div className="bh-val">
              {f.valor == null ? "—" : f.valor}{f.valor == null ? "" : sufijo}
              {f.referencia != null && <span className="bh-ref-txt"> / {f.referencia}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function InformeDelCandidato({ params }: { params: { candidateId: string } }) {
  const [vista, setVista] = useState<Vista>("talent");
  const [d, setD] = useState<Informe | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true); setError("");
    try {
      const r = await fetch(`/api/admin/candidates/${params.candidateId}/informe-pruebas?vista=${vista}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo leer el informe");
      setD(j);
    } catch (e: any) { setError(e.message); } finally { setCargando(false); }
  }, [params.candidateId, vista]);

  useEffect(() => { cargar(); }, [cargar]);

  const esCeo = vista === "ceo";
  const iniciales = useMemo(() => {
    const n = (d?.candidato?.nombre ?? "").split(" ").filter(Boolean);
    return ((n[0]?.[0] ?? "") + (n[1]?.[0] ?? "")).toUpperCase() || "··";
  }, [d]);

  if (cargando) return <div className="wrap"><p className="mut">Armando el informe…</p><style>{CSS}</style></div>;
  if (error) return <div className="wrap"><div className="aviso bad">{error}</div><style>{CSS}</style></div>;
  if (!d) return null;

  const L = d.lectura;
  const bat = d.bateria;
  const suf = L?.suficiencia ? SUFICIENCIA[L.suficiencia.alcanza] : null;

  return (
    <>
      <div className="barra no-print">
        <span className="lbl">Informe después de las pruebas</span>
        {VISTAS.map((v) => (
          <button key={v.key} title={v.para}
            className={`pick ${vista === v.key ? "on" : ""}`}
            onClick={() => setVista(v.key)}>{v.label}</button>
        ))}
        <span className="sp" />
        <button className="pick" onClick={() => window.print()}>Descargar PDF</button>
      </div>

      <header className="hero">
        <div className="hero-in">
          <div className="eyebrow">/ INFORME DE CANDIDATO · DESPUÉS DE LAS PRUEBAS /</div>
          <div className="hero-row">
            <div className="avatar">{iniciales}</div>
            <div>
              <h1>{d.candidato.nombre}</h1>
              {d.candidato.titular && <p className="hero-sub">{d.candidato.titular}{d.candidato.empresa ? ` · ${d.candidato.empresa}` : ""}</p>}
              <p className="hero-role">
                Aplicó a <strong>{d.cargo.nombre}</strong>
                {d.cargo.descripcion ? ` · ${d.cargo.descripcion}` : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="wrap">
        {d.sinPerfil && (
          <div className="aviso warn">
            Esta vacante todavía no tiene perfil de cargo en el catálogo, así que no hay contra qué
            calcular el match. El informe muestra lo que se midió, sin comparación.
          </div>
        )}
        {!bat && (
          <div className="aviso warn">
            Esta persona no tiene batería propia presentada. Lo que sigue son solo las pruebas externas.
          </div>
        )}

        {/* ── Veredicto ───────────────────────────────── */}
        <section className="shelf">
          <div className="eyebrow">/ VEREDICTO /</div>
          <h2>Lo que dice la batería interna.</h2>
          <p className="sub">
            El porcentaje sale <strong>solo</strong> de la batería propia, que es la única prueba con un
            perfil de cargo versionado detrás. Las pruebas externas no entran a este número: entran como
            evidencia que lo confirma o lo pone en duda, más abajo.
          </p>
          <div className="g3">
            <div className="card">
              <h3>Match con {d.cargo.nombre}</h3>
              <div className="cs">{d.cargo.version ? `Perfil ${d.cargo.version}` : "Sin perfil de referencia"}</div>
              {bat?.match != null ? (
                <div className="meter">
                  <div className="meter-num">{bat.match}<span className="pc">%</span></div>
                  <div className="meter-body">
                    <div className="meter-track"><div className="meter-fill" style={{ width: `${bat.match}%` }} /></div>
                    <div className="meter-sub">Banda {bat.banda ?? "—"} · presentada el {fecha(bat.presentadaEl)}</div>
                  </div>
                  <span className={`chip ${bat.apto ? "ok" : "warn"}`}>{bat.apto ? "Dentro de banda" : "Bajo banda"}</span>
                </div>
              ) : <p className="mut">Sin match calculado.</p>}
            </div>

            {bat?.validez && (
              <div className="card">
                <h3>Validez de la medición</h3>
                <div className="cs">Si esto falla, lo de arriba no se lee</div>
                <span className={`chip big ${VALIDEZ[bat.validez.veredicto]?.cls ?? "mute"}`}>
                  {VALIDEZ[bat.validez.veredicto]?.txt ?? "Sin calcular"}
                </span>
                <p className="mini">Duración {bat.validez.duracionMin ?? "—"} min</p>
              </div>
            )}

            <div className="card">
              <h3>Completitud del expediente</h3>
              <div className="cs">Cuántas pruebas tienen resultado</div>
              <div className="big-num">{d.completitud.conResultado}<span className="de"> de {d.completitud.aplicables}</span></div>
              {suf
                ? <p className="mini"><span className={`chip ${suf.cls}`}>{suf.txt}</span> {L.suficiencia.texto}</p>
                : <p className="mini">{d.completitud.aplicables - d.completitud.conResultado === 0
                    ? "Expediente completo."
                    : `Faltan ${d.completitud.aplicables - d.completitud.conResultado}.`}</p>}
            </div>
          </div>
        </section>

        {/* ── La página del CEO ───────────────────────── */}
        {esCeo && (
          <>
            {L?.conclusion && (
              <section className="shelf">
                <div className="eyebrow">/ LA DECISIÓN QUE SE PIDE /</div>
                <h2 className="pide">{PIDE[L.conclusion.recomendacion]?.txt ?? "Revisar el caso"}</h2>
                <p className="sub">{L.conclusion.texto}</p>
              </section>
            )}

            <section className="shelf">
              <div className="eyebrow">/ CONTRA QUIÉN COMPITE /</div>
              <h2>Los demás de este proceso.</h2>
              {d.terna.length > 1 ? (
                <>
                  <p className="sub">
                    {d.contexto.posicion === 1
                      ? "Es el mejor puntaje del proceso."
                      : `Va de ${d.contexto.posicion} entre ${d.terna.length} que presentaron la batería.`}{" "}
                    Diferencias de cinco puntos o menos no ordenan a nadie: son un empate.
                  </p>
                  <table className="tbl">
                    <thead><tr><th>Candidato</th><th>Match</th><th>Banda</th></tr></thead>
                    <tbody>
                      {d.terna.map((t: any) => (
                        <tr key={t.id} style={t.esEste ? { background: "#F3F4F6", fontWeight: 600 } : undefined}>
                          <td className="nm">{t.nombre}{t.esEste && " ←"}</td>
                          <td>{t.match}%</td>
                          <td>{t.apto ? "Dentro de banda" : <span className="mut">Bajo banda</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="sub">
                  Es el único del proceso con la batería presentada, así que este porcentaje no
                  se puede comparar con nadie todavía. Un número solo no dice si es bueno:
                  dice que es el que hay.
                </p>
              )}
            </section>

            {!!(L?.oportunidades ?? []).length && (
              <section className="shelf">
                <div className="eyebrow">/ QUÉ RIESGO SE ASUME /</div>
                <h2>Lo que habría que vigilar si entra.</h2>
                <ol className="lst grande">
                  {L.oportunidades.slice(0, 3).map((o: any, i: number) => (
                    <li key={i}><strong>{o.titulo}</strong> {o.detalle}</li>
                  ))}
                </ol>
              </section>
            )}

            <section className="shelf">
              <div className="eyebrow">/ EL COSTO DE NO DECIDIR /</div>
              <h2>Dónde está la búsqueda.</h2>
              <div className="g3">
                <div className="card">
                  <div className="big-num">{d.contexto.diasAbierta ?? "—"}<span className="de"> días</span></div>
                  <p className="mini">lleva abierta la vacante</p>
                </div>
                <div className="card">
                  <div className="big-num">{d.contexto.activos}</div>
                  <p className="mini">candidatos siguen vivos en el proceso</p>
                </div>
                <div className="card">
                  <div className="big-num">{d.contexto.conBateria}</div>
                  <p className="mini">
                    llegaron a presentar la batería{d.contexto.conBateria <= 2
                      ? " · si esta opción se cae, la búsqueda vuelve casi al principio"
                      : ""}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── Qué se le aplicó ────────────────────────── */}
        {!esCeo && (
          <section className="shelf">
            <div className="eyebrow">/ QUÉ SE LE APLICÓ /</div>
            <h2>Todas las pruebas, incluidas las que faltan.</h2>
            <p className="sub">
              Un informe que solo muestra lo que sí se midió se lee como si el expediente estuviera
              completo. Las filas sin resultado son parte de lo que hay que saber.
            </p>
            <table className="tbl">
              <thead><tr><th>Prueba</th><th>Mide</th><th>Estado</th><th>Fecha</th><th>Resultado</th></tr></thead>
              <tbody>
                {bat && (
                  <tr className="propia">
                    <td className="nm">Batería interna TS</td>
                    <td className="mut">integral</td>
                    <td><span className="chip ok">Resultado cargado</span></td>
                    <td className="mut">{fecha(bat.presentadaEl)}</td>
                    <td>{bat.match != null ? `Match ${bat.match}%` : "Sin match"}</td>
                  </tr>
                )}
                {d.externas.map((e: Externa) => (
                  <tr key={e.key}>
                    <td className="nm">{e.nombre}</td>
                    <td className="mut">{e.categoria ?? "—"}</td>
                    <td><span className={`chip ${CHIP[e.estado] ?? "mute"}`}>{e.estadoLabel}</span></td>
                    <td className="mut">{e.presentadaEl ? fecha(e.presentadaEl) : "—"}</td>
                    <td>
                      {e.resumen ?? <span className="mut">—</span>}
                      {/* El enlace solo cuando hay algo que abrir. Antes caía al
                          portal del proveedor y hasta las filas «no aplica»
                          mostraban «soporte», que invita a un clic vacío. */}
                      {e.estado === "cargada" && e.soporte && (
                        <> · <a href={e.soporte} target="_blank" rel="noopener noreferrer">soporte</a></>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* ── Cómo se mide ────────────────────────────── */}
        {!esCeo && d.cargo.pesos && (
          <section className="shelf">
            <div className="eyebrow">/ CÓMO SE MIDE /</div>
            <h2>La batería interna, explicada.</h2>
            <p className="sub">
              172 ítems en una sola sesión. Mide cinco cosas y las compara contra un perfil de referencia
              del cargo que vive en el código con control de versiones, no en la cabeza de quien evalúa.
              Cada número lleva de dónde sale: es lo primero que se pide cuando alguien impugna un descarte.
            </p>
            <div className="g2">
              <div className="card">
                <h3>Qué pesa y cuánto, en este cargo</h3>
                <div className="cs">Los pesos cambian por cargo</div>
                <Barras max={50} sufijo="%" filas={Object.entries(d.cargo.pesos).map(([k, v]) => ({
                  label: k[0].toUpperCase() + k.slice(1), valor: Math.round(Number(v) * 100),
                }))} />
                <p className="mini just">{d.cargo.fundamentoPesos}</p>
              </div>
              <div className="card">
                <h3>Compatibilidad rasgo por rasgo</h3>
                <div className="cs">Barra = el candidato · marca = la referencia del cargo</div>
                <Barras filas={(bat?.rasgos ?? []).map((r: any) => ({
                  label: r.label, valor: r.valor, referencia: r.referencia,
                }))} />
                <p className="mini">
                  La distancia a la marca es lo que mueve el match, no el valor absoluto. Un rasgo por
                  encima de la referencia también resta.
                </p>
              </div>
            </div>
            {bat?.pisos && (
              <div className="card full">
                <h3>Los pisos</h3>
                <div className="cs">Por debajo de esto se marca alerta, no solo baja el puntaje</div>
                <Barras filas={[
                  { label: "Razonamiento", valor: bat.pisos.razonamiento.valor, referencia: bat.pisos.razonamiento.piso },
                  { label: "Integridad", valor: bat.pisos.integridad.valor, referencia: bat.pisos.integridad.piso },
                ]} />
                <p className="mini">Un piso no se compensa con otra escala alta: si no lo pasa, el informe lo
                dice aunque el match salga bien.</p>
              </div>
            )}
          </section>
        )}

        {/* ── Nuestro DISC ────────────────────────────── */}
        {!esCeo && bat?.disc && (
          <section className="shelf">
            <div className="eyebrow">/ NUESTRO DISC /</div>
            <h2>Estilo de trabajo{bat.disc.patronNombre ? `: ${bat.disc.patronNombre}.` : "."}</h2>
            <p className="sub">
              {bat.disc.patronDescripcion}{bat.disc.patronDescripcion ? " " : ""}
              Este es el DISC de nuestra batería, con sus tres gráficas. El DISC de los
              proveedores va aparte y <strong>no se compara eje por eje con este</strong>: son
              instrumentos distintos, con bancos de ítems y baremos propios, y los dos son
              ipsativos — dicen qué eje pesa más dentro de la persona, no cuánto tiene frente a
              los demás. Lo que sí se compara son afirmaciones de conducta, y eso está en la
              lectura cruzada.
            </p>
            <div className="g3">
              {bat.disc.graficas.map((g: any) => (
                <div className="card" key={g.key}>
                  <h3>{g.label}</h3>
                  <div className="cs">{g.ayuda}</div>
                  <Barras max={7} filas={g.ejes.map((e: any) => ({
                    label: e.eje, valor: e.seg, referencia: e.referencia,
                  }))} />
                </div>
              ))}
            </div>
            <p className="mini">Escala de 1 a 7 segmentos. La marca en «Natural» es la referencia del cargo.</p>
          </section>
        )}

        {/* ── La entrevista inicial ───────────────────── */}
        {!esCeo && (
          <section className="shelf">
            <div className="eyebrow">/ ENTREVISTA INICIAL /</div>
            <h2>Lo que contó que hizo.</h2>
            <p className="sub">
              Las pruebas miden lo que la persona dice de sí misma respondiendo escalas. La
              entrevista registra lo que contó que hizo, con situación y cita. Es conducta
              observada: lo único del expediente que puede confirmar o tumbar un puntaje.
            </p>
            {!d.entrevista ? (
              <div className="aviso">
                Todavía no se le ha hecho la entrevista inicial, o el transcript no se ha pegado
                en el ATS. Mientras no esté, todo lo que dice este informe sale de escalas:
                sirve para decidir a quién entrevistar, no para decidir a quién contratar.
              </div>
            ) : (
              <>
                <div className="g3">
                  <div className="card">
                    <h3>Veredicto de la entrevista</h3>
                    <div className="cs">
                      {fecha(d.entrevista.fecha)}
                      {d.entrevista.duracionMin ? ` · ${d.entrevista.duracionMin} min` : ""}
                    </div>
                    <span className={`chip big ${VEREDICTO_ENTREVISTA[d.entrevista.verdict]?.cls ?? "mute"}`}>
                      {VEREDICTO_ENTREVISTA[d.entrevista.verdict]?.txt ?? "Sin veredicto"}
                    </span>
                    {!d.entrevista.revisadaPorHumano && d.entrevista.porIA && (
                      <p className="mini">Parseada por IA y todavía sin revisión de una persona.</p>
                    )}
                  </div>
                  <div className="card">
                    <h3>Inglés</h3>
                    <div className="cs">Lo que dijo contra lo que se oyó</div>
                    <p className="mini" style={{ marginTop: 0 }}>
                      Declarado: <strong>{d.entrevista.ingles.declarado ?? "—"}</strong><br />
                      Observado: <strong>{d.entrevista.ingles.real ?? "—"}</strong>
                      {d.entrevista.ingles.veredicto ? ` · ${d.entrevista.ingles.veredicto}` : ""}
                    </p>
                  </div>
                  <div className="card">
                    <h3>Qué falta indagar</h3>
                    <div className="cs">Para la siguiente conversación</div>
                    {(d.entrevista.porIndagar ?? []).length
                      ? <ul className="lst">{d.entrevista.porIndagar.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
                      : <p className="mini" style={{ marginTop: 0 }}>Nada marcado.</p>}
                  </div>
                </div>

                {d.entrevista.resumen && <p className="sub" style={{ marginTop: 18 }}>{d.entrevista.resumen}</p>}

                <div className="card full">
                  <h3>Los 16 principios</h3>
                  <div className="cs">
                    «No se preguntó» no es un «no cumple»: es un tema que la entrevista no tocó
                  </div>
                  <div className="prin">
                    {d.entrevista.principios.map((p: any) => (
                      <div className={`prin-row ${PRINCIPIO[p.puntaje]}`} key={p.num}
                        title={p.evidencia ?? ""}>
                        <span className={`chip ${PRINCIPIO[p.puntaje]}`}>{p.puntajeLabel}</span>
                        <div>
                          <strong>{p.num}. {p.label}</strong>
                          {p.soloDato && <span className="mut"> · solo dato, no es criterio</span>}
                          {p.evidencia && <p>{p.evidencia}</p>}
                          {p.cita && <p className="cita">«{p.cita}»</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* ── Pruebas externas ────────────────────────── */}
        {!esCeo && d.externas.some((e: Externa) => e.estado === "cargada") && (
          <section className="shelf">
            <div className="eyebrow">/ PRUEBAS EXTERNAS /</div>
            <h2>Cada una en su propio formato.</h2>
            <p className="sub">
              Ninguna se normaliza ni se convierte a una escala común: DISC mide ejes, IQ mide percentiles y
              16personalities da un tipo. Forzarlas a un mismo número sería inventar equivalencias que no existen.
            </p>
            <div className="g2">
              {/* Solo las que tienen resultado. Una prueba sin presentar ya
                  aparece en la tabla de arriba; darle además una tarjeta vacía
                  en la sección de gráficas no agrega nada y hace más larga la
                  única parte del informe que se mira con calma. */}
              {d.externas.filter((e: Externa) => e.estado === "cargada").map((e: Externa) => {
                // `null` pasaba el filtro viejo porque Number(null) es 0, y la
                // nota sin calificar de Turing salía dibujada como un 0.
                const nums = Object.entries(e.puntajes ?? {}).filter(
                  ([, v]) => v !== null && v !== "" && typeof v !== "boolean" && Number.isFinite(Number(v)),
                );
                return (
                  <div className="card" key={e.key}>
                    <h3>{e.nombre}</h3>
                    <div className="cs">{e.resumen ?? e.estadoLabel}</div>
                    {nums.length > 0
                      ? <Barras max={Math.max(100, ...nums.map(([, v]) => Number(v)))}
                          filas={nums.map(([k, v]) => ({ label: k, valor: Number(v) }))} />
                      : <p className="mini" style={{ marginTop: 0 }}>
                          {e.puntajes
                            ? Object.entries(e.puntajes).map(([k, v]) => `${k}: ${v}`).join(" · ")
                            : "Sin puntajes numéricos cargados."}
                        </p>}
                    {e.cargadoPor && <p className="mini">Cargado por {e.cargadoPor}.</p>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Lectura cruzada ─────────────────────────── */}
        <section className="shelf">
          <div className="eyebrow">/ LECTURA CRUZADA /</div>
          <h2>Dónde las pruebas se dan la razón y dónde no.</h2>
          <p className="sub">
            Un rasgo que aparece en tres instrumentos distintos es un hecho; uno que solo aparece en uno
            es una hipótesis para la entrevista. Esto es lo que no se ve leyendo seis informes por separado.
          </p>
          {L?.errorCruce && <div className="aviso warn">La lectura cruzada no se pudo generar: {L.errorCruce}</div>}
          {!L?.hallazgos?.length && !L?.errorCruce && (
            <div className="aviso">
              Todavía no hay lectura cruzada. Se genera desde el informe de la batería, en el botón del
              psicólogo, y necesita que al menos una prueba externa tenga resultado cargado.
            </div>
          )}
          <div className="conv">
            {(esCeo ? (L?.hallazgos ?? []).slice(0, 3) : L?.hallazgos ?? []).map((h: Hallazgo, i: number) => {
              const s = SENAL[h.senal] ?? SENAL.hueco;
              return (
                <div className={`conv-row ${s.cls}`} key={i}>
                  <div><span className={`chip ${s.cls}`}>{s.txt}</span></div>
                  <div><h4>{h.titulo}</h4><p>{h.texto}</p></div>
                </div>
              );
            })}
          </div>
          {!!L?.hallazgosOcultos && (
            <p className="mini">
              {L.hallazgosOcultos} {L.hallazgosOcultos === 1 ? "hallazgo se oculta" : "hallazgos se ocultan"} en
              esta vista por referirse a lecturas internas de Talent.
            </p>
          )}
        </section>

        {/* ── Lectura para la entrevista ──────────────── */}
        {!esCeo && L && (
          <section className="shelf">
            <div className="eyebrow">/ LECTURA PARA LA ENTREVISTA /</div>
            <h2>Qué mirar cuando se siente al frente.</h2>
            {L.resumen && <p className="sub">{L.resumen}</p>}
            <div className="g2">
              <div className="card">
                <h3>Fortalezas</h3><div className="cs">Lo que trae y el cargo usa</div>
                <ol className="lst">{(L.fortalezas ?? []).map((f: any, i: number) =>
                  <li key={i}><strong>{f.titulo}</strong> {f.detalle}</li>)}</ol>
              </div>
              <div className="card">
                <h3>Puntos de cuidado</h3><div className="cs">Brechas frente a las exigencias del cargo</div>
                <ol className="lst">{(L.oportunidades ?? []).map((o: any, i: number) =>
                  <li key={i}><strong>{o.titulo}</strong> {o.detalle}</li>)}</ol>
              </div>
            </div>
            {!!(L.preguntas ?? []).length && (
              <div className="card full">
                <h3>Preguntas para la entrevista</h3>
                <div className="cs">Cada una ataca un punto que las pruebas dejaron abierto</div>
                <ol className="lst">{L.preguntas.map((p: any, i: number) =>
                  <li key={i}>{p.pregunta} <span className="mut">· qué escuchar: {p.queEscuchar}</span></li>)}</ol>
              </div>
            )}
          </section>
        )}

        {/* ── Cierre ──────────────────────────────────── */}
        {L?.conclusion && (
          <section className="cierre">
            <div className="eyebrow light">/ CONCLUSIÓN /</div>
            <h2>Qué haríamos con este candidato.</h2>
            <p>{L.conclusion.texto}</p>
            <p className="legal">
              Análisis asistido con IA sobre puntajes ya calculados. No constituye un diagnóstico y requiere
              la revisión de un profesional con tarjeta vigente antes de sustentar una decisión
              (Ley 1090 de 2006). {d.cargo.version ? `Perfil de referencia ${d.cargo.version}. ` : ""}
              Informe generado el {fecha(d.generadoEl)}.
            </p>
          </section>
        )}
      </main>
      <style>{CSS}</style>
    </>
  );
}

const CSS = `
:root{--bg:#F4F5F7;--surface:#FCFCFB;--surface-2:#F7F8FA;--ink:#0B0B0B;--ink-soft:#52514E;
--ink-mute:#8A8D96;--line:#E3E6EC;--brand:#0A0A0A;--bar:#2a78d6;--ref:#52514E;
--ok-bg:#E6F4EC;--ok-fg:#11643A;--wa-bg:#FDF0DC;--wa-fg:#8A5207;--bad-bg:#FBE9E9;--bad-fg:#A4201F;
--mu-bg:#EFF0F3;--mu-fg:#5E626C}
body{background:var(--bg);color:var(--ink);margin:0;
font:15px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif}
.barra{position:sticky;top:0;z-index:50;background:var(--surface);border-bottom:1px solid var(--line);
padding:10px 20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.barra .lbl{font:700 11px/1 inherit;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-mute)}
.barra .sp{flex:1}
.pick{border:1px solid var(--line);background:transparent;color:var(--ink);padding:6px 13px;
border-radius:999px;font:600 13px/1 inherit;cursor:pointer}
.pick.on{background:var(--brand);border-color:var(--brand);color:#fff}
.wrap{max-width:1060px;margin:0 auto;padding:0 20px 70px}
.hero{background:var(--brand);color:#fff;padding:34px 20px 38px}
.hero-in{max-width:1060px;margin:0 auto}
.hero-row{display:flex;gap:18px;align-items:flex-start;margin-top:10px}
.avatar{width:58px;height:58px;border-radius:14px;flex:none;background:rgba(255,255,255,.16);
display:grid;place-items:center;font:700 19px/1 inherit}
.hero h1{margin:0 0 3px;font-size:27px;font-weight:650;letter-spacing:-.015em}
.hero-sub{margin:0;opacity:.78;font-size:13.5px}
.hero-role{margin:9px 0 0;font-size:13.5px;opacity:.92;max-width:72ch}
.eyebrow{font:700 10.5px/1 inherit;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-mute);margin-bottom:9px}
.hero .eyebrow{color:rgba(255,255,255,.72)} .eyebrow.light{color:rgba(255,255,255,.7)}
.shelf{padding:40px 0 6px;border-top:1px solid var(--line)}
.shelf:first-of-type{border-top:0}
.shelf h2{margin:0 0 8px;font-size:22px;font-weight:650;letter-spacing:-.015em}
.sub{margin:0 0 20px;color:var(--ink-soft);font-size:14px;max-width:76ch}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
@media(max-width:820px){.g2,.g3{grid-template-columns:1fr}}
.card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:17px 18px 19px}
.card.full{margin-top:14px}
.card h3{margin:0 0 2px;font-size:14.5px;font-weight:650}
.cs{color:var(--ink-mute);font-size:12px;margin-bottom:14px}
.mini{font-size:12.5px;color:var(--ink-soft);line-height:1.6;margin:13px 0 0}
.mut{color:var(--ink-mute)}
.chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:6px;
font:700 11px/1.4 inherit;white-space:nowrap}
.chip.ok{background:var(--ok-bg);color:var(--ok-fg)}
.chip.warn{background:var(--wa-bg);color:var(--wa-fg)}
.chip.bad{background:var(--bad-bg);color:var(--bad-fg)}
.chip.mute{background:var(--mu-bg);color:var(--mu-fg)}
.chip.big{font-size:13px;padding:7px 14px}
.meter{display:grid;gap:11px;justify-items:start}
.meter-num{font:700 42px/1 inherit;letter-spacing:-.03em}
.meter-num .pc{font-size:20px;font-weight:650;color:var(--ink-mute)}
.meter-body{width:100%}
.meter-track{height:8px;border-radius:99px;background:var(--mu-bg);overflow:hidden}
.meter-fill{height:100%;background:var(--bar);border-radius:99px}
.meter-sub{font-size:12px;color:var(--ink-mute);margin-top:7px}
.big-num{font:700 40px/1 inherit;letter-spacing:-.03em}
.big-num .de{font-size:17px;font-weight:600;color:var(--ink-mute)}
.bh{display:grid;gap:9px}
.bh-row{display:grid;grid-template-columns:128px 1fr 76px;gap:11px;align-items:center}
.bh-lab{font-size:12.5px;color:var(--ink-soft)}
.bh-track{position:relative;height:15px;background:var(--mu-bg);border-radius:4px}
.bh-fill{height:100%;background:var(--bar);border-radius:4px}
.bh-ref{position:absolute;top:-3px;bottom:-3px;width:2px;background:var(--ref);border-radius:1px;
box-shadow:0 0 0 2px var(--surface)}
.bh-val{font:650 12.5px/1 inherit;text-align:right}
.bh-ref-txt{color:var(--ink-mute);font-weight:400}
.tbl{width:100%;border-collapse:collapse;background:var(--surface);border:1px solid var(--line);
border-radius:12px;overflow:hidden;font-size:13.5px}
.tbl th{text-align:left;font:700 10.5px/1 inherit;letter-spacing:.08em;text-transform:uppercase;
color:var(--ink-mute);padding:11px 13px;background:var(--surface-2);border-bottom:1px solid var(--line)}
.tbl td{padding:11px 13px;border-bottom:1px solid var(--line)}
.tbl tr:last-child td{border-bottom:0}
.tbl .nm{font-weight:600} .tbl .mut{font-size:12.5px}
.tbl tr.propia td{background:var(--surface-2)}
.conv{display:grid;gap:10px}
.conv-row{display:grid;grid-template-columns:136px 1fr;gap:14px;background:var(--surface);
border:1px solid var(--line);border-left:3px solid var(--line);border-radius:12px;padding:15px 17px}
.conv-row.ok{border-left-color:var(--ok-fg)}
.conv-row.warn{border-left-color:var(--wa-fg)}
.conv-row.bad{border-left-color:var(--bad-fg)}
.conv-row h4{margin:0 0 5px;font-size:14px;font-weight:650}
.conv-row p{margin:0;font-size:13.5px;color:var(--ink-soft)}
@media(max-width:700px){.conv-row{grid-template-columns:1fr}}
.lst{margin:0;padding-left:20px;display:grid;gap:8px}
.lst li{font-size:13.5px;color:var(--ink-soft);line-height:1.6}
.lst.grande li{font-size:15px;line-height:1.7;margin-bottom:4px}
.lst.grande strong{color:var(--ink)}
h2.pide{font-size:26px;line-height:1.3;max-width:24ch}
.prin{display:grid;gap:9px}
.prin-row{display:grid;grid-template-columns:120px 1fr;gap:13px;align-items:start;
padding:11px 0;border-top:1px solid #F0F2F5}
.prin-row:first-child{border-top:0}
.prin-row strong{font-size:13.5px}
.prin-row p{margin:4px 0 0;font-size:13px;color:var(--ink-soft);line-height:1.55}
.prin-row p.cita{color:var(--ink-mute);font-style:italic}
.prin-row.mute strong{color:var(--ink-mute);font-weight:500}
@media(max-width:700px){.prin-row{grid-template-columns:1fr}}
.aviso{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:13px 16px;
font-size:13.5px;color:var(--ink-soft);margin:16px 0}
.aviso.warn{background:var(--wa-bg);border-color:#F2DFA8;color:var(--wa-fg)}
.aviso.bad{background:var(--bad-bg);border-color:#FBD5D5;color:var(--bad-fg)}
.cierre{margin-top:40px;background:var(--brand);color:#fff;border-radius:16px;padding:32px 30px 28px}
.cierre h2{margin:0 0 10px;font-size:22px;font-weight:650}
.cierre p{margin:0;font-size:14.5px;line-height:1.7;max-width:80ch;opacity:.95}
.legal{margin-top:22px!important;padding-top:17px;border-top:1px solid rgba(255,255,255,.16);
font-size:11.5px!important;opacity:.72}
@media print{.no-print{display:none}body{background:#fff}
.shelf,.card,.conv-row,.cierre{break-inside:avoid}
.hero,.cierre{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
`;
