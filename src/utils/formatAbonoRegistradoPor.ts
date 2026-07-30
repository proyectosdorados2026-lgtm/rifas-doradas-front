export function formatAbonoRegistradoPor(
  nombre?: string | null,
  gateway?: string | null
): string {
  if (nombre?.trim()) return nombre.trim()
  if (gateway?.toUpperCase() === 'WOMPI') return 'Cliente (pago en línea)'
  return 'No registrado'
}
