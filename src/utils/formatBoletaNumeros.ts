/** Formatea uno o varios números de boleta: `#2809 · #7633` */
export function formatBoletaNumeros(
  numeros: number[] | null | undefined,
  fallback?: number | null
): string {
  const list =
    Array.isArray(numeros) && numeros.length > 0
      ? numeros
      : fallback != null
        ? [fallback]
        : []
  if (list.length === 0) return '—'
  return list.map((n) => `#${String(n).padStart(4, '0')}`).join(' · ')
}

/** True si el término de búsqueda coincide con alguno de los números (con o sin ceros). */
export function searchMatchesNumeros(
  numeros: number[] | null | undefined,
  term: string,
  fallbackNumero?: number | null
): boolean {
  const raw = (term || '').replace(/^#/, '').trim()
  if (!raw) return true
  const list =
    Array.isArray(numeros) && numeros.length > 0
      ? numeros
      : fallbackNumero != null
        ? [fallbackNumero]
        : []
  const terminoLimpio = raw.replace(/^0+/, '') || '0'
  return list.some((n) => {
    const numStr = String(n)
    const padded = numStr.padStart(4, '0')
    return (
      numStr.includes(terminoLimpio) ||
      padded.includes(raw) ||
      padded.includes(terminoLimpio) ||
      numStr === raw ||
      padded === raw
    )
  })
}

export function normalizeNumeros(
  numeros: number[] | null | undefined,
  fallback?: number | null
): number[] {
  if (Array.isArray(numeros) && numeros.length > 0) {
    return numeros.map(Number)
  }
  if (fallback != null) return [Number(fallback)]
  return []
}
