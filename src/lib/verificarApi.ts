import { API_BASE_URL } from '@/config/api'

export interface VerificacionData {
  boleta: {
    numero: number
    numeros?: number[]
    estado: string
    barcode: string
    fecha_compra: string
  }
  rifa: {
    nombre: string
    descripcion: string | null
    precio_boleta: number
    fecha_sorteo: string | null
    premio_principal: string | null
    total_boletas: number
    imagen_url: string | null
    estado: string
    terminos_condiciones: string | null
  }
  cliente: {
    nombre: string
    identificacion: string | null
  } | null
  financiero: {
    monto_total: number
    abono_total: number
    saldo_pendiente: number
    estado: string
    metodo_pago: string
    porcentaje_pagado: number
  } | null
  abonos: Array<{
    monto: number
    moneda: string
    estado: string
    referencia: string | null
    metodo_pago: string | null
    fecha: string
    observaciones: string | null
  }>
  verificado_en: string
}

export async function verificarBoleta(hash: string): Promise<VerificacionData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/verificar/${hash}`, {
      cache: 'no-store',
    })

    if (!res.ok) return null

    const json = await res.json()
    if (!json.success) return null

    return json.data as VerificacionData
  } catch {
    return null
  }
}
