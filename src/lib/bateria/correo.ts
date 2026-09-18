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

/** El correo lo firma el equipo, no una persona: quien responda el hilo puede
 *  ser cualquiera de reclutamiento, y el candidato no queda esperando a Kelly. */
export const FIRMA = 'Talent Acquisition Team';

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
    'El siguiente paso es una prueba que nos ayuda a conocerte mejor.',
    '',
    `Tu enlace personal: ${d.url}`,
    '',
    'Antes de empezar, ten en cuenta:',
    '· Toma alrededor de 90 minutos y se responde en una sola sesión. No se puede pausar y retomar después.',
    '· Necesitas computador con internet estable. Desde el celular no se ve bien.',
    '· En modalidad remota la cámara debe estar activa durante toda la prueba. Si prefieres no habilitarla, responde este correo y te agendamos para presentarla presencial en nuestras oficinas.',
    '· Busca un espacio tranquilo y sin interrupciones antes de abrir el enlace.',
    '· El enlace es personal e intransferible, y sirve una sola vez.',
    '· Responde con tu primera reacción. Las respuestas se guardan solas.',
    '',
    'Al abrir el enlace vas a ver primero la autorización de tratamiento de datos (Ley 1581 de 2012). Léela con calma: sin esa autorización la prueba no inicia.',
    '',
    'Cualquier duda, responde este mismo correo.',
    '',
    d.firma ?? FIRMA,
    'Trading Solutions',
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
        El siguiente paso es una prueba que nos ayuda a <strong>conocerte mejor</strong>.
      </p>

      <p style="margin:0 0 24px;text-align:center">
        <a href="${d.url}" style="display:inline-block;background:${AZUL};color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:8px;font-weight:600;font-size:16px">Iniciar la prueba</a>
      </p>

      <div style="background:#EEF3FE;border:1px solid #C7D9FB;border-radius:8px;padding:16px 18px;margin:0 0 20px">
        <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${AZUL};font-weight:700">Antes de empezar</p>
        <ul style="margin:0;padding-left:18px;font-size:14px;color:#374151">
          ${punto('Toma alrededor de <strong>90 minutos</strong> y se responde en <strong>una sola sesión</strong>. No se puede pausar y retomar después.')}
          ${punto('Necesitas <strong>computador</strong> con internet estable. Desde el celular no se ve bien.')}
          ${punto('En modalidad remota <strong>la cámara debe estar activa</strong> durante toda la prueba. Si prefieres no habilitarla, responde este correo y te agendamos para presentarla <strong>presencial</strong> en nuestras oficinas.')}
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
        Cualquier duda, responde este mismo correo.
      </p>

      <p style="margin:0;font-size:15px;line-height:1.6">
        ${d.firma ?? FIRMA}<br>
        <span style="color:#6B7280;font-size:13.5px">Trading Solutions</span>
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

/* ───────────────────────────────────────────────────────────────────────────
 * Version en ingles · procesos de China.
 *
 * Gemela exacta de la version en espanol: mismos datos, misma estructura,
 * mismos estilos. La unica diferencia de fondo es la pantalla de
 * consentimiento: la Ley 1581 de 2012 es colombiana y no le dice nada a un
 * candidato en Shenzhen, asi que el correo en ingles anuncia la pantalla de
 * consentimiento sin citar la ley.
 * ───────────────────────────────────────────────────────────────────────── */

/** El correo en ingles tambien lo firma el equipo, no una persona. */
export const FIRMA_EN = 'Talent Team';

export function asuntoBateriaEn(vacante: string | null): string {
  return vacante
    ? `Trading Solutions \u00b7 Selection assessment for ${vacante}`
    : 'Trading Solutions \u00b7 Selection assessment';
}

/** Version en texto plano, para clientes de correo que no muestran HTML. */
export function textoBateriaEn(d: DatosCorreo): string {
  const hola = primerNombre(d.nombre) ? `Hi ${primerNombre(d.nombre)},` : 'Hi,';
  return [
    hola,
    '',
    d.vacante
      ? `You have moved forward to the next stage of the process for ${d.vacante} at Trading Solutions.`
      : 'You have moved forward to the next stage of our selection process at Trading Solutions.',
    '',
    'The next step is an assessment that helps us get to know you better.',
    '',
    `Your personal link: ${d.url}`,
    '',
    'Before you start, please note:',
    '\u00b7 It takes around 90 minutes and is completed in a single session. You cannot pause it and resume later.',
    '\u00b7 You need a computer with a stable internet connection. It does not display properly on a phone.',
    '\u00b7 In remote mode your camera must stay on during the whole assessment. If you prefer not to turn it on, reply to this email and we will schedule you to take it on-site at our offices.',
    '\u00b7 Find a quiet space with no interruptions before you open the link.',
    '\u00b7 The link is personal, non-transferable, and works only once.',
    '\u00b7 Answer with your first reaction. Your answers are saved automatically.',
    '',
    'When you open the link you will first see the data processing consent screen. Read it carefully: the assessment does not start without your consent.',
    '',
    'If you have any questions, just reply to this email.',
    '',
    d.firma ?? FIRMA_EN,
    'Trading Solutions',
  ].join('\n');
}

export function htmlBateriaEn(d: DatosCorreo): string {
  const nombre = primerNombre(d.nombre);
  const hola = nombre ? `Hi <strong>${nombre}</strong>,` : 'Hi,';
  const intro = d.vacante
    ? `You have moved forward to the next stage of the process for <strong>${d.vacante}</strong> at Trading Solutions.`
    : 'You have moved forward to the next stage of our selection process at Trading Solutions.';

  const punto = (txt: string) =>
    `<li style="margin:0 0 9px;line-height:1.55">${txt}</li>`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Arial,sans-serif;color:#0A0A0A">
  <div style="max-width:600px;margin:0 auto;background:#ffffff">

    <div style="background:${AZUL};padding:26px 32px">
      <p style="margin:0;color:#ffffff;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700">Trading Solutions</p>
      <p style="margin:6px 0 0;color:#ffffff;font-size:19px;font-weight:600">Selection assessment</p>
    </div>

    <div style="padding:30px 32px">
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6">${hola}</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6">${intro}</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6">
        The next step is an assessment that helps us <strong>get to know you better</strong>.
      </p>

      <p style="margin:0 0 24px;text-align:center">
        <a href="${d.url}" style="display:inline-block;background:${AZUL};color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:8px;font-weight:600;font-size:16px">Start the assessment</a>
      </p>

      <div style="background:#EEF3FE;border:1px solid #C7D9FB;border-radius:8px;padding:16px 18px;margin:0 0 20px">
        <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${AZUL};font-weight:700">Before you start</p>
        <ul style="margin:0;padding-left:18px;font-size:14px;color:#374151">
          ${punto('It takes around <strong>90 minutes</strong> and is completed in <strong>a single session</strong>. You cannot pause it and resume later.')}
          ${punto('You need a <strong>computer</strong> with a stable internet connection. It does not display properly on a phone.')}
          ${punto('In remote mode <strong>your camera must stay on</strong> during the whole assessment. If you prefer not to turn it on, reply to this email and we will schedule you to take it <strong>on-site</strong> at our offices.')}
          ${punto('Find a quiet space with no interruptions <em>before</em> you open the link.')}
          ${punto('The link is <strong>personal and non-transferable</strong>, and works only once.')}
          ${punto('Answer with your first reaction. Your answers are saved automatically.')}
        </ul>
      </div>

      <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#374151">
        When you open the link you will first see the <strong>data processing consent</strong> screen.
        Read it carefully: the assessment does not start without your consent.
      </p>
      <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#374151">
        If you have any questions, just reply to this email.
      </p>

      <p style="margin:0;font-size:15px;line-height:1.6">
        ${d.firma ?? FIRMA_EN}<br>
        <span style="color:#6B7280;font-size:13.5px">Trading Solutions</span>
      </p>
    </div>

    <div style="padding:18px 32px 26px;border-top:1px solid #E5E7EB">
      <p style="margin:0;font-size:11.5px;color:#9CA3AF;line-height:1.6">
        Personal link, generated for you. If you are not ${nombre || 'the intended recipient'}, please ignore this email.<br>
        If the button does not open, copy this address into your browser:<br>
        <span style="color:#6B7280;word-break:break-all">${d.url}</span>
      </p>
    </div>

  </div>
</body></html>`;
}
