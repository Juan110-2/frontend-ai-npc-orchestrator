/**
 * Valida el parámetro `next` usado para redirigir tras el login.
 * Solo acepta rutas internas: deben empezar con una barra (no doble barra ni
 * barra seguida de contrabarra), sin esquema ni caracteres de control.
 * Si no es válida devuelve "/".
 */
export function safeNextPath(next: string | null | undefined): string {
  if (typeof next !== 'string' || next.length === 0) return '/'
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/'
  // Caracteres de control o contrabarras: los navegadores las normalizan y pueden derivar en "//".
  if (/[\u0000-\u001f\u007f\\]/.test(next)) return '/'
  try {
    // Contra un origen ficticio: si el origen resultante cambia, no era una ruta interna.
    const base = 'http://internal.invalid'
    const url = new URL(next, base)
    if (url.origin !== base) return '/'
  } catch {
    return '/'
  }
  return next
}
