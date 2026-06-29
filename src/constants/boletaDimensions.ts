/** Panel izquierdo (QR, estado, número) */
export const BOLETA_LEFT_WIDTH = 210

/** Panel derecho (arte de la rifa) */
export const BOLETA_RIGHT_WIDTH = 590

/** Ancho total del ticket */
export const BOLETA_WIDTH = BOLETA_LEFT_WIDTH + BOLETA_RIGHT_WIDTH

/**
 * Altura por defecto según arte oficial (2504×1417 px en storage).
 * 590 × (1417/2504) ≈ 334
 */
export const BOLETA_DEFAULT_HEIGHT = Math.round(
  BOLETA_RIGHT_WIDTH * (1417 / 2504)
)

/** Calcula la altura del ticket para que el arte llene el panel sin márgenes. */
export function boletaHeightForImage(naturalWidth: number, naturalHeight: number): number {
  if (!naturalWidth || !naturalHeight) return BOLETA_DEFAULT_HEIGHT
  return Math.round(BOLETA_RIGHT_WIDTH * (naturalHeight / naturalWidth))
}
