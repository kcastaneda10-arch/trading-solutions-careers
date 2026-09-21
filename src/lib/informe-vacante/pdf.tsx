/**
 * INFORME DE VACANTE · el PDF
 *
 * Mismo lenguaje editorial del plan de desarrollo de Talent: blanco, negro,
 * Open Sauce Sans, etiquetas en versalitas espaciadas, reglas finas.
 *
 * Se arma en el servidor con @react-pdf/renderer, así el mismo archivo sirve
 * para descargar y para adjuntar en el borrador de Gmail, sin depender de la
 * impresión del navegador.
 *
 * Páginas:
 *   1 · Estado de la búsqueda (one-page): datos, indicadores, frase, embudo,
 *       desempeño del proceso, gestión y próximos pasos.
 *   2 · Resultados de las pruebas psicométricas: match, integridad y
 *       fortaleza principal de cada candidato activo.
 *   3+ · Los 10 primeros: una ficha breve por persona.
 */
import React from "react";
import { Document, Font, Image, Page, Polygon, StyleSheet, Svg, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { FilaPrueba, Informe } from "./datos";

const NEGRO = "#0a0a0a";
const GRIS = "#737373";
const GRIS_CLARO = "#8a8a8a";
const REGLA = "#e6e6e6";
const REGLA_SUAVE = "#f0f0f0";
const FONDO = "#f4f4f4";
const VERDE = "#1a7d3e";

let fuentesListas = "";
/** `base` es una URL (en producción, el propio dominio) o una carpeta local. */
function registrarFuentes(base: string) {
  if (fuentesListas === base) return;
  const f = (w: number) => `${base.replace(/\/$/, "")}/fonts/informe/open-sauce-sans-latin-${w}-normal.woff`;
  Font.register({
    family: "OpenSauce",
    fonts: [
      { src: f(400), fontWeight: 400 },
      { src: f(700), fontWeight: 700 },
      { src: f(800), fontWeight: 800 },
    ],
  });
  // Sin guiones de corte: en un informe ejecutivo se leen como errores.
  Font.registerHyphenationCallback((w) => [w]);
  fuentesListas = base;
}

const s = StyleSheet.create({
  page: { fontFamily: "OpenSauce", fontSize: 9, color: NEGRO, paddingTop: 34, paddingBottom: 44, paddingHorizontal: 44 },
  logo: { height: 11, width: 72, objectFit: "contain", marginBottom: 12 },
  eyebrow: { fontSize: 6.5, letterSpacing: 1.8, textTransform: "uppercase", color: GRIS_CLARO, marginBottom: 4 },
  h1: { fontSize: 27, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.05 },
  h1b: { fontSize: 22, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.08 },
  h2: { fontSize: 12.5, fontWeight: 800, letterSpacing: -0.2, marginBottom: 7 },
  sub: { fontSize: 9.5, color: GRIS, marginTop: 5 },
  meta: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: REGLA, marginTop: 11, marginBottom: 11, paddingVertical: 7 },
  metaK: { fontSize: 6, letterSpacing: 1.5, textTransform: "uppercase", color: GRIS_CLARO },
  metaV: { fontSize: 9, fontWeight: 700, marginTop: 3 },
  kpis: { flexDirection: "row", borderWidth: 1, borderColor: REGLA },
  kpi: { flex: 1, paddingHorizontal: 8, paddingTop: 9, paddingBottom: 8, borderRightWidth: 1, borderColor: REGLA },
  kpiN: { fontSize: 21, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1 },
  kpiT: { fontSize: 7, color: "#5f5f5f", marginTop: 5, lineHeight: 1.3 },
  frase: { backgroundColor: FONDO, borderWidth: 1, borderColor: REGLA, paddingVertical: 10, paddingHorizontal: 12, marginTop: 10, marginBottom: 11 },
  fraseT: { fontSize: 9.3, lineHeight: 1.55, color: "#2a2a2a" },
  sec: { marginBottom: 10 },
  dos: { flexDirection: "row", marginBottom: 10 },
  col: { flex: 1 },
  li: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3.8, borderBottomWidth: 1, borderColor: REGLA_SUAVE, fontSize: 8.6 },
  nota: { fontSize: 7, color: "#6f6f6f", lineHeight: 1.5, marginTop: 7 },
  paso: { flexDirection: "row", paddingVertical: 3.8, borderBottomWidth: 1, borderColor: REGLA_SUAVE },
  pasoN: { width: 16, fontWeight: 800, fontSize: 9 },
  pasoT: { flex: 1, fontSize: 8.8, lineHeight: 1.45 },
  pie: { position: "absolute", left: 44, right: 44, bottom: 22, borderTopWidth: 1, borderColor: REGLA, paddingTop: 5, flexDirection: "row", justifyContent: "space-between", fontSize: 6.3, color: "#9a9a9a" },
  // tabla
  th: { fontSize: 5.8, letterSpacing: 1.2, textTransform: "uppercase", color: GRIS_CLARO, paddingBottom: 5 },
  tr: { flexDirection: "row", paddingVertical: 4.6, borderBottomWidth: 1, borderColor: REGLA_SUAVE, fontSize: 8.4 },
  grupo: { backgroundColor: FONDO, paddingVertical: 3.5, paddingHorizontal: 4, fontSize: 7, color: "#5f5f5f" },
});

function Pie({ titulo }: { titulo: string }) {
  return (
    <View style={s.pie} fixed>
      <Text>Trading Solutions · Informe de vacante · {titulo} · Confidencial</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`} />
    </View>
  );
}

function Embudo({ inf }: { inf: Informe }) {
  const max = Math.max(1, inf.embudo[0]?.n ?? 1);
  const ZONA = 150;
  const colores = ["#0a0a0a", "#2a2a2a", "#404040", VERDE, "#2f6fd6", "#6b3fb5", "#0f5b2c"];
  return (
    <View>
      {inf.embudo.map((e, i) => {
        const w = e.n ? Math.max((e.n / max) * ZONA, ZONA * 0.2) : ZONA * 0.22;
        const h = 17;
        const color = e.n ? colores[i] : "#e6e6e6";
        return (
          <View key={e.etiqueta} style={{ flexDirection: "row", alignItems: "center", minHeight: 19.5, marginBottom: 1 }}>
            <View style={{ width: 128, paddingRight: 6 }}>
              <Text style={{ fontSize: 7.6 }}>{e.etiqueta}</Text>
              {e.sub ? <Text style={{ fontSize: 6.3, color: GRIS_CLARO, marginTop: 1 }}>{e.sub}</Text> : null}
            </View>
            <View style={{ width: ZONA, alignItems: "center" }}>
              <View style={{ width: w, height: h, position: "relative" }}>
                <Svg width={w} height={h} style={{ position: "absolute", top: 0, left: 0 }}>
                  <Polygon points={`0,0 ${w},0 ${w * 0.965},${h} ${w * 0.035},${h}`} fill={color} />
                </Svg>
                <Text style={{ position: "absolute", top: 4, left: 0, width: w, textAlign: "center", fontSize: 9, fontWeight: 800, color: e.n ? "#ffffff" : GRIS_CLARO }}>
                  {e.n ? String(e.n) : "—"}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Hoy({ inf }: { inf: Informe }) {
  const total = inf.hoy.reduce((a, g) => a + g.n, 0) || 1;
  return (
    <View>
      <Text style={[s.eyebrow, { marginBottom: 6 }]}>Dónde están hoy los {total}</Text>
      <View style={{ flexDirection: "row", height: 13, width: "100%" }}>
        {inf.hoy.map((g) => (
          <View key={g.etiqueta} style={{ width: `${(g.n / total) * 100}%`, height: 13, backgroundColor: g.color }} />
        ))}
      </View>
      <View style={{ marginTop: 7 }}>
        {inf.hoy.map((g) => (
          <View key={g.etiqueta} style={[s.li, { alignItems: "center", fontSize: 7.8 }]}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 7, height: 7, backgroundColor: g.color, marginRight: 5 }} />
              <Text>{g.etiqueta}</Text>
            </View>
            <Text style={{ fontWeight: 800 }}>{g.n}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function PaginaResumen({ inf, frase, pasos }: { inf: Informe; frase: string; pasos: string[] }) {
  const k = inf.kpis;
  const kpis: [string, string, boolean?][] = [
    [String(k.aplicaron), "aplicaron"],
    [String(k.prefiltro), `completaron el prefiltro · ${k.aplicaron ? Math.round((k.prefiltro / k.aplicaron) * 100) : 0} %`],
    [String(k.invitados), "invitados a pruebas psicométricas"],
    [String(k.presentaron), `presentaron las pruebas · ${k.pctPresentaron} %`, true],
    [String(k.bandaSuperior), k.presentaron ? `en la banda superior de match (${k.bandaDesde}–${k.bandaHasta} %)` : "en la banda superior de match"],
    [String(k.activos), "siguen activos en el proceso"],
  ];
  const totalDes = inf.descartes.reduce((a, d) => a + d.n, 0);
  const principal = inf.descartes[0];
  return (
    <>
      <Text style={s.eyebrow}>Informe de vacante · {new Date(inf.generado).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota" })}</Text>
      <Text style={s.h1}>{inf.vacante.titulo}.</Text>
      <Text style={s.sub}>Estado de la búsqueda · para el hiring manager y la dirección</Text>

      <View style={s.meta}>
        {[
          ["Abierta desde", inf.vacante.abiertaDesde],
          ["Días abierta", `${inf.vacante.dias} días`],
          ["Etapa del proceso", inf.vacante.etapa],
          ["Preparado por", "Talent Team"],
        ].map(([a, b]) => (
          <View key={a} style={{ flex: 1, paddingRight: 8 }}>
            <Text style={s.metaK}>{a}</Text>
            <Text style={s.metaV}>{b}</Text>
          </View>
        ))}
      </View>

      <View style={s.kpis}>
        {kpis.map(([n, t, verde], i) => (
          <View key={i} style={[s.kpi, i === kpis.length - 1 ? { borderRightWidth: 0 } : {}]}>
            <Text style={s.kpiN}>{n}</Text>
            <Text style={[s.kpiT, verde ? { color: VERDE } : {}]}>{t}</Text>
          </View>
        ))}
      </View>

      <View style={s.frase}>
        <Text style={[s.eyebrow, { marginBottom: 5 }]}>En una frase</Text>
        <Text style={s.fraseT}>{frase}</Text>
      </View>

      <View style={s.sec} wrap={false}>
        <Text style={s.eyebrow}>01 — Embudo</Text>
        <Text style={s.h2}>Cómo avanza la búsqueda</Text>
        <View style={{ flexDirection: "row" }}>
          <View style={{ width: 284 }}>
            <Embudo inf={inf} />
          </View>
          <View style={{ flex: 1, paddingLeft: 16 }}>
            <Hoy inf={inf} />
          </View>
        </View>
      </View>

      <View style={s.dos} wrap={false}>
        <View style={[s.col, { paddingRight: 10 }]}>
          <Text style={s.eyebrow}>02 — Desempeño del proceso</Text>
          <Text style={s.h2}>Quiénes salieron y por qué</Text>
          {inf.descartes.length === 0 ? (
            <Text style={{ fontSize: 8.4, color: GRIS }}>Sin descartes registrados.</Text>
          ) : (
            <>
              {inf.descartes.slice(0, 4).map((d) => (
                <View key={d.etiqueta} style={s.li}>
                  <Text>{d.etiqueta}</Text>
                  <Text style={{ fontWeight: 800 }}>{d.n}</Text>
                </View>
              ))}
              <View style={s.li}>
                <Text style={{ fontWeight: 700 }}>Total descartados</Text>
                <Text style={{ fontWeight: 800 }}>{totalDes}</Text>
              </View>
              {principal && totalDes >= 4 && principal.n / totalDes >= 0.5 ? (
                <Text style={s.nota}>
                  «{principal.etiqueta}» explica {principal.n} de {totalDes} descartes. Si se repite en la próxima búsqueda, conviene pedirlo desde el aviso y el prefiltro.
                </Text>
              ) : null}
            </>
          )}
        </View>
        <View style={[s.col, { paddingLeft: 10 }]}>
          <Text style={s.eyebrow}>03 — Gestión de Talent</Text>
          <Text style={s.h2}>Seguimiento a candidatos</Text>
          {[
            ["Candidatos en gestión activa", inf.gestion.activos],
            ["Contactos realizados con candidatos", inf.gestion.contactos],
            ["Pruebas recuperadas con seguimiento", inf.gestion.recuperadas],
            ["Pruebas psicométricas en seguimiento", inf.gestion.enSeguimiento],
          ].map(([a, b]) => (
            <View key={String(a)} style={s.li}>
              <Text>{a}</Text>
              <Text style={{ fontWeight: 800 }}>{b}</Text>
            </View>
          ))}
          {inf.gestion.recuperadas > 0 && inf.kpis.presentaron > 0 ? (
            <Text style={s.nota}>
              {inf.gestion.recuperadas} de las {inf.kpis.presentaron} pruebas presentadas llegaron después de un recordatorio: sin ese seguimiento, esos resultados no estarían en la mesa.
            </Text>
          ) : null}
        </View>
      </View>

      <View wrap={false}>
        <Text style={s.eyebrow}>04 — Próximos pasos</Text>
        {pasos.filter((p) => p.trim()).map((p, i) => (
          <View key={i} style={s.paso}>
            <Text style={s.pasoN}>{i + 1}</Text>
            <Text style={s.pasoT}>{p}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function PaginaPruebas({ inf }: { inf: Informe }) {
  const grupos: { key: FilaPrueba["banda"]; titulo: string; nota?: string }[] = [
    { key: "sup", titulo: `Banda superior · ${inf.kpis.bandaDesde}–${inf.kpis.bandaHasta} %`, nota: "Empatados entre sí: diferencias de hasta 5 puntos no distinguen a una persona de otra." },
    { key: "med", titulo: `Banda media · 80–${Math.max(80, inf.kpis.bandaDesde - 1)} %` },
    { key: "inf", titulo: "Por debajo de 80 %" },
  ];
  let n = 0;
  return (
    <>
      <Text style={s.eyebrow}>05 — Resultados de las pruebas psicométricas iniciales</Text>
      <Text style={s.h1b}>Quiénes presentaron las pruebas.</Text>
      <Text style={s.sub}>
        Pruebas psicométricas iniciales · {inf.pruebas.length} candidatos activos, ordenados por match con el perfil del cargo.
      </Text>

      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: NEGRO, marginTop: 13 }}>
        <Text style={[s.th, { width: 18 }]}> </Text>
        <Text style={[s.th, { width: 200 }]}>Candidato</Text>
        <Text style={[s.th, { width: 58 }]}>Match</Text>
        <Text style={[s.th, { width: 62 }]}>Integridad</Text>
        <Text style={[s.th, { flex: 1 }]}>Fortaleza principal</Text>
      </View>
      {grupos.map((g) => {
        const filas = inf.pruebas.filter((f) => f.banda === g.key);
        if (!filas.length) return null;
        return (
          <View key={g.key}>
            <View style={s.grupo} wrap={false}>
              <Text>
                <Text style={{ fontWeight: 700, color: NEGRO }}>{g.titulo}</Text>
                {g.nota ? ` · ${g.nota}` : ""}
              </Text>
            </View>
            {filas.map((f) => {
              n++;
              return (
                <View key={f.token} style={s.tr} wrap={false}>
                  <Text style={{ width: 18, color: "#a3a3a3" }}>{n}</Text>
                  <Text style={{ width: 200, fontWeight: 700 }}>{f.nombre}</Text>
                  <Text style={{ width: 58 }}>
                    <Text style={{ fontWeight: 800, fontSize: 10 }}>{f.match}</Text>
                    <Text style={{ fontSize: 6.5, color: GRIS }}> %</Text>
                  </Text>
                  <Text style={{ width: 62, color: "#404040" }}>{f.integridad ?? "—"}</Text>
                  <Text style={{ flex: 1, color: "#404040" }}>{f.fortaleza}</Text>
                </View>
              );
            })}
          </View>
        );
      })}
      <Text style={[s.nota, { marginTop: 9 }]}>
        <Text style={{ fontWeight: 700, color: "#2a2a2a" }}>Match:</Text> qué tanto se parece el resultado de la persona al perfil definido para el cargo. Diferencias de hasta 5 puntos no distinguen a una persona de otra: dentro de una misma banda, el orden no es una recomendación.{" "}
        <Text style={{ fontWeight: 700, color: "#2a2a2a" }}>Integridad:</Text> apego a normas y a la verdad, de 0 a 100.{" "}
        <Text style={{ fontWeight: 700, color: "#2a2a2a" }}>Fortaleza principal:</Text> el rasgo más marcado de la persona frente a lo que pide el cargo. Estas pruebas son un insumo inicial: la decisión se completa con la entrevista.
      </Text>
    </>
  );
}

function FichaTop({ f, puesto }: { f: FilaPrueba; puesto: number }) {
  const inf = f.informe;
  const bloque = (titulo: string, items: string[]) =>
    items.length ? (
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={[s.eyebrow, { marginBottom: 4 }]}>{titulo}</Text>
        {items.map((x, i) => (
          <Text key={i} style={{ fontSize: 8.4, lineHeight: 1.45, marginBottom: 2 }}>
            — {x}
          </Text>
        ))}
      </View>
    ) : null;
  return (
    <View wrap={false} style={{ borderTopWidth: 1, borderColor: NEGRO, paddingTop: 9, marginBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 8 }}>
        <Text style={{ fontSize: 9, color: "#a3a3a3", width: 20, fontWeight: 700 }}>{String(puesto).padStart(2, "0")}</Text>
        <Text style={{ flex: 1, fontSize: 14, fontWeight: 800, letterSpacing: -0.3 }}>{f.nombre}</Text>
        <View style={{ flexDirection: "row" }}>
          <View style={{ borderWidth: 1, borderColor: NEGRO, backgroundColor: NEGRO, paddingHorizontal: 6, paddingVertical: 2.5, marginLeft: 5 }}>
            <Text style={{ fontSize: 7, color: "#fff", fontWeight: 700 }}>MATCH {f.match} %</Text>
          </View>
          <View style={{ borderWidth: 1, borderColor: "#cfcfcf", paddingHorizontal: 6, paddingVertical: 2.5, marginLeft: 5 }}>
            <Text style={{ fontSize: 7, color: "#404040" }}>INTEGRIDAD {f.integridad ?? "—"}</Text>
          </View>
          {f.banda === "sup" ? (
            <View style={{ borderWidth: 1, borderColor: "#bfe0cb", backgroundColor: "#eef7f1", paddingHorizontal: 6, paddingVertical: 2.5, marginLeft: 5 }}>
              <Text style={{ fontSize: 7, color: VERDE }}>BANDA SUPERIOR</Text>
            </View>
          ) : null}
        </View>
      </View>
      {inf ? (
        <>
          {inf.lectura ? <Text style={{ fontSize: 8.7, lineHeight: 1.55, color: "#2a2a2a", marginBottom: 8 }}>{recortar(inf.lectura, 420)}</Text> : null}
          <View style={{ flexDirection: "row" }}>
            {bloque("Fortalezas", inf.fortalezas)}
            {bloque("A validar en la entrevista", inf.validar)}
          </View>
          {inf.pregunta ? (
            <View style={{ backgroundColor: FONDO, paddingVertical: 6, paddingHorizontal: 8, marginTop: 7 }}>
              <Text style={[s.eyebrow, { marginBottom: 3 }]}>Pregunta sugerida para la entrevista</Text>
              <Text style={{ fontSize: 8.4, lineHeight: 1.45 }}>{inf.pregunta}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={{ flexDirection: "row" }}>
          {bloque("Fortaleza principal", [f.fortaleza])}
          <View style={{ flex: 1 }}>
            <Text style={[s.eyebrow, { marginBottom: 4 }]}>Informe interpretativo</Text>
            <Text style={{ fontSize: 8.2, color: GRIS, lineHeight: 1.45 }}>En preparación. Se incluye en la próxima versión del informe.</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function recortar(t: string, max: number) {
  const x = t.replace(/\s+/g, " ").trim();
  if (x.length <= max) return x;
  const corte = x.slice(0, max);
  const punto = corte.lastIndexOf(". ");
  return (punto > max * 0.5 ? corte.slice(0, punto + 1) : corte.replace(/\s+\S*$/, "") + "…");
}

export function DocumentoInforme({
  inf,
  frase,
  pasos,
  base,
}: {
  inf: Informe;
  frase: string;
  pasos: string[];
  base: string;
}) {
  const logo = `${base.replace(/\/$/, "")}/logo-trading-solutions.png`;
  return (
    <Document title={`Informe de vacante · ${inf.vacante.titulo}`} author="Talent Team · Trading Solutions" creator="ATS Trading Solutions">
      <Page size="A4" style={s.page}>
        <Image src={logo} style={s.logo} fixed />
        <PaginaResumen inf={inf} frase={frase} pasos={pasos} />
        <Pie titulo={inf.vacante.titulo} />
      </Page>
      {inf.pruebas.length > 0 ? (
        <Page size="A4" style={s.page}>
          <Image src={logo} style={s.logo} fixed />
          <PaginaPruebas inf={inf} />
          <Pie titulo={inf.vacante.titulo} />
        </Page>
      ) : null}
      {inf.top10.length > 0 ? (
        <Page size="A4" style={s.page}>
          <Image src={logo} style={s.logo} fixed />
          <Text style={s.eyebrow}>06 — Los {inf.top10.length} primeros</Text>
          <Text style={s.h1b}>Informe preliminar.</Text>
          <Text style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.2, marginTop: 4 }}>Perfil breve de los candidatos con mejor match.</Text>
          <Text style={[s.sub, { marginBottom: 14 }]}>
            Lectura de las pruebas psicométricas iniciales para preparar la entrevista. No reemplaza la entrevista ni las referencias.
          </Text>
          {inf.top10.map((f, i) => (
            <FichaTop key={f.token} f={f} puesto={i + 1} />
          ))}
          <Pie titulo={inf.vacante.titulo} />
        </Page>
      ) : null}
    </Document>
  );
}

export async function renderInformePdf(inf: Informe, frase: string, pasos: string[], base: string): Promise<Buffer> {
  registrarFuentes(base);
  return renderToBuffer(<DocumentoInforme inf={inf} frase={frase} pasos={pasos} base={base} />);
}
