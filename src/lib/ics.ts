/**
 * Generador de archivos .ics (iCalendar) para invitaciones de entrevista.
 * Compatible con Google Calendar, Outlook, Apple Calendar.
 */

export type IcsEvent = {
  uid: string;
  title: string;
  description: string;
  start: Date;
  durationMinutes: number;
  location?: string;
  meetingUrl?: string;
  organizer: { name: string; email: string };
  attendees: { name?: string; email: string }[];
};

function formatDateUTC(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

function escape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildIcs(ev: IcsEvent): string {
  const dtStart = formatDateUTC(ev.start);
  const dtEnd = formatDateUTC(new Date(ev.start.getTime() + ev.durationMinutes * 60 * 1000));
  const dtStamp = formatDateUTC(new Date());

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trading Solutions//ATS//ES',
    'METHOD:REQUEST',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${ev.uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escape(ev.title)}`,
    `DESCRIPTION:${escape(ev.description)}`,
  ];

  if (ev.location) lines.push(`LOCATION:${escape(ev.location)}`);
  if (ev.meetingUrl) lines.push(`URL:${ev.meetingUrl}`);

  lines.push(`ORGANIZER;CN=${escape(ev.organizer.name)}:mailto:${ev.organizer.email}`);

  ev.attendees.forEach(a => {
    const cn = a.name ? `CN=${escape(a.name)}` : '';
    lines.push(`ATTENDEE;${cn};RSVP=TRUE:mailto:${a.email}`);
  });

  lines.push(
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Recordatorio: ${escape(ev.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  );

  return lines.join('\r\n');
}

/**
 * Genera link de Google Calendar "create event" prerrellenado.
 */
export function buildGoogleCalendarUrl(ev: IcsEvent): string {
  const start = formatDateUTC(ev.start).replace(/[-:]/g, '');
  const end = formatDateUTC(new Date(ev.start.getTime() + ev.durationMinutes * 60 * 1000)).replace(/[-:]/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${start}/${end}`,
    details: ev.description,
    location: ev.location || ev.meetingUrl || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
