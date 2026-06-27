import { API_BASE_URL } from '@/config/api'
import { HistorialListResponse } from '@/types/historial'

export interface HistorialFilters {
  limit?: number
  offset?: number
  entidad?: 'BOLETA' | 'ABONO' | 'VENTA' | ''
  accion?: string
  rifaId?: string
}

class HistorialApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }
    return data
  }

  private buildParams(filters: HistorialFilters = {}) {
    const params = new URLSearchParams()
    if (filters.limit != null) params.set('limit', String(filters.limit))
    if (filters.offset != null) params.set('offset', String(filters.offset))
    if (filters.entidad) params.set('entidad', filters.entidad)
    if (filters.accion) params.set('accion', filters.accion)
    if (filters.rifaId) params.set('rifaId', filters.rifaId)
    return params
  }

  async getRecientes(filters: HistorialFilters = {}): Promise<HistorialListResponse> {
    const params = this.buildParams(filters)
    const response = await fetch(`${API_BASE_URL}/api/historial/recientes?${params}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<HistorialListResponse>(response)
  }

  async getByCliente(clienteId: string, filters: HistorialFilters = {}): Promise<HistorialListResponse> {
    const params = this.buildParams(filters)
    const response = await fetch(`${API_BASE_URL}/api/historial/cliente/${clienteId}?${params}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<HistorialListResponse>(response)
  }

  async getByNumero(rifaId: string, numero: number, filters: HistorialFilters = {}): Promise<HistorialListResponse> {
    const params = this.buildParams(filters)
    const response = await fetch(
      `${API_BASE_URL}/api/historial/rifa/${rifaId}/numero/${numero}?${params}`,
      { headers: this.getAuthHeaders() }
    )
    return this.handleResponse<HistorialListResponse>(response)
  }
}

export const historialApi = new HistorialApiService()

export const ACCION_LABELS: Record<string, string> = {
  ASIGNAR_CLIENTE: 'Cliente asignado',
  LIBERAR_CLIENTE: 'Cliente liberado',
  CAMBIAR_CLIENTE: 'Cambio de cliente',
  RESERVAR_BOLETA: 'Boleta reservada',
  LIBERAR_BOLETA: 'Boleta liberada',
  VINCULAR_VENTA: 'Venta vinculada',
  DESVINCULAR_VENTA: 'Venta desvinculada',
  CAMBIO_ESTADO: 'Cambio de estado',
  CAMBIO_BLOQUEO: 'Cambio de bloqueo',
  ACTUALIZACION_BOLETA: 'Actualización de boleta',
  CREAR_BOLETA: 'Boleta creada',
  ABONO_REGISTRADO: 'Abono registrado',
  ABONO_CONFIRMADO: 'Abono confirmado',
  ABONO_ANULADO: 'Abono anulado',
  ABONO_MODIFICADO: 'Abono modificado',
  ABONO_ACTUALIZADO: 'Abono actualizado',
  CAMBIO_ESTADO_VENTA: 'Cambio estado venta',
}

export const ENTIDAD_LABELS: Record<string, string> = {
  BOLETA: 'Boleta',
  ABONO: 'Abono',
  VENTA: 'Venta',
}

export function labelAccion(accion: string): string {
  return ACCION_LABELS[accion] || accion.replace(/_/g, ' ').toLowerCase()
}
