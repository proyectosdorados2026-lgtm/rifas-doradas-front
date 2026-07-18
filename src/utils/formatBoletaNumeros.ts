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

export function resolveNumeroPrincipal(
  numeros: number[] | null | undefined,
  fallbackNumero?: number | null,
  numeroPrincipal?: number | null
): number | null {
  const list = normalizeNumeros(numeros, fallbackNumero)
  if (numeroPrincipal != null && list.includes(Number(numeroPrincipal))) {
    return Number(numeroPrincipal)
  }
  if (fallbackNumero != null) return Number(fallbackNumero)
  return list[0] ?? null
}

export function orderNumerosByPrincipal(
  numeros: number[] | null | undefined,
  fallbackNumero?: number | null,
  numeroPrincipal?: number | null
): number[] {
  const list = normalizeNumeros(numeros, fallbackNumero)
  const principal = resolveNumeroPrincipal(list, fallbackNumero, numeroPrincipal)
  if (principal == null || !list.includes(principal)) return list
  return [principal, ...list.filter((n) => n !== principal)]
}

export function getPrincipalGift(
  numeros: number[] | null | undefined,
  fallbackNumero?: number | null,
  numeroPrincipal?: number | null
): { principal: number | null; gift: number | null; ordered: number[] } {
  const ordered = orderNumerosByPrincipal(numeros, fallbackNumero, numeroPrincipal)
  return {
    principal: ordered[0] ?? null,
    gift: ordered[1] ?? null,
    ordered,
  }
}
