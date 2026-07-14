import { API_BASE_URL } from '@/config/api'

const BASE = `${API_BASE_URL}/api/superadmin/ventas`

export interface SAVentaResumen {
  venta_id: string
  monto_total: string
  abono_total: string
  saldo_pendiente: string
  estado_venta: string
  created_at: string
  cliente_id: string
  cliente_nombre: string
  cliente_identificacion: string | null
  cliente_telefono: string | null
  rifa_id: string
  rifa_nombre: string
  precio_boleta: string
  num_boletas: number
}

export interface SAVentaCabecera {
  venta_id: string
  monto_total: string
  abono_total: string
  saldo_pendiente: string
  estado_venta: string
  medio_pago_id: string | null
  gateway_pago: string | null
  es_venta_online: boolean
  created_at: string
  updated_at: string
  cliente_id: string
  cliente_nombre: string
  cliente_identificacion: string | null
  cliente_telefono: string | null
  cliente_email: string | null
  rifa_id: string
  rifa_nombre: string
  rifa_estado: string
  precio_boleta: string
  medio_pago_nombre: string | null
}

export interface SABoleta {
  boleta_id: string
  numero: number
  numeros?: number[]
  estado: string
  pagado_boleta: string
}

export interface SAAbono {
  abono_id: string
  monto: string
  estado: string
  gateway_pago: string | null
  medio_pago_id: string | null
  referencia: string | null
  notas: string | null
  created_at: string
  boleta_id: string | null
  boleta_numero: number | null
  boleta_numeros?: number[] | null
  medio_pago_nombre: string | null
  registrado_por_nombre: string | null
}

export interface SAMedioPago {
  id: string
  nombre: string
}

export interface SAVentaDetalle {
  venta: SAVentaCabecera
  boletas: SABoleta[]
  abonos: SAAbono[]
  medios_pago: SAMedioPago[]
}

class SuperadminVentasApi {
  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async fetchWithTimeout(input: string, init: RequestInit = {}, timeoutMs = 60000): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(input, { ...init, signal: controller.signal })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('El servidor tardó demasiado en responder. Intenta de nuevo.')
      }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }

  private async handle<T>(response: Response): Promise<T> {
    const data = await response.json()
    if (!response.ok) {
      if (data.error === 'Validation Error' && data.details) {
        const msg = data.details.map((d: any) => `${d.field}: ${d.message}`).join(', ')
        throw new Error(msg)
      }
      throw new Error(data.message || `Error ${response.status}`)
    }
    return data.data as T
  }

  async buscar(q: string): Promise<SAVentaResumen[]> {
    const res = await this.fetchWithTimeout(`${BASE}/buscar?q=${encodeURIComponent(q)}`, {
      headers: this.getAuthHeaders(),
    })
    return this.handle<SAVentaResumen[]>(res)
  }

  async getDetalle(ventaId: string): Promise<SAVentaDetalle> {
    const res = await this.fetchWithTimeout(`${BASE}/${ventaId}`, { headers: this.getAuthHeaders() })
    return this.handle<SAVentaDetalle>(res)
  }

  async editarAbono(abonoId: string, body: { monto?: number; medio_pago_id?: string }): Promise<SAVentaDetalle> {
    const res = await this.fetchWithTimeout(`${BASE}/abonos/${abonoId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    })
    return this.handle<SAVentaDetalle>(res)
  }

  async anularAbono(abonoId: string, motivo?: string): Promise<SAVentaDetalle> {
    const res = await this.fetchWithTimeout(`${BASE}/abonos/${abonoId}/anular`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ motivo }),
    })
    return this.handle<SAVentaDetalle>(res)
  }

  async agregarAbono(
    ventaId: string,
    body: { monto: number; medio_pago_id?: string; boleta_id?: string; notas?: string }
  ): Promise<SAVentaDetalle> {
    const res = await this.fetchWithTimeout(`${BASE}/${ventaId}/abonos`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    })
    return this.handle<SAVentaDetalle>(res)
  }

  async liberarBoleta(boletaId: string, motivo?: string): Promise<SAVentaDetalle> {
    const res = await this.fetchWithTimeout(`${BASE}/boletas/${boletaId}/liberar`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ motivo }),
    })
    return this.handle<SAVentaDetalle>(res)
  }

  async agregarBoleta(ventaId: string, boletaId: string): Promise<SAVentaDetalle> {
    const res = await this.fetchWithTimeout(`${BASE}/${ventaId}/boletas`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ boleta_id: boletaId }),
    })
    return this.handle<SAVentaDetalle>(res)
  }

  async cambiarMedioPago(ventaId: string, medioPagoId: string): Promise<SAVentaDetalle> {
    const res = await this.fetchWithTimeout(`${BASE}/${ventaId}/medio-pago`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ medio_pago_id: medioPagoId }),
    })
    return this.handle<SAVentaDetalle>(res)
  }

  async cambiarEstado(ventaId: string, estado: string): Promise<SAVentaDetalle> {
    const res = await this.fetchWithTimeout(`${BASE}/${ventaId}/estado`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ estado }),
    })
    return this.handle<SAVentaDetalle>(res)
  }

  async reasignarCliente(ventaId: string, clienteId: string): Promise<SAVentaDetalle> {
    const res = await this.fetchWithTimeout(`${BASE}/${ventaId}/cliente`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ cliente_id: clienteId }),
    })
    return this.handle<SAVentaDetalle>(res)
  }

  async eliminarVenta(ventaId: string): Promise<{ deleted: boolean; venta_id: string; boletas_liberadas: number }> {
    const res = await this.fetchWithTimeout(`${BASE}/${ventaId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
    return this.handle(res)
  }
}

export const superadminVentasApi = new SuperadminVentasApi()
