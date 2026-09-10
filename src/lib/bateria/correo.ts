/**
 * Correo de invitacion a la bateria.
 *
 * Vive aparte de la ruta a proposito: el mismo texto tiene que servir para la
 * vista previa, para el borrador de Gmail y para el envio real. Si cada uno
 * armara su propio HTML, lo que Kelly aprueba en pantalla no seria lo que le
 * llega al candidato.
 *
 * Lo que dice el correo tiene que coincidir con lo que dice la pantalla de
 * consentimiento, o el consentimiento deja de ser informado:
 *  - 90 minutos, cinco partes, una sola sesion.
 *  - La modalidad remota exige camara activa. Quien no quiera, presencial.
 *  - Un enlace por persona. No se puede retomar despues de cerrar.
 */

export type DatosCorreo = {
  nombre: string | null;
  vacante: string | null;
  url: string;
  remitente?: string;
  firma?: string;
};

const AZUL = '#2C64ED';

/** Primer nombre: "Buenos días, María Fernanda Gómez" suena a base de datos. */
function primerNombre(n: string | null): string {
  const limpio = (n ?? '').trim();
  if (!limpio) return '';
  return limpio.split(/\s+/)[0];
}

export function asuntoBateria(vacante: string | null): string {
  return vacante
    ? `Trading Solutions · Prueba de selección para ${vacante}`
    : 'Trading Solutions · Prueba de selección';
}

/** Version en texto plano, para clientes de correo que no muestran HTML. */
export function textoBateria(d: DatosCorreo): string {
  const hola = primerNombre(d.nombre) ? `Hola ${primerNombre(d.nombre)},` : 'Hola,';
  return [
    hola,
    '',
    d.vacante
      ? `Avanzaste a la siguiente etapa del proceso para ${d.vacante} en Trading Solutions.`
      : 'Avanzaste a la siguiente etapa del proceso de selección en Trading Solutions.',
    '',
    'El siguiente paso es una prueba que nos ayuda a entender cómo trabajas: cómo decides, qué te sostiene en un trabajo y cómo razonas con información incompleta. No es un examen y no hay respuestas correctas.',
    '',
    `Tu enlace personal: ${d.url}`,
    '',
    'Antes de empezar, ten en cuenta:',
    '· Toma alrededor de 90 minutos y se responde en una sola sesión. No se puede pausar y retomar después.',
    '· Necesitas computador con internet estable. Desde el celular no se ve bien.',
    '· En modalidad remota la cámara debe estar activa durante toda la prueba. Si prefieres no habilitarla, respóndeme este correo y te agendamos para presentarla presencial en nuestras oficinas.',
    '· Busca un espacio tranquilo y sin interrupciones antes de abrir el enlace.',
    '· El enlace es personal e intransferible, y sirve una sola vez.',
    '· Responde con tu primera reacción. Las respuestas se guardan solas.',
    '',
    'Al abrir el enlace vas a ver primero la autorización de tratamiento de datos (Ley 1581 de 2012). Léela con calma: sin esa autorización la prueba no inicia.',
    '',
    'Cualquier duda, respóndeme este mismo correo.',
    '',
    d.firma ?? 'Kelly Castañeda',
    'Talento Humano · Trading Solutions',
  ].join('\n');
}

export function htmlBateria(d: DatosCorreo): string {
  const nombre = primerNombre(d.nombre);
  const hola = nombre ? `Hola <strong>${nombre}</strong>,` : 'Hola,';
  const intro = d.vacante
    ? `Avanzaste a la siguiente etapa del proceso para <strong>${d.vacante}</strong> en Trading Solutions.`
    : 'Avanzaste a la siguiente etapa del proceso de selección en Trading Solutions.';

  const punto = (txt: string) =>
    `<li style="margin:0 0 9px;line-height:1.55">${txt}</li>`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif;color:#0A0A0A">
  <div style="max-width:600px;margin:0 auto;background:#ffffff">

    <div style="background:${AZUL};padding:26px 32px">
      <p style="margin:0;color:#ffffff;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700">Trading Solutions</p>
      <p style="margin:6px 0 0;color:#ffffff;font-size:19px;font-weight:600">Prueba de selección</p>
    </div>

    <div style="padding:30px 32px">
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6">${hola}</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6">${intro}</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6">
        El siguiente paso es una prueba que nos ayuda a entender <strong>cómo trabajas</strong>:
        cómo decides, qué te sostiene en un trabajo y cómo razonas con información incompleta.
        No es un examen y no hay respuestas correctas.
      </p>

      <p style="margin:0 0 24px;text-align:center">
        <a href="${d.url}" style="display:inline-block;background:${AZUL};color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:8px;font-weight:600;font-size:16px">Iniciar la prueba</a>
      </p>

      <div style="background:#EEF3FE;border:1px solid #C7D9FB;border-radius:8px;padding:16px 18px;margin:0 0 20px">
        <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${AZUL};font-weight:700">Antes de empezar</p>
        <ul style="margin:0;padding-left:18px;font-size:14px;color:#374151">
          ${punto('Toma alrededor de <strong>90 minutos</strong> y se responde en <strong>una sola sesión</strong>. No se puede pausar y retomar después.')}
          ${punto('Necesitas <strong>computador</strong> con internet estable. Desde el celular no se ve bien.')}
          ${punto('En modalidad remota <strong>la cámara debe estar activa</strong> durante toda la prueba. Si prefieres no habilitarla, respóndeme este correo y te agendamos para presentarla <strong>presencial</strong> en nuestras oficinas.')}
          ${punto('Busca un espacio tranquilo y sin interrupciones <em>antes</em> de abrir el enlace.')}
          ${punto('El enlace es <strong>personal e intransferible</strong> y sirve una sola vez.')}
          ${punto('Responde con tu primera reacción. Las respuestas se guardan solas.')}
        </ul>
      </div>

      <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#374151">
        Al abrir el enlace vas a ver primero la <strong>autorización de tratamiento de datos</strong>
        (Ley 1581 de 2012). Léela con calma: sin esa autorización la prueba no inicia.
      </p>
      <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#374151">
        Cualquier duda, respóndeme este mismo correo.
      </p>

      <p style="margin:0;font-size:15px;line-height:1.6">
        ${d.firma ?? 'Kelly Castañeda'}<br>
        <span style="color:#6B7280;font-size:13.5px">Talento Humano · Trading Solutions</span>
      </p>
    </div>

    <div style="padding:18px 32px 26px;border-top:1px solid #E5E7EB">
      <p style="margin:0;font-size:11.5px;color:#9CA3AF;line-height:1.6">
        Enlace personal, generado para ti. Si no eres ${nombre || 'la persona destinataria'}, por favor ignora este correo.<br>
        Si el botón no abre, copia esta dirección en tu navegador:<br>
        <span style="color:#6B7280;word-break:break-all">${d.url}</span>
      </p>
    </div>

  </div>
</body></html>`;
}
