// Configuración de medios de pago — Sueños Dorados (única cuenta para todos los roles)

import { TokenManager } from '@/utils/auth'
import { SUENOS_DORADOS_CONTACT } from '@/config/rifasDoradasContact'

interface PaymentInfo {
  llave: string | null
  cuentaBancolombia: string
  titular: string
  whatsapp: string | null
}

const SUENOS_DORADOS_PAYMENT: PaymentInfo = {
  llave: SUENOS_DORADOS_CONTACT.llaveBreve,
  cuentaBancolombia: SUENOS_DORADOS_CONTACT.cuentaBancolombia,
  titular: SUENOS_DORADOS_CONTACT.titular,
  whatsapp: SUENOS_DORADOS_CONTACT.whatsappDisplay.replace(/\s/g, ''),
}

export function getPaymentInfo(): PaymentInfo {
  void TokenManager.getUser()
  return SUENOS_DORADOS_PAYMENT
}

/**
 * Genera el bloque de texto de medios de pago para mensajes de WhatsApp.
 */
export function getMediosDePagoTexto(): string {
  const info = getPaymentInfo()
  let texto = `*Cómo pagar (Sueños Dorados)*\n`
  if (info.llave) {
    texto += `💰 Llave Bre-B: ${info.llave}\n`
  }
  texto += `💰 Bancolombia ahorros: ${info.cuentaBancolombia}\n`
  texto += `A nombre de: ${info.titular}\n`
  texto += `📲 WhatsApp: ${SUENOS_DORADOS_CONTACT.whatsappDisplay}\n`
  texto += `\nCuando pagues, envíanos el comprobante por este chat ✅`
  return texto
}

export function getMediosDePagoBloque(): string {
  return `\n\n${getMediosDePagoTexto()}`
}
