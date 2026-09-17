/**
 * De un celular como lo escribe la gente a lo que espera wa.me.
 *
 * Vive aparte del endpoint porque un archivo de ruta de Next solo puede
 * exportar sus handlers: cualquier otra exportación rompe el build, y `tsc`
 * no lo detecta. Además así se puede probar sin levantar el servidor.
 *
 * Colombia son 10 dígitos que arrancan en 3. Si no tiene forma de celular
 * colombiano se devuelve null y el que llama decide qué hacer: armar un enlace
 * con un número inventado abre un chat con un desconocido.
 */
export function aWhatsapp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = String(raw).replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('3')) return '57' + d;
  if (d.length === 12 && d.startsWith('573')) return d;
  if (d.length === 13 && d.startsWith('0573')) return d.slice(1);
  return null;
}
