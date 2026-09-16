/**
 * Adjuntos de la ficha del candidato.
 *
 * Un proceso de selección produce evidencia —la hoja del caso, el registro del
 * evaluador, la verificación de referencias— y esa evidencia hoy se queda en el
 * computador de quien la produjo. Aquí se define qué se puede guardar y con qué
 * límites; el resto (bucket privado, URL firmada) lo hace el endpoint.
 */

export const TIPOS_ADJUNTO = [
  { id: 'assessment', label: 'Evidencia de assessment' },
  { id: 'caso',       label: 'Caso escrito' },
  { id: 'registro',   label: 'Hoja de registro del evaluador' },
  { id: 'hv',         label: 'Hoja de vida' },
  { id: 'referencia', label: 'Verificación de referencias' },
  { id: 'soporte',    label: 'Soporte o certificado' },
  { id: 'otro',       label: 'Otro' },
] as const;

export type TipoAdjunto = (typeof TIPOS_ADJUNTO)[number]['id'];

export function esTipoValido(kind: string): boolean {
  return TIPOS_ADJUNTO.some((t) => t.id === kind);
}

export function etiquetaTipo(kind: string): string {
  return TIPOS_ADJUNTO.find((t) => t.id === kind)?.label ?? 'Otro';
}

/** Extensión por MIME. Lo que no esté aquí no se sube. */
export const MIMES_PERMITIDOS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
};

export const MAX_BYTES_ADJUNTO = 20 * 1024 * 1024;

export function pesoLegible(bytes?: number | null): string {
  if (!bytes || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Nombre de archivo seguro para el path del bucket. */
export function slugArchivo(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .toLowerCase() || 'documento';
}
