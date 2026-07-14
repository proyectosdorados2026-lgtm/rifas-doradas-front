'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import {
  superadminVentasApi,
  type SAVentaResumen,
  type SAVentaDetalle,
  type SAAbono,
  type SABoleta,
} from '@/lib/superadminVentasApi'
import { formatBoletaNumeros } from '@/utils/formatBoletaNumeros'

type ConfirmState = {
  title: string
  message: string
  type?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
} | null

const ESTADOS_VENTA = ['PENDIENTE', 'ABONADA', 'PAGADA', 'CANCELADA']

function money(n: string | number) {
  const v = typeof n === 'string' ? Number(n) : n
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v || 0)
}

function badgeColor(estado: string) {
  switch (estado) {
    case 'PAGADA': return 'bg-emerald-100 text-emerald-700'
    case 'ABONADA': return 'bg-amber-100 text-amber-700'
    case 'RESERVADA': return 'bg-blue-100 text-blue-700'
    case 'PENDIENTE': return 'bg-slate-100 text-slate-700'
    case 'CANCELADA': case 'ANULADO': return 'bg-red-100 text-red-700'
    case 'DISPONIBLE': return 'bg-slate-100 text-slate-500'
    default: return 'bg-slate-100 text-slate-700'
  }
}

export default function SuperadminVentasPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; nombre: string; rol: string } | null>(null)

  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState<SAVentaResumen[]>([])
  const [buscando, setBuscando] = useState(false)
  const [detalle, setDetalle] = useState<SAVentaDetalle | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [procesando, setProcesando] = useState(false)

  // Inputs de acciones
  const [nuevoAbonoMonto, setNuevoAbonoMonto] = useState('')
  const [nuevoAbonoMedio, setNuevoAbonoMedio] = useState('')
  const [nuevoAbonoBoleta, setNuevoAbonoBoleta] = useState('')
  const [agregarBoletaId, setAgregarBoletaId] = useState('')
  const [reasignarClienteId, setReasignarClienteId] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (!token || !userData) { router.push('/login'); return }
    try {
      const parsed = JSON.parse(userData)
      if (parsed.rol?.toUpperCase() !== 'SUPER_ADMIN') {
        router.push('/dashboard')
        return
      }
      setUser(parsed)
    } catch { router.push('/login') }
  }, [router])

  const buscar = async () => {
    if (!q.trim()) return
    setError(''); setAviso(''); setBuscando(true); setResultados([])
    try {
      const data = await superadminVentasApi.buscar(q.trim())
      setResultados(data)
      if (data.length === 0) setAviso('No se encontraron ventas con ese criterio.')
    } catch (e: any) {
      setError(e.message || 'Error al buscar')
    } finally {
      setBuscando(false)
    }
  }

  const abrirDetalle = async (ventaId: string) => {
    setError(''); setAviso(''); setCargandoDetalle(true); setDetalle(null)
    try {
      const data = await superadminVentasApi.getDetalle(ventaId)
      setDetalle(data)
    } catch (e: any) {
      setError(e.message || 'Error al cargar el detalle')
    } finally {
      setCargandoDetalle(false)
    }
  }

  const refrescar = useCallback(async () => {
    if (!detalle) return
    const data = await superadminVentasApi.getDetalle(detalle.venta.venta_id)
    setDetalle(data)
  }, [detalle])

  // Ejecutor genérico con manejo de estado/errores.
  const ejecutar = async (fn: () => Promise<SAVentaDetalle | any>, okMsg: string, esEliminar = false) => {
    setProcesando(true); setError(''); setAviso('')
    try {
      const res = await fn()
      if (esEliminar) {
        setDetalle(null)
        setResultados((prev) => prev.filter((r) => r.venta_id !== res.venta_id))
      } else if (res && res.venta) {
        setDetalle(res)
      }
      setAviso(okMsg)
    } catch (e: any) {
      setError(e.message || 'Error al procesar la acción')
    } finally {
      setProcesando(false)
      setConfirm(null)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 text-sm">Cargando...</span>
        </div>
      </div>
    )
  }

  const v = detalle?.venta

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <button onClick={() => router.push('/dashboard')} className="text-sm text-slate-500 hover:text-slate-800 mb-1">
              ← Dashboard
            </button>
            <h1 className="text-xl font-bold text-slate-900">Edición de Ventas (Super Admin)</h1>
            <p className="text-xs text-slate-500">Editar abonos, métodos de pago, liberar boletas, estados y más.</p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
            Acceso exclusivo Super Admin
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Buscador */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Buscar venta por número de boleta, cédula, nombre o teléfono del cliente
          </label>
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && buscar()}
              placeholder="Ej: 2612  ó  Juan Pérez  ó  1032456789"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={buscar}
              disabled={buscando}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {buscando ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
        )}
        {aviso && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">{aviso}</div>
        )}

        {/* Resultados */}
        {resultados.length > 0 && !detalle && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Rifa</th>
                  <th className="px-4 py-3 font-medium">Boletas</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((r) => (
                  <tr key={r.venta_id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{r.cliente_nombre}</div>
                      <div className="text-xs text-slate-500">{r.cliente_identificacion || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.rifa_nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{r.num_boletas}</td>
                    <td className="px-4 py-3 text-slate-800">{money(r.monto_total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor(r.estado_venta)}`}>
                        {r.estado_venta}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => abrirDetalle(r.venta_id)} className="text-indigo-600 hover:text-indigo-800 font-medium">
                        Editar →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {cargandoDetalle && (
          <div className="flex items-center gap-3 text-slate-500 text-sm py-8 justify-center">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            Cargando detalle...
          </div>
        )}

        {/* Detalle / edición */}
        {v && (
          <div className="space-y-6">
            <button onClick={() => setDetalle(null)} className="text-sm text-slate-500 hover:text-slate-800">
              ← Volver a resultados
            </button>

            {/* Resumen de la venta */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{v.cliente_nombre}</h2>
                  <p className="text-sm text-slate-500">{v.cliente_identificacion || '—'} · {v.cliente_telefono || '—'}</p>
                  <p className="text-sm text-slate-500 mt-1">{v.rifa_nombre} · Boleta {money(v.precio_boleta)}</p>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${badgeColor(v.estado_venta)}`}>
                  {v.estado_venta}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Monto total</p>
                  <p className="font-bold text-slate-800">{money(v.monto_total)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Abonado</p>
                  <p className="font-bold text-emerald-600">{money(v.abono_total)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Saldo</p>
                  <p className="font-bold text-amber-600">{money(v.saldo_pendiente)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Método</p>
                  <p className="font-medium text-slate-700">{v.medio_pago_nombre || v.gateway_pago || '—'}</p>
                </div>
              </div>

              {/* Acciones a nivel venta */}
              <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Estado:</span>
                  <select
                    value={v.estado_venta}
                    onChange={(e) => {
                      const nuevo = e.target.value
                      if (nuevo === v.estado_venta) return
                      setConfirm({
                        title: 'Cambiar estado de la venta',
                        message: nuevo === 'CANCELADA'
                          ? 'CANCELAR la venta anulará sus abonos y liberará sus boletas. ¿Continuar?'
                          : `¿Cambiar el estado de la venta a ${nuevo}?`,
                        type: nuevo === 'CANCELADA' ? 'danger' : 'warning',
                        onConfirm: () => ejecutar(() => superadminVentasApi.cambiarEstado(v.venta_id, nuevo), 'Estado actualizado.'),
                      })
                    }}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  >
                    {ESTADOS_VENTA.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Método:</span>
                  <select
                    value={v.medio_pago_id || ''}
                    onChange={(e) => {
                      const medio = e.target.value
                      if (!medio) return
                      setConfirm({
                        title: 'Cambiar método de pago de la venta',
                        message: '¿Actualizar el método de pago general de esta venta?',
                        type: 'warning',
                        onConfirm: () => ejecutar(() => superadminVentasApi.cambiarMedioPago(v.venta_id, medio), 'Método de pago actualizado.'),
                      })
                    }}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    {detalle!.medios_pago.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </div>

                <button
                  onClick={() => setConfirm({
                    title: 'Eliminar venta',
                    message: 'Se eliminará la venta por completo, se borrarán sus abonos y se liberarán sus boletas. Esta acción no se puede deshacer. ¿Continuar?',
                    type: 'danger',
                    onConfirm: () => ejecutar(() => superadminVentasApi.eliminarVenta(v.venta_id), 'Venta eliminada.', true),
                  })}
                  className="ml-auto px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
                >
                  Eliminar venta
                </button>
              </div>

              {/* Reasignar cliente */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-xs text-slate-500">Reasignar a cliente (ID):</span>
                <input
                  value={reasignarClienteId}
                  onChange={(e) => setReasignarClienteId(e.target.value)}
                  placeholder="UUID del cliente destino"
                  className="flex-1 min-w-[220px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
                <button
                  disabled={!reasignarClienteId.trim()}
                  onClick={() => setConfirm({
                    title: 'Reasignar cliente',
                    message: '¿Reasignar esta venta y sus boletas al cliente indicado?',
                    type: 'warning',
                    onConfirm: () => ejecutar(async () => {
                      const r = await superadminVentasApi.reasignarCliente(v.venta_id, reasignarClienteId.trim())
                      setReasignarClienteId('')
                      return r
                    }, 'Cliente reasignado.'),
                  })}
                  className="px-3 py-1.5 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50 font-medium"
                >
                  Reasignar
                </button>
              </div>
            </div>

            {/* Boletas */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Boletas ({detalle!.boletas.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-500 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Número</th>
                      <th className="px-3 py-2 font-medium">Estado</th>
                      <th className="px-3 py-2 font-medium">Pagado</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle!.boletas.map((b: SABoleta) => (
                      <tr key={b.boleta_id} className="border-t border-slate-100">
                        <td className="px-3 py-2 font-medium text-slate-800">{formatBoletaNumeros(b.numeros, b.numero)}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor(b.estado)}`}>{b.estado}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{money(b.pagado_boleta)}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => setConfirm({
                              title: `Liberar boleta ${formatBoletaNumeros(b.numeros, b.numero)}`,
                              message: 'La boleta volverá a DISPONIBLE, se anularán sus abonos ligados y se recalculará el total de la venta. ¿Continuar?',
                              type: 'danger',
                              onConfirm: () => ejecutar(() => superadminVentasApi.liberarBoleta(b.boleta_id), `Boleta ${formatBoletaNumeros(b.numeros, b.numero)} liberada.`),
                            })}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Liberar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Agregar boleta */}
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500">Agregar boleta (ID):</span>
                <input
                  value={agregarBoletaId}
                  onChange={(e) => setAgregarBoletaId(e.target.value)}
                  placeholder="UUID de una boleta DISPONIBLE de la misma rifa"
                  className="flex-1 min-w-[220px] rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
                <button
                  disabled={!agregarBoletaId.trim()}
                  onClick={() => setConfirm({
                    title: 'Agregar boleta a la venta',
                    message: '¿Vincular la boleta indicada a esta venta? Se recalculará el total.',
                    type: 'warning',
                    onConfirm: () => ejecutar(async () => {
                      const r = await superadminVentasApi.agregarBoleta(v.venta_id, agregarBoletaId.trim())
                      setAgregarBoletaId('')
                      return r
                    }, 'Boleta agregada.'),
                  })}
                  className="px-3 py-1.5 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50 font-medium"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* Abonos */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Abonos ({detalle!.abonos.length})</h3>
              <div className="space-y-3">
                {detalle!.abonos.map((a: SAAbono) => (
                  <AbonoRow
                    key={a.abono_id}
                    abono={a}
                    medios={detalle!.medios_pago}
                    disabled={procesando}
                    onEditar={(monto, medio) => setConfirm({
                      title: 'Editar abono',
                      message: `¿Guardar los cambios del abono?`,
                      type: 'warning',
                      onConfirm: () => ejecutar(() => superadminVentasApi.editarAbono(a.abono_id, { monto, medio_pago_id: medio }), 'Abono actualizado.'),
                    })}
                    onAnular={() => setConfirm({
                      title: 'Anular abono',
                      message: 'El abono quedará ANULADO y se recalcularán los totales de la venta. ¿Continuar?',
                      type: 'danger',
                      onConfirm: () => ejecutar(() => superadminVentasApi.anularAbono(a.abono_id), 'Abono anulado.'),
                    })}
                  />
                ))}
                {detalle!.abonos.length === 0 && (
                  <p className="text-sm text-slate-500">Esta venta no tiene abonos registrados.</p>
                )}
              </div>

              {/* Agregar abono */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-700 mb-2">Agregar abono</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    value={nuevoAbonoMonto}
                    onChange={(e) => setNuevoAbonoMonto(e.target.value)}
                    placeholder="Monto"
                    className="w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                  <select
                    value={nuevoAbonoMedio}
                    onChange={(e) => setNuevoAbonoMedio(e.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">Método...</option>
                    {detalle!.medios_pago.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                  <select
                    value={nuevoAbonoBoleta}
                    onChange={(e) => setNuevoAbonoBoleta(e.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">Boleta (opcional)...</option>
                    {detalle!.boletas.map((b) => <option key={b.boleta_id} value={b.boleta_id}>{formatBoletaNumeros(b.numeros, b.numero)}</option>)}
                  </select>
                  <button
                    disabled={!nuevoAbonoMonto || Number(nuevoAbonoMonto) <= 0}
                    onClick={() => setConfirm({
                      title: 'Agregar abono',
                      message: `¿Registrar un abono de ${money(nuevoAbonoMonto)}?`,
                      type: 'warning',
                      onConfirm: () => ejecutar(async () => {
                        const r = await superadminVentasApi.agregarAbono(v.venta_id, {
                          monto: Number(nuevoAbonoMonto),
                          medio_pago_id: nuevoAbonoMedio || undefined,
                          boleta_id: nuevoAbonoBoleta || undefined,
                        })
                        setNuevoAbonoMonto(''); setNuevoAbonoMedio(''); setNuevoAbonoBoleta('')
                        return r
                      }, 'Abono agregado.'),
                    })}
                    className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 font-medium"
                  >
                    Agregar abono
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {confirm && (
        <ConfirmDialog
          isOpen={!!confirm}
          title={confirm.title}
          message={confirm.message}
          type={confirm.type}
          confirmText={procesando ? 'Procesando...' : 'Confirmar'}
          onConfirm={confirm.onConfirm}
          onCancel={() => !procesando && setConfirm(null)}
        />
      )}
    </div>
  )
}

// ─── Fila de abono editable ───
function AbonoRow({
  abono,
  medios,
  disabled,
  onEditar,
  onAnular,
}: {
  abono: SAAbono
  medios: { id: string; nombre: string }[]
  disabled: boolean
  onEditar: (monto: number, medio?: string) => void
  onAnular: () => void
}) {
  const [editando, setEditando] = useState(false)
  const [monto, setMonto] = useState(String(Number(abono.monto)))
  const [medio, setMedio] = useState(abono.medio_pago_id || '')
  const anulado = abono.estado === 'ANULADO'

  return (
    <div className={`rounded-xl border p-3 ${anulado ? 'border-red-100 bg-red-50/40' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badgeColor(abono.estado)}`}>{abono.estado}</span>
          <span className="font-semibold text-slate-800">{money(abono.monto)}</span>
          <span className="text-xs text-slate-500">{abono.medio_pago_nombre || abono.gateway_pago || '—'}</span>
          {(abono.boleta_numero != null || (abono.boleta_numeros && abono.boleta_numeros.length > 0)) && (
            <span className="text-xs text-slate-400">
              Boleta {formatBoletaNumeros(abono.boleta_numeros, abono.boleta_numero)}
            </span>
          )}
        </div>
        {!anulado && (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditando((s) => !s)} disabled={disabled} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              {editando ? 'Cancelar' : 'Editar'}
            </button>
            <button onClick={onAnular} disabled={disabled} className="text-red-600 hover:text-red-800 text-sm font-medium">
              Anular
            </button>
          </div>
        )}
      </div>

      {editando && !anulado && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <input
            type="number"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <select value={medio} onChange={(e) => setMedio(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">Mantener método</option>
            {medios.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
          <button
            disabled={disabled || !monto || Number(monto) <= 0}
            onClick={() => onEditar(Number(monto), medio || undefined)}
            className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            Guardar
          </button>
        </div>
      )}

      {abono.notas && <p className="text-[11px] text-slate-400 mt-2 break-words">{abono.notas}</p>}
    </div>
  )
}
