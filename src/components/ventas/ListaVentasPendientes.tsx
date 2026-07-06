'use client'

import { useEffect, useState } from 'react'
import RegistrarAbono from './RegistrarAbono'
import { ventasApi } from '@/lib/ventasApi'

interface BoletaInfo {
  id: string
  numero: number
  estado: string
  rifa_nombre: string
}

interface VentaPendiente {
  id: number
  monto_total: number
  total_pagado: number
  saldo_pendiente: number
  estado_venta: string
  created_at: string
  boletas?: BoletaInfo[]
}

interface Props {
  clienteId?: string
  ventaIdDirecta?: string  // Si se pasa, ir directamente a RegistrarAbono sin listar
  boletaDestacada?: number   // Resaltar esta boleta en la lista (búsqueda por #)
  ventaDestacadaId?: string  // Resaltar la venta que contiene la boleta buscada
  onAbonoFinalizado?: () => void
}

export default function ListaVentasPendientes({
  clienteId,
  ventaIdDirecta,
  boletaDestacada,
  ventaDestacadaId,
  onAbonoFinalizado,
}: Props) {
  const [ventas, setVentas] = useState<VentaPendiente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ventaSeleccionada, setVentaSeleccionada] =
    useState<VentaPendiente | null>(null)

  // Si nos pasan ventaIdDirecta, ir directo a gestionar esa venta
  const [ventaDirecta, setVentaDirecta] = useState<string | null>(ventaIdDirecta || null)

  const fetchVentas = async () => {
    if (!clienteId) return

    try {
      setLoading(true)
      setError(null)

      const response = await ventasApi.getVentasPorCliente(clienteId)

      if (!response.success) {
        throw new Error(response.message)
      }

      setVentas(response.data)
    } catch (err: any) {
      setError(err.message || 'Error cargando ventas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!ventaDirecta) {
      fetchVentas()
    }
  }, [clienteId])

  // Si hay ventaDirecta, ir directo al componente RegistrarAbono
  if (ventaDirecta) {
    return (
      <RegistrarAbono
        ventaId={ventaDirecta}
        onBack={() => {
          setVentaDirecta(null)
          fetchVentas()
        }}
        onAbonoRegistrado={() => {
          setVentaDirecta(null)
          onAbonoFinalizado?.()
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <p className="text-slate-600">Cargando ventas pendientes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <p className="text-red-600 font-medium">Error:</p>
        <p className="text-slate-700 mt-1">{error}</p>
      </div>
    )
  }

  if (!ventas.length && !ventaSeleccionada) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Ventas Pendientes
        </h2>
        <p className="text-slate-600">
          Este cliente no tiene ventas pendientes.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!ventaSeleccionada && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Ventas Pendientes
          </h2>

          <div className="space-y-4">
            {ventas.map((venta) => {
              const esVentaDestacada = ventaDestacadaId != null && String(venta.id) === ventaDestacadaId
              return (
              <div
                key={venta.id}
                className={`border rounded-lg p-4 ${
                  esVentaDestacada
                    ? 'border-blue-400 bg-blue-50/40 ring-1 ring-blue-200'
                    : 'border-slate-200'
                }`}
              >
                {esVentaDestacada && (
                  <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">
                    ⭐ Venta con la boleta buscada
                  </p>
                )}
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    {/* Rifa nombre si está disponible */}
                    {venta.boletas && venta.boletas.length > 0 && venta.boletas[0].rifa_nombre && (
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                        {venta.boletas[0].rifa_nombre}
                      </p>
                    )}

                    {/* Boletas */}
                    {venta.boletas && venta.boletas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 my-1.5">
                        {venta.boletas.map((b) => {
                          const esBoletaBuscada = boletaDestacada != null && b.numero === boletaDestacada
                          return (
                          <span
                            key={b.id}
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                              esBoletaBuscada
                                ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                                : b.estado === 'PAGADA' ? 'bg-green-100 text-green-700' :
                                b.estado === 'ABONADA' ? 'bg-yellow-100 text-yellow-700' :
                                b.estado === 'RESERVADA' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-600'
                            }`}
                          >
                            🎫 #{b.numero.toString().padStart(4, '0')}
                            {esBoletaBuscada && <span>← buscada</span>}
                            <span className="opacity-70">
                              {b.estado === 'PAGADA' ? '✅' :
                               b.estado === 'ABONADA' ? '💰' :
                               b.estado === 'RESERVADA' ? '🔒' : ''}
                            </span>
                          </span>
                        )})}
                      </div>
                    )}

                    <p className="text-xs text-slate-400">
                      {new Date(venta.created_at).toLocaleDateString()}
                    </p>

                    <div className="flex gap-4 text-sm mt-1">
                      <span className="text-slate-700">
                        Total: <strong>${venta.monto_total.toLocaleString('es-CO')}</strong>
                      </span>
                      <span className="text-green-600">
                        Pagado: ${venta.total_pagado.toLocaleString('es-CO')}
                      </span>
                      <span className="text-red-600 font-semibold">
                        Saldo: ${venta.saldo_pendiente.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setVentaSeleccionada(venta)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm ml-3 flex-shrink-0"
                  >
                    Gestionar
                  </button>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      {ventaSeleccionada && (
        <RegistrarAbono
          ventaId={ventaSeleccionada.id.toString()}
          onBack={() => {
            setVentaSeleccionada(null)
            fetchVentas()
          }}
          onAbonoRegistrado={() => {
            setVentaSeleccionada(null)
            onAbonoFinalizado?.()
          }}
        />
      )}
    </div>
  )
}