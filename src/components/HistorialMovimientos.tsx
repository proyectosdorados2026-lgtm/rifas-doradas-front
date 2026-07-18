'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { historialApi, labelAccion, ENTIDAD_LABELS } from '@/lib/historialApi'
import { clienteApi } from '@/lib/clienteApi'
import { rifaApi } from '@/lib/rifaApi'
import { MovimientoHistorial } from '@/types/historial'
import { Cliente } from '@/types/cliente'
import { Rifa } from '@/types/rifa'
import { formatoMonedaCOP } from '@/utils/formatPesos'

type ModoBusqueda = 'recientes' | 'boleta' | 'cliente'

const ENTIDAD_COLORS: Record<string, string> = {
  BOLETA: 'bg-sky-100 text-sky-800 border-sky-200',
  ABONO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  VENTA: 'bg-violet-100 text-violet-800 border-violet-200',
}

const ACCION_COLORS: Record<string, string> = {
  LIBERAR_BOLETA: 'text-amber-700',
  LIBERAR_CLIENTE: 'text-amber-700',
  ABONO_ANULADO: 'text-red-700',
  ASIGNAR_CLIENTE: 'text-indigo-700',
  CAMBIO_ESTADO: 'text-slate-700',
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

const ROL_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  VENDEDOR: 'Vendedor',
}

function formatUsuario(mov: MovimientoHistorial) {
  if (mov.usuario_nombre) {
    const rol = mov.usuario_rol ? ROL_LABELS[mov.usuario_rol] || mov.usuario_rol : null
    return { nombre: mov.usuario_nombre, rol }
  }
  if (mov.origen?.includes('public') || mov.origen?.includes('online')) {
    return { nombre: 'Venta online', rol: null }
  }
  return { nombre: null, rol: null }
}

function formatBoleta(numero: number | null) {
  if (numero == null) return '—'
  return `#${String(numero).padStart(4, '0')}`
}

function MovimientoRow({ mov, expanded, onToggle }: {
  mov: MovimientoHistorial
  expanded: boolean
  onToggle: () => void
}) {
  const monto = mov.monto != null ? Number(mov.monto) : null
  const cliente =
    mov.cliente_nombre ||
    mov.cliente_anterior_nombre ||
    null
  const ident =
    mov.cliente_identificacion ||
    mov.cliente_anterior_identificacion ||
    null
  const usuario = formatUsuario(mov)

  return (
    <>
      <tr
        className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap align-top">
          {formatFecha(mov.created_at)}
        </td>
        <td className="px-4 py-3 align-top">
          <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold border ${ENTIDAD_COLORS[mov.entidad] || 'bg-slate-100 text-slate-700'}`}>
            {ENTIDAD_LABELS[mov.entidad] || mov.entidad}
          </span>
        </td>
        <td className={`px-4 py-3 text-sm font-medium align-top ${ACCION_COLORS[mov.accion] || 'text-slate-800'}`}>
          {labelAccion(mov.accion)}
        </td>
        <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-800 align-top">
          {formatBoleta(mov.numero)}
        </td>
        <td className="px-4 py-3 text-sm align-top">
          {usuario.nombre ? (
            <div>
              <p className="font-medium text-slate-800">{usuario.nombre}</p>
              {usuario.rol && (
                <p className="text-[11px] text-indigo-600 font-medium">{usuario.rol}</p>
              )}
            </div>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm align-top">
          {cliente ? (
            <div>
              <p className="font-medium text-slate-800">{cliente}</p>
              {ident && <p className="text-xs text-slate-400">{ident}</p>}
              {mov.cliente_anterior_nombre && mov.cliente_nombre && (
                <p className="text-[11px] text-amber-600 mt-0.5">
                  Antes: {mov.cliente_anterior_nombre}
                </p>
              )}
            </div>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs align-top">
          {(mov.estado_anterior || mov.estado_nuevo) ? (
            <span className="inline-flex items-center gap-1 flex-wrap">
              {mov.estado_anterior && (
                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{mov.estado_anterior}</span>
              )}
              {mov.estado_anterior && mov.estado_nuevo && <span className="text-slate-400">→</span>}
              {mov.estado_nuevo && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">{mov.estado_nuevo}</span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-emerald-700 align-top whitespace-nowrap">
          {monto && monto > 0 ? formatoMonedaCOP(monto) : '—'}
        </td>
        <td className="px-4 py-3 text-[11px] text-slate-400 align-top max-w-[120px] truncate" title={mov.origen}>
          {mov.origen.replace('db_trigger', 'Sistema')}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50/60 border-b border-slate-100">
          <td colSpan={9} className="px-4 py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {mov.notas && (
                <div>
                  <p className="font-semibold text-slate-500 uppercase tracking-wide mb-1">Notas</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{mov.notas}</p>
                </div>
              )}
              {mov.usuario_nombre && (
                <div>
                  <p className="font-semibold text-slate-500 uppercase tracking-wide mb-1">Usuario</p>
                  <p className="text-slate-700">{mov.usuario_nombre}</p>
                </div>
              )}
              {mov.venta_id && (
                <div>
                  <p className="font-semibold text-slate-500 uppercase tracking-wide mb-1">Venta ID</p>
                  <p className="text-slate-600 font-mono break-all">{mov.venta_id}</p>
                </div>
              )}
              {mov.abono_id && (
                <div>
                  <p className="font-semibold text-slate-500 uppercase tracking-wide mb-1">Abono ID</p>
                  <p className="text-slate-600 font-mono break-all">{mov.abono_id}</p>
                </div>
              )}
              {mov.metadata && Object.keys(mov.metadata).length > 0 && (
                <div className="md:col-span-2">
                  <p className="font-semibold text-slate-500 uppercase tracking-wide mb-1">Detalle técnico</p>
                  <pre className="text-[11px] bg-white border border-slate-200 rounded-lg p-3 overflow-x-auto text-slate-600">
                    {JSON.stringify(mov.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function HistorialMovimientos() {
  const [modo, setModo] = useState<ModoBusqueda>('recientes')
  const [entidad, setEntidad] = useState<'BOLETA' | 'ABONO' | 'VENTA' | ''>('')
  const [rifaId, setRifaId] = useState('')
  const [rifas, setRifas] = useState<Rifa[]>([])
  const [numeroBoleta, setNumeroBoleta] = useState('')
  const [clienteSearch, setClienteSearch] = useState('')
  const [clientesSugeridos, setClientesSugeridos] = useState<Cliente[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoHistorial[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const limit = 30

  useEffect(() => {
    rifaApi.getRifasOperativas('ACTIVA').then((res) => {
      const list = res.data || []
      setRifas(list)
      if (list.length > 0 && !rifaId) {
        setRifaId(list[0].id)
      }
    }).catch(() => {})
  }, [rifaId])

  useEffect(() => {
    if (modo !== 'cliente' || clienteSearch.trim().length < 2) {
      setClientesSugeridos([])
      return
    }
    const t = setTimeout(() => {
      clienteApi.getClientes(1, 8, clienteSearch.trim()).then((res) => {
        setClientesSugeridos(res.data || [])
      }).catch(() => setClientesSugeridos([]))
    }, 350)
    return () => clearTimeout(t)
  }, [clienteSearch, modo])

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let res
      if (modo === 'boleta') {
        const num = parseInt(numeroBoleta, 10)
        if (!rifaId || Number.isNaN(num)) {
          setMovimientos([])
          setTotal(0)
          setLoading(false)
          return
        }
        res = await historialApi.getByNumero(rifaId, num, { limit, offset })
      } else if (modo === 'cliente') {
        if (!clienteSeleccionado) {
          setMovimientos([])
          setTotal(0)
          setLoading(false)
          return
        }
        res = await historialApi.getByCliente(clienteSeleccionado.id, { limit, offset })
      } else {
        res = await historialApi.getRecientes({
          limit,
          offset,
          entidad,
          rifaId: rifaId || undefined,
        })
      }
      setMovimientos(res.movimientos || [])
      setTotal(res.total ?? res.movimientos?.length ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar historial')
      setMovimientos([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [modo, entidad, rifaId, numeroBoleta, clienteSeleccionado, offset])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    setOffset(0)
  }, [modo, entidad, rifaId, numeroBoleta, clienteSeleccionado?.id])

  const paginas = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])
  const paginaActual = Math.floor(offset / limit) + 1

  return (
    <div className="space-y-5">
      {/* Modo de búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap gap-2 mb-4">
          {([
            ['recientes', 'Actividad reciente'],
            ['boleta', 'Por boleta'],
            ['cliente', 'Por cliente'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setModo(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                modo === key
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Proyecto</label>
            <select
              value={rifaId}
              onChange={(e) => setRifaId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none"
            >
              {rifas.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>

          {modo === 'recientes' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Tipo</label>
              <select
                value={entidad}
                onChange={(e) => setEntidad(e.target.value as typeof entidad)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none"
              >
                <option value="">Todos</option>
                <option value="BOLETA">Boletas</option>
                <option value="ABONO">Abonos</option>
                <option value="VENTA">Ventas</option>
              </select>
            </div>
          )}

          {modo === 'boleta' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Número boleta</label>
              <input
                type="number"
                min={0}
                max={9999}
                placeholder="Ej: 3128"
                value={numeroBoleta}
                onChange={(e) => setNumeroBoleta(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none"
              />
            </div>
          )}

          {modo === 'cliente' && (
            <div className="md:col-span-2 relative">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Buscar cliente</label>
              <input
                type="text"
                placeholder="Nombre, cédula o teléfono…"
                value={clienteSeleccionado ? clienteSeleccionado.nombre : clienteSearch}
                onChange={(e) => {
                  setClienteSeleccionado(null)
                  setClienteSearch(e.target.value)
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none"
              />
              {clienteSeleccionado && (
                <button
                  type="button"
                  onClick={() => { setClienteSeleccionado(null); setClienteSearch('') }}
                  className="absolute right-2 top-8 text-xs text-red-500 hover:text-red-700"
                >
                  Limpiar
                </button>
              )}
              {!clienteSeleccionado && clientesSugeridos.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  {clientesSugeridos.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 text-sm border-b border-slate-50 last:border-0"
                        onClick={() => {
                          setClienteSeleccionado(c)
                          setClienteSearch('')
                          setClientesSugeridos([])
                        }}
                      >
                        <span className="font-medium text-slate-800">{c.nombre}</span>
                        {c.identificacion && (
                          <span className="text-slate-400 ml-2">{c.identificacion}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <p>
            {total} registro{total !== 1 ? 's' : ''}
            {modo === 'recientes' && ' · Solo movimientos desde la activación del historial'}
          </p>
          <button
            type="button"
            onClick={() => cargar()}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {error && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
            {error.includes('404') || error.includes('not found') ? (
              <span className="block mt-1 text-xs text-red-500">
                Verifica que el backend esté desplegado con el módulo /api/historial
              </span>
            ) : null}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-500 text-sm">Cargando historial…</span>
          </div>
        ) : movimientos.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-slate-600 font-medium">Sin movimientos registrados</p>
            <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
              {modo === 'boleta' && !numeroBoleta
                ? 'Ingresa un número de boleta para ver su historial.'
                : modo === 'cliente' && !clienteSeleccionado
                  ? 'Busca y selecciona un cliente.'
                  : 'Los cambios de boletas, abonos y ventas aparecerán aquí automáticamente.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left">
                    <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Acción</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Boleta</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Realizado por</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Cliente</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Monto</th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Origen</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((mov) => (
                    <MovimientoRow
                      key={mov.id}
                      mov={mov}
                      expanded={expandedId === mov.id}
                      onToggle={() => setExpandedId(expandedId === mov.id ? null : mov.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {total > limit && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                <button
                  type="button"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200"
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
                  className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 text-slate-600 hover:bg-white border border-transparent hover:border-slate-200"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Haz clic en una fila para ver detalles técnicos · Registro append-only (no editable)
      </p>
    </div>
  )
}
