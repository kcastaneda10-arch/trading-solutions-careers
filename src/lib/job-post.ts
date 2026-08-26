/**
 * EL AVISO DE VACANTE · formato estándar de Trading Solutions
 *
 * Todos los avisos salen con la misma estructura: gancho, quiénes somos, qué
 * vas a hacer, requisitos, nice to have, ubicación, salario, cómo aplicar y
 * hashtags. Antes eso se armaba a mano cada vez, y cada vacante terminaba con
 * un formato distinto según quién la escribiera.
 *
 * Acá se arma solo a partir de la requisición. Lo que falte se omite en vez de
 * dejar un hueco visible: un aviso al que le falta el bloque de salario se lee
 * bien; uno que dice "Salario: undefined" no.
 *
 * El aviso se publica en inglés — es el idioma en el que la compañía busca,
 * incluso en Colombia, porque los cargos exigen inglés.
 */

export type DatosDelAviso = {
  title: string;
  title_en?: string | null;
  hook_en?: string | null;
  description_en?: string | null;
  requirements_en?: string | null;
  nice_to_have_en?: string | null;
  responsibilities_en?: string | null;
  /** Se usan si no hay versión en inglés. */
  description?: string | null;
  requirements?: string | null;
  nice_to_have?: string | null;
  responsibilities?: string | null;
  location?: string | null;
  work_mode?: string | null;
  salary_public?: string | null;
  apply_email?: string | null;
  area?: string | null;
};

/** Presentación de la compañía. Es la misma en todos los avisos. */
const QUIENES_SOMOS =
  "At Trading Solutions, we are redefining the future of global logistics by " +
  "merging cutting-edge technology, real-time visibility, and seamless " +
  "coordination across continents. We empower businesses to move faster, " +
  "smarter, and with absolute confidence in every shipment.";

const CORREO_POR_DEFECTO = "jointheteam@tradingsolutions.com";

/** Convierte un bloque de texto en viñetas, una por línea no vacía. */
function aViñetas(texto?: string | null): string[] {
  if (!texto) return [];
  return texto
    .split("\n")
    .map((l) => l.replace(/^[\s•\-*·]+/, "").trim())
    .filter(Boolean);
}

/** "On-site" / "Hybrid" / "Remote" a partir de lo que se haya escrito. */
function modalidadEn(modo?: string | null): string | null {
  const m = (modo || "").toLowerCase();
  if (!m) return null;
  if (m.includes("remot")) return "Remote";
  if (m.includes("hibr") || m.includes("híbr") || m.includes("hybrid")) return "Hybrid";
  if (m.includes("presencial") || m.includes("site") || m.includes("office")) return "On-site";
  return modo || null;
}

/**
 * Hashtags del aviso.
 *
 * Salen del cargo, el área y la ciudad, más los fijos de la industria. Se
 * limita a ocho: una pared de veinte hashtags se lee como spam y LinkedIn los
 * penaliza.
 */
function hashtags(d: DatosDelAviso): string[] {
  const limpio = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "")
     .replace(/[^A-Za-z0-9 ]/g, " ")
     .split(/\s+/).filter(Boolean)
     .map((p) => p[0].toUpperCase() + p.slice(1))
     .join("");

  const tags: string[] = [];
  const titulo = limpio(d.title_en || d.title);
  if (titulo) tags.push(`#${titulo}`);

  tags.push("#FreightForwarding", "#InternationalLogistics", "#Shipping");

  if (d.area) {
    const a = limpio(d.area);
    if (a && !tags.includes(`#${a}`)) tags.push(`#${a}`);
  }

  // Primera parte de la ubicación: "Shanghai / Shenzhen, China" → Shanghai.
  const ciudad = (d.location || "").split(/[\/,]/)[0]?.trim();
  if (ciudad) {
    const c = limpio(ciudad);
    if (c && !tags.includes(`#${c}`)) tags.push(`#${c}`);
  }

  tags.push("#NowHiring");
  return tags.slice(0, 8);
}

/** Arma el aviso completo, listo para pegar en LinkedIn o en un portal. */
export function construirAviso(d: DatosDelAviso, urlAplicacion?: string | null): string {
  const titulo = d.title_en || d.title;
  const partes: string[] = [];

  // ── Gancho ──
  partes.push(
    d.hook_en
      ? `We're looking for a ${titulo} ${d.hook_en.replace(/^to\s+/i, "to ")}!`
      : `We're looking for a ${titulo} to join our team!`,
  );

  partes.push(QUIENES_SOMOS);

  const cuerpo = d.description_en || d.description;
  if (cuerpo) partes.push(cuerpo.trim());

  // ── Qué vas a hacer ──
  // Van separadas del párrafo de contexto y con línea en blanco entre cada
  // una: así se lee en LinkedIn, que colapsa los saltos simples.
  const hacer = aViñetas(d.responsibilities_en || d.responsibilities);
  if (hacer.length) {
    partes.push("What You'll Do\n\n" + hacer.join("\n\n"));
  }

  // ── Requisitos ──
  const reqs = aViñetas(d.requirements_en || d.requirements);
  if (reqs.length) {
    partes.push("Requirements\n\n" + reqs.join("\n"));
  }

  // ── Nice to have ──
  const nice = aViñetas(d.nice_to_have_en || d.nice_to_have);
  if (nice.length) {
    partes.push("Nice to Have\n\n" + nice.join("\n"));
  }

  // ── Datos duros ──
  const duros: string[] = [];
  const modo = modalidadEn(d.work_mode);
  if (d.location) duros.push(`📍 ${d.location}${modo ? ` (${modo})` : ""}`);
  if (d.salary_public) duros.push(`💰 ${d.salary_public}`);
  if (duros.length) partes.push(duros.join("\n"));

  // ── Cómo aplicar ──
  const correo = d.apply_email || CORREO_POR_DEFECTO;
  const aplicar = urlAplicacion
    ? `📬 Does this sound like you? Apply here: ${urlAplicacion}\n\nOr send your CV to ${correo}\nSubject: ${titulo} – [Your Name]`
    : `📬 Does this sound like you? Send your CV to ${correo}\n\nSubject: ${titulo} – [Your Name]`;
  partes.push(aplicar);

  partes.push(
    "Know someone who's a perfect fit? Tag them or share this post — you might open a great door for them! 🙌",
  );

  partes.push(hashtags(d).join("\n"));

  return partes.join("\n\n");
}
