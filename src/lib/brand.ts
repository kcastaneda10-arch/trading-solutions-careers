/**
 * MARCA · el logo, en un solo lugar
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 * La URL del logo estaba escrita a mano en cinco pantallas y ninguna de las
 * dos versiones del CDN servía: las dos son cuadrados OPACOS con solo el
 * símbolo. El `.jpg` mostraba su fondo gris sobre la barra blanca; el `.png`,
 * invertido para el pie negro, se volvía un cuadrado blanco sólido. Ninguno
 * traía el logotipo completo ni transparencia.
 *
 * El archivo de acá es el logotipo completo —símbolo más palabra— recortado y
 * con fondo transparente de verdad, servido desde el propio sitio. Se guarda
 * en negro: sobre fondo oscuro se invierte con CSS, así hay un solo archivo
 * que mantener.
 *
 * Servirlo local y no desde el CDN de la web corporativa también quita una
 * dependencia: si allá reorganizan los archivos, la página de empleo no se
 * queda sin logo.
 */

/** Logotipo completo (símbolo + palabra), negro sobre fondo transparente. */
export const LOGO_TS = "/logo-trading-solutions.png";

/**
 * Solo el símbolo, recortado del mismo archivo para que no se desincronicen.
 *
 * Va en la barra de navegación: ahí el nombre de la compañía ya aparece en el
 * título de la página y en el contenido, así que el logotipo completo repetía
 * la palabra y competía con el menú. En el pie sigue el logotipo entero, que
 * es donde cierra la marca.
 */
export const LOGO_TS_SIMBOLO = "/logo-trading-solutions-simbolo.png";

/**
 * Sobre fondo negro se invierte con CSS en vez de servir un segundo archivo:
 * `brightness-0 invert` deja el logo blanco sólido sea cual sea el color de
 * origen, así que sigue funcionando si mañana cambia el archivo.
 */
export const LOGO_TS_CLASE_EN_OSCURO = "brightness-0 invert";
