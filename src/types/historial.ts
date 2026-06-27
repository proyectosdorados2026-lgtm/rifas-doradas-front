export type EntidadHistorial = 'BOLETA' | 'ABONO' | 'VENTA'

export interface MovimientoHistorial {
  id: string
  entidad: EntidadHistorial
  accion: string
  boleta_id: string | null
  rifa_id: string | null
  numero: number | null
  cliente_id: string | null
  cliente_id_anterior: string | null
  venta_id: string | null
  abono_id: string | null
  usuario_id: string | null
  estado_anterior: string | null
  estado_nuevo: string | null
  monto: string | number | null
  medio_pago_id: string | null
  origen: string
  notas: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  cliente_nombre: string | null
  cliente_identificacion: string | null
  cliente_anterior_nombre: string | null
  cliente_anterior_identificacion: string | null
  usuario_nombre: string | null
}

export interface HistorialListResponse {
  total: number
  limit: number
  offset: number
  movimientos: MovimientoHistorial[]
}
