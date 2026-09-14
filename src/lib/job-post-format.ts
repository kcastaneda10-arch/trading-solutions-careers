/**
 * El formato de publicación de Trading Solutions, en un solo lugar.
 *
 * POR QUÉ ESTE ARCHIVO
 * El agente `job-writer` traía un formato genérico —secciones con ##, sin
 * emojis, sin CTA— que no es el que la compañía publica. Los avisos reales
 * llevan titular con gancho, párrafo de compañía, párrafo de rol con cifras,
 * las tres secciones, la línea de ubicación y salario, el correo de postulación
 * y los hashtags. Este archivo es la referencia contra la cual se redacta, para
 * que no vuelva a haber dos formatos vivos al mismo tiempo.
 */

export const TS_BRAND = `
Trading Solutions es un freight forwarder boutique con operación en más de 10 países
(Maritime, Ground, Air, Customs). Sede principal en Barranquilla, Colombia; oficinas
en Estados Unidos y Asia.

Cifras verificadas que pueden usarse en el aviso:
- +300 clientes activos
- +52.000 TEUs marítimos al año
- +500 toneladas Air & Land

Tono: ambicioso, profesional, internacional, mentalidad de dueño. Habla de construir,
escalar y mover el mundo — no de "ocupar un puesto".
Cultura: crecimiento acelerado, alcance internacional, aprendizaje continuo,
bienestar integral, reconocimiento.
`.trim();

/**
 * La plantilla se describe con el aviso real de Export Operations Executive
 * como referencia. Es más confiable mostrar un ejemplo que enumerar reglas:
 * el modelo copia el registro, el largo de los bullets y el nivel de detalle.
 */
export const TS_POST_FORMAT = `
ESTRUCTURA EXACTA, EN ESTE ORDEN:

1. TITULAR
   "We're looking for a/an [Cargo] to join our team!!"
   (en español: "¡Estamos buscando un/una [Cargo] para unirse a nuestro equipo!")

2. PÁRRAFO DE COMPAÑÍA (2-3 frases)
   Qué es Trading Solutions y qué está redefiniendo. Tecnología, visibilidad en
   tiempo real, coordinación entre continentes.

3. PÁRRAFO DE ROL (3-4 frases)
   Qué hace este cargo, con cifras reales de la operación (+300 clientes,
   +52.000 TEUs). Debe dejar claro de qué es dueño y qué sostiene.

4. "What You'll Do" / "Lo que harás" / "你的职责"
   7-9 bullets. Cada uno arranca con verbo activo y cierra con el impacto o el
   para qué. Específicos: nombra sistemas, documentos y procesos reales
   (HBL, VGM, AMS/ISF, CargoWise). Nada genérico.

5. "Requirements" / "Requisitos" / "任职要求"
   6-8 bullets: formación, años y tipo de experiencia, herramientas concretas,
   nivel de inglés con letra (B2+, C1), y una o dos de mentalidad.

6. "Nice to Have" / "Deseable" / "加分项"
   2-4 bullets de lo que suma pero no descarta.

7. LÍNEA DE CIERRE
   📍 [Ciudad] ([Modalidad])   💰 [Salario o "Negotiable"]
   📬 Does this sound like you? Send your CV to jointheteam@tradingsolutions.com
   Subject: [Cargo] – [Your Name]

8. CTA DE REFERIDOS (1 frase)
   "Know someone who's a perfect fit? Tag them or share this post — you might
   open a great door for them! 🙌"

9. HASHTAGS
   6-8, sin espacios, mezclando cargo, industria y ciudad.
   Ej: #ExportOperations #FreightForwarding #InternationalLogistics #Barranquilla #NowHiring

REGLAS DE REDACCIÓN
- Los emojis de la línea de cierre (📍 💰 📬 🙌) van siempre. En el cuerpo, ninguno.
- Nunca usar "rockstar", "ninja", "crack", "guerrero", "sinergia".
- Cada bullet específico: herramienta, documento, sistema o métrica con nombre propio.
- No inventes cifras de negocio: usa solo las del bloque de marca.
- No inventes requisitos regulatorios que no vengan en el input del líder.
- El correo de postulación es siempre jointheteam@tradingsolutions.com.
`.trim();

export const INSTRUCCION_IDIOMA: Record<"es" | "en" | "zh", string> = {
  es: `Español neutro profesional (Colombia / LatAm). Los nombres de sistemas y
documentos de industria se dejan en inglés (Bill of Lading, VGM, CargoWise, TMS).
Los encabezados de sección van en español.`,

  en: `Professional international English. This is the reference version — the
other two are written to match its substance, not to translate it word for word.`,

  zh: `中文简体 (mandarín simplificado), registro profesional de reclutamiento para
el mercado chino. Los términos técnicos de logística internacional se dejan en
inglés entre paréntesis la primera vez que aparecen — así los lee un profesional
del sector en Shanghái. Los encabezados de sección van en chino. La línea de
postulación y los hashtags quedan en inglés.`,
};

export type IdiomaPost = "es" | "en" | "zh";

export const NOMBRE_IDIOMA: Record<IdiomaPost, string> = {
  es: "Español",
  en: "English",
  zh: "中文",
};
