'use client'

import { useCallback, useEffect, useState } from 'react'
import { historialApi, labelAccion, ENTIDAD_LABELS } from '@/lib/historialApi'
import { MovimientoHistorial } from '@/types/historial'
import { formatoMonedaCOP } from '@/utils/formatPesos'

interface ClienteHistorialMovimientosProps {
  clienteId: string
}

const ENTIDAD_COLORS: Record<string, string> = {
  BOLETA: 'bg-sky-100 text-sky-800',
  ABONO: 'bg-emerald-100 text-emerald-800',
  VENTA: 'bg-violet-100 text-violet-800',
}

const ROL_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  VENDEDOR: 'Vendedor',
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatBoleta(numero: number | null) {
  if (numero == null) return '—'
  return `#${String(numero).padStart(4, '0')}`
}

export default function ClienteHistorialMovimientos({ clienteId }: ClienteHistorialMovimientosProps) {
  const [movimientos, setMovimientos] = useState<MovimientoHistorial[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const limit = 25

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await historialApi.getByCliente(clienteId, { limit, offset })
      setMovimientos(res.movimientos || [])
      setTotal(res.total ?? 0)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar movimientos'
      if (msg.includes('403') || msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('permisos')) {
        setForbidden(true)
      } else {
        setError(msg)
      }
      setMovimientos([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [clienteId, offset])

  useEffect(() => {
    cargar()
  }, [cargar])

  if (forbidden) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
        <p className="text-slate-600 font-medium">Sin permiso para ver el historial de movimientos.</p>
        <p className="text-slate-400 text-sm mt-1">Disponible para Admin y Super Admin.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 flex justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Cargando movimientos…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {error}
      </div>
    )
  }

  if (movimientos.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="text-4xl mb-3">📜</div>
        <p className="text-slate-600 font-medium">Sin movimientos registrados para este cliente</p>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
          Se registran automáticamente asignaciones de boletas, abonos, liberaciones y cambios de estado
          desde la activación del historial.
        </p>
      </div>
    )
  }

  const paginas = Math.max(1, Math.ceil(total / limit))
  const paginaActual = Math.floor(offset / limit) + 1

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          <span className="font-bold text-black">{total}</span> movimiento{total !== 1 ? 's' : ''} de boletas, abonos y ventas
        </p>
        <button
          type="button"
          onClick={() => cargar()}
          className="text-xs text-slate-500 hover:text-slate-900 font-medium"
        >
          Actualizar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Acción</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Boleta</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">Monto</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Realizado por</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movimientos.map((mov) => {
              const monto = mov.monto != null ? Number(mov.monto) : null
              return (
                <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                    {formatFecha(mov.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${ENTIDAD_COLORS[mov.entidad] || 'bg-slate-100 text-slate-700'}`}>
                      {ENTIDAD_LABELS[mov.entidad] || mov.entidad}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-black">
                    {labelAccion(mov.accion)}
                  </td>
                  <td className="px-4 py-3">
                    {mov.numero != null ? (
                      <span className="bg-slate-100 px-2 py-1 rounded font-mono font-bold text-black text-sm">
                        {formatBoleta(mov.numero)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {(mov.estado_anterior || mov.estado_nuevo) ? (
                      <span className="inline-flex items-center gap-1 flex-wrap">
                        {mov.estado_anterior && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{mov.estado_anterior}</span>
                        )}
                        {mov.estado_anterior && mov.estado_nuevo && <span className="text-slate-400">→</span>}
                        {mov.estado_nuevo && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">{mov.estado_nuevo}</span>
                        )}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-emerald-700">
                    {monto && monto > 0 ? formatoMonedaCOP(monto) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {mov.usuario_nombre ? (
                      <div>
                        <p className="font-medium text-black">{mov.usuario_nombre}</p>
                        {mov.usuario_rol && (
                          <p className="text-[11px] text-slate-500">
                            {ROL_LABELS[mov.usuario_rol] || mov.usuario_rol}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {total > limit && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
            className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 text-slate-600 hover:bg-white"
          >
            Anterior
          </button>
          <span className="text-xs text-slate-500">
            Página {paginaActual} de {paginas}
          </span>
          <button
            type="button"
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 text-slate-600 hover:bg-white"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
